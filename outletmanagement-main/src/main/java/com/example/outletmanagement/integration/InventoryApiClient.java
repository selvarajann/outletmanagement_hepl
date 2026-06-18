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

        ImsStockRequestDto dto = buildDto(order);
        String endpoint = imsBaseUrl + "/api/stock-requests";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (imsApiKey != null && !imsApiKey.isBlank()) {
                headers.set("X-Api-Key", imsApiKey);
            }

            HttpEntity<ImsStockRequestDto> request = new HttpEntity<>(dto, headers);
            ResponseEntity<String> response = imsRestTemplate.postForEntity(endpoint, request, String.class);

            log.info("[IMS] Stock request pushed for order={} → HTTP {}", order.getOrderCode(), response.getStatusCode());

            order.setImsPushStatus("IMS_PUSHED");
            stockOrderRepository.save(order);

        } catch (RestClientException ex) {
            log.warn("[IMS] Failed to push stock request for order={}: {}", order.getOrderCode(), ex.getMessage());
            order.setImsPushStatus("IMS_PUSH_FAILED");
            stockOrderRepository.save(order);
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────────

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

            HttpEntity<ImsStockReturnDto> request = new HttpEntity<>(dto, headers);
            ResponseEntity<String> response = imsRestTemplate.postForEntity(endpoint, request, String.class);

            log.info("[IMS] Stock return pushed for return={} → HTTP {}", stockReturn.getReturnCode(), response.getStatusCode());

            stockReturn.setStatus(com.example.outletmanagement.model.enums.StockReturnStatus.SUBMITTED);
            stockReturnRepository.save(stockReturn);

        } catch (RestClientException ex) {
            log.warn("[IMS] Failed to push stock return for return={}: {}", stockReturn.getReturnCode(), ex.getMessage());
            // Kept as PENDING or updated to a failed status if desired.
        }
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
