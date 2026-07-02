package com.example.outletmanagement.integration;

import com.example.outletmanagement.model.entity.StockOrder;
import com.example.outletmanagement.repository.StockOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Async HTTP client for communicating with the Inventory Management System.
 * <p>
 * The {@link #pushStockRequest(Long)} method runs on the {@code imsTaskExecutor} thread pool
 * so a slow or down IMS never blocks the outlet admin's workflow.
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryApiClient {

    private final RestTemplate imsRestTemplate;
    private final StockOrderRepository stockOrderRepository;
    private final com.example.outletmanagement.repository.StockReturnRepository stockReturnRepository;

    @Value("${ims.base-url:http://localhost:8081}")
    private String imsBaseUrl;

    @Value("${ims.api-key:}")
    private String imsApiKey;

    @Value("${ims.orders-api-token:}")
    private String imsOrdersApiToken;

    /**
     * Sends the approved stock order to the IMS asynchronously.
     * On success: order.imsPushStatus = "IMS_PUSHED"
     * On failure: order.imsPushStatus = "IMS_PUSH_FAILED" (does NOT block the order workflow)
     *
     * @param orderId the ID of the StockOrder to push
     */
    @Async("imsTaskExecutor")
    public void pushStockRequest(Long orderId) {
        StockOrder order = stockOrderRepository.findByIdWithDetails(orderId).orElse(null);
        if (order == null) {
            log.warn("[IMS] Cannot push order id={} — not found in DB", orderId);
            return;
        }

        // Fetch IMS catalog to map local productCode back to IMS productId
        java.util.Map<String, Long> productCodeToImsIdMap = new java.util.HashMap<>();
        try {
            for (var p : fetchFullWarehouseProducts("")) {
                productCodeToImsIdMap.put(p.getProductCode(), p.getId());
            }
        } catch (Exception e) {
            log.warn("[IMS] Failed to fetch IMS catalog for ID mapping: {}", e.getMessage());
        }

        List<DevTunnelOrderItemDto> devTunnelItems = order.getItems().stream()
                .map(item -> {
                    String code = item.getProduct().getProductCode();
                    Long imsId = productCodeToImsIdMap.get(code);
                    if (imsId == null) {
                        log.warn("[IMS] Could not map local product code {} to IMS ID, fallback to local ID", code);
                        imsId = item.getProduct().getId();
                    }
                    return new DevTunnelOrderItemDto(imsId, item.getQuantityRequested(), 0.0, 0.0);
                })
                .collect(Collectors.toList());

        DevTunnelOrderRequestDto dto = new DevTunnelOrderRequestDto();
        dto.setCustomerId(1L); // Hardcoded to 1 to match a valid customer in DevTunnel IMS
        dto.setCustomerName("OMS Outlet");
        dto.setOrderItems(devTunnelItems);
        dto.setStatus("PENDING");
        dto.setPaymentStatus("PENDING");
        dto.setPaymentMethod("CASH");
        dto.setOnlinePaymentOption("");

        String endpoint = "https://flsrkbvh-8080.inc1.devtunnels.ms/api/v1/orders";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (imsApiKey != null && !imsApiKey.isBlank()) {
                headers.set("X-Api-Key", imsApiKey);
            }
            if (imsOrdersApiToken != null && !imsOrdersApiToken.isBlank()) {
                headers.set("Authorization", "Bearer " + imsOrdersApiToken);
            }
            headers.set("X-DevTunnels-Skip-AntiPhishing-Page", "true");

            HttpEntity<DevTunnelOrderRequestDto> request = new HttpEntity<>(dto, headers);
            ResponseEntity<String> response = imsRestTemplate.postForEntity(endpoint, request, String.class);

            log.info("[IMS] Purchase order pushed to DevTunnel for order={} → HTTP {}", order.getOrderCode(), response.getStatusCode());

            order.setImsPushStatus("IMS_PUSHED");
            stockOrderRepository.save(order);

        } catch (RestClientException ex) {
            log.warn("[IMS] Failed to push purchase order to DevTunnel for order={}: {}", order.getOrderCode(), ex.getMessage());
            order.setImsPushStatus("IMS_PUSH_FAILED");
            stockOrderRepository.save(order);
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    @lombok.Data
    public static class DevTunnelOrderRequestDto {
        private Long customerId;
        private String customerName;
        private List<DevTunnelOrderItemDto> orderItems;
        private String status;
        private String paymentStatus;
        private String paymentMethod;
        private String onlinePaymentOption;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class DevTunnelOrderItemDto {
        private Long productId;
        private Integer quantity;
        private Double discount;
        private Double gstpercentage;
    }

    private ImsStockRequestDto buildDto(StockOrder order) {
        List<ImsStockRequestDto.ImsItemDto> items = order.getItems().stream()
                .map(item -> new ImsStockRequestDto.ImsItemDto(
                        item.getProduct().getProductCode(),
                        item.getProduct().getName(),
                        item.getQuantityRequested()))
                .collect(Collectors.toList());

        return new ImsStockRequestDto(
                order.getOrderCode(),
                order.getOutlet().getOutletCode(),
                order.getOutlet().getOutletName(),
                order.getRequestedDate(),
                order.getNotes(),
                items);
    }

    public java.util.Map<String, Integer> fetchWarehouseAvailabilityMap(String outletCode) {
        String baseUrl = "https://flsrkbvh-8080.inc1.devtunnels.ms/api/v1";
        String endpoint = baseUrl + "/product?size=1000";
        try {
            HttpHeaders headers = new HttpHeaders();
            if (imsApiKey != null && !imsApiKey.isBlank()) {
                headers.set("X-Api-Key", imsApiKey);
            }
            if (imsOrdersApiToken != null && !imsOrdersApiToken.isBlank()) {
                headers.set("Authorization", "Bearer " + imsOrdersApiToken);
            }
            headers.set("X-DevTunnels-Skip-AntiPhishing-Page", "true");
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<Object> response = imsRestTemplate.exchange(
                    endpoint, org.springframework.http.HttpMethod.GET, request, Object.class);
            
            Object body = response.getBody();
            if (body != null) {
                java.util.List<?> dataList = null;
                if (body instanceof java.util.Map) {
                    java.util.Map<?, ?> mapBody = (java.util.Map<?, ?>) body;
                    if (mapBody.containsKey("data")) {
                        Object dataObj = mapBody.get("data");
                        if (dataObj instanceof java.util.Map && ((java.util.Map<?, ?>) dataObj).containsKey("content")) {
                            dataList = (java.util.List<?>) ((java.util.Map<?, ?>) dataObj).get("content");
                        } else if (dataObj instanceof java.util.List) {
                            dataList = (java.util.List<?>) dataObj;
                        }
                    } else if (mapBody.containsKey("content") && mapBody.get("content") instanceof java.util.List) {
                        dataList = (java.util.List<?>) mapBody.get("content");
                    }
                } else if (body instanceof java.util.List) {
                    dataList = (java.util.List<?>) body;
                }

                if (dataList != null) {
                    java.util.Map<String, Integer> map = new java.util.HashMap<>();
                    for (Object listElement : dataList) {
                        if (listElement instanceof java.util.Map) {
                            java.util.Map<?, ?> item = (java.util.Map<?, ?>) listElement;
                            Object codeObj = item.get("sku");
                            if (codeObj == null) codeObj = item.get("productCode");
                            if (codeObj == null) codeObj = item.get("product_code");
                            String code = codeObj != null ? String.valueOf(codeObj) : null;
                            if (code == null || code.trim().isEmpty()) {
                                code = "SKU-" + item.get("id");
                            }
                            
                            int qty = 0;
                            Object qtyObj = item.get("availableQuantity");
                            if (qtyObj == null) qtyObj = item.get("stockQuantity");
                            if (qtyObj == null) qtyObj = item.get("quantity");
                            
                            if (qtyObj instanceof Number) {
                                qty = ((Number) qtyObj).intValue();
                            } else if (qtyObj instanceof String) {
                                try { qty = Integer.parseInt((String) qtyObj); } catch (Exception ignore) {}
                            }
                            
                            if (code != null) map.put(code, qty);
                        }
                    }
                    return map;
                }
            }
        } catch (org.springframework.web.client.RestClientException ex) {
            log.warn("[IMS] Failed to fetch warehouse availability for outlet {}: {}", outletCode, ex.getMessage());
        }
        return java.util.Collections.emptyMap();
    }

    public java.util.List<com.example.outletmanagement.payload.dto.StockOrderDto.WarehouseProductsResponse.ImsWarehouseProductDto> fetchFullWarehouseProducts(String outletCode) {
        String baseUrl = "https://flsrkbvh-8080.inc1.devtunnels.ms/api/v1";
        String endpoint = baseUrl + "/product?size=1000";
        try {
            HttpHeaders headers = new HttpHeaders();
            if (imsApiKey != null && !imsApiKey.isBlank()) {
                headers.set("X-Api-Key", imsApiKey);
            }
            if (imsOrdersApiToken != null && !imsOrdersApiToken.isBlank()) {
                headers.set("Authorization", "Bearer " + imsOrdersApiToken);
            }
            headers.set("X-DevTunnels-Skip-AntiPhishing-Page", "true");
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<Object> response = imsRestTemplate.exchange(
                    endpoint, org.springframework.http.HttpMethod.GET, request, Object.class);
            
            Object body = response.getBody();
            if (body != null) {
                java.util.List<?> dataList = null;
                if (body instanceof java.util.Map) {
                    java.util.Map<?, ?> mapBody = (java.util.Map<?, ?>) body;
                    if (mapBody.containsKey("data")) {
                        Object dataObj = mapBody.get("data");
                        if (dataObj instanceof java.util.Map && ((java.util.Map<?, ?>) dataObj).containsKey("content")) {
                            dataList = (java.util.List<?>) ((java.util.Map<?, ?>) dataObj).get("content");
                        } else if (dataObj instanceof java.util.List) {
                            dataList = (java.util.List<?>) dataObj;
                        }
                    } else if (mapBody.containsKey("content") && mapBody.get("content") instanceof java.util.List) {
                        dataList = (java.util.List<?>) mapBody.get("content");
                    }
                } else if (body instanceof java.util.List) {
                    dataList = (java.util.List<?>) body;
                }

                if (dataList != null) {
                    java.util.List<com.example.outletmanagement.payload.dto.StockOrderDto.WarehouseProductsResponse.ImsWarehouseProductDto> products = new java.util.ArrayList<>();
                    for (Object listElement : dataList) {
                        if (listElement instanceof java.util.Map) {
                            java.util.Map<?, ?> item = (java.util.Map<?, ?>) listElement;
                            Object codeObj = item.get("sku");
                            if (codeObj == null) codeObj = item.get("productCode");
                            if (codeObj == null) codeObj = item.get("product_code");
                            String code = codeObj != null ? String.valueOf(codeObj) : null;
                            if (code == null || code.trim().isEmpty()) {
                                code = "SKU-" + item.get("id");
                            }
                            
                            Object idObj = item.get("id");
                            Long id = null;
                            if (idObj instanceof Number) {
                                id = ((Number) idObj).longValue();
                            } else if (idObj instanceof String) {
                                try { id = Long.parseLong((String) idObj); } catch (Exception ignore) {}
                            }

                            String name = "";
                            Object nameObj = item.get("name");
                            if (nameObj == null) nameObj = item.get("productName");
                            if (nameObj != null) name = String.valueOf(nameObj);

                            java.math.BigDecimal price = java.math.BigDecimal.ZERO;
                            Object priceObj = item.get("price");
                            if (priceObj == null) priceObj = item.get("sellingPrice");
                            if (priceObj != null) {
                                try { price = new java.math.BigDecimal(String.valueOf(priceObj)); } catch (Exception ignore) {}
                            }
                            
                            int qty = 0;
                            Object qtyObj = item.get("availableQuantity");
                            if (qtyObj == null) qtyObj = item.get("stockQuantity");
                            if (qtyObj == null) qtyObj = item.get("quantity");
                            
                            if (qtyObj instanceof Number) {
                                qty = ((Number) qtyObj).intValue();
                            } else if (qtyObj instanceof String) {
                                try { qty = Integer.parseInt((String) qtyObj); } catch (Exception ignore) {}
                            }
                            
                            if (id != null) {
                                products.add(new com.example.outletmanagement.payload.dto.StockOrderDto.WarehouseProductsResponse.ImsWarehouseProductDto(
                                    id, code, name, price, qty
                                ));
                            }
                        }
                    }
                    return products;
                }
            }
        } catch (org.springframework.web.client.RestClientException ex) {
            log.warn("[IMS] Failed to fetch full warehouse products for outlet {}: {}", outletCode, ex.getMessage());
        }
        return java.util.Collections.emptyList();
    }

    /**
     * Sends the approved stock return to the IMS asynchronously.
     */
    @Async("imsTaskExecutor")
    public void pushStockReturn(Long returnId) {
        com.example.outletmanagement.model.entity.StockReturn stockReturn = stockReturnRepository.findById(returnId).orElse(null);
        if (stockReturn == null) {
            log.warn("[IMS] Cannot push return id={} — not found in DB", returnId);
            return;
        }

        ImsStockReturnDto dto = buildReturnDto(stockReturn);
        String endpoint = imsBaseUrl + "/api/returns";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (imsApiKey != null && !imsApiKey.isBlank()) {
                headers.set("X-Api-Key", imsApiKey);
            }
            if (imsOrdersApiToken != null && !imsOrdersApiToken.isBlank()) {
                headers.set("Authorization", "Bearer " + imsOrdersApiToken);
            }
            headers.set("X-DevTunnels-Skip-AntiPhishing-Page", "true");

            HttpEntity<ImsStockReturnDto> request = new HttpEntity<>(dto, headers);
            ResponseEntity<String> response = imsRestTemplate.postForEntity(endpoint, request, String.class);

            log.info("[IMS] Stock return pushed for return={} → HTTP {}", stockReturn.getReturnCode(), response.getStatusCode());

            stockReturn.setStatus(com.example.outletmanagement.model.enums.StockReturnStatus.SUBMITTED);
            stockReturnRepository.save(stockReturn);

        } catch (RestClientException ex) {
            log.error("[IMS] Failed to push stock return: {}", ex.getMessage());
        }
    }

    @Async
    public void pushCancelRequest(Long orderId) {
        log.info("[IMS] Push cancel request for order {}", orderId);
        // Implementation for sending cancel request
    }

    @Async
    public void pushReceiptToIms(Long receiptId) {
        log.info("[IMS] Push receipt to IMS for receipt {}", receiptId);
        // Implementation for sending receipt
    }

    private ImsStockReturnDto buildReturnDto(com.example.outletmanagement.model.entity.StockReturn stockReturn) {
        List<ImsStockReturnDto.ImsReturnItemDto> items = stockReturn.getItems().stream()
                .map(item -> new ImsStockReturnDto.ImsReturnItemDto(
                        item.getBatchItem().getProduct().getProductCode(),
                        item.getQuantityReturned(),
                        item.getDefectDescription()))
                .collect(Collectors.toList());

        return new ImsStockReturnDto(
                stockReturn.getReturnCode(),
                stockReturn.getBatch().getBatchCode(),
                stockReturn.getReason(),
                items);
    }
}
