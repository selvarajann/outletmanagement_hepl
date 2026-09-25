package com.example.outletmanagement.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.outletmanagement.integration.InventoryApiClient;
import com.example.outletmanagement.model.entity.Outlet;
import com.example.outletmanagement.model.entity.Products;
import com.example.outletmanagement.model.entity.StockOrder;
import com.example.outletmanagement.model.entity.StockOrderItem;
import com.example.outletmanagement.model.entity.User;
import com.example.outletmanagement.model.enums.NotificationType;
import com.example.outletmanagement.payload.dto.StockOrderDto.StockOrderItemResponse;
import com.example.outletmanagement.payload.dto.StockOrderDto.StockOrderRequest;
import com.example.outletmanagement.payload.dto.StockOrderDto.StockOrderResponse;
import com.example.outletmanagement.repository.OutletRepository;
import com.example.outletmanagement.repository.ProductRepository;
import com.example.outletmanagement.repository.StockOrderItemRepository;
import com.example.outletmanagement.repository.StockOrderRepository;
import com.example.outletmanagement.service.BatchService;
import com.example.outletmanagement.service.EmailService;
import com.example.outletmanagement.service.NotificationService;
import com.example.outletmanagement.service.StockOrderService;
import com.example.outletmanagement.specification.StockOrderSpecification;

import lombok.RequiredArgsConstructor;

import com.example.outletmanagement.model.enums.ProductStatus;
import com.example.outletmanagement.payload.dto.StockOrderDto.WarehouseProductsResponse;
import com.example.outletmanagement.repository.OutletDivisionProductRepository;
@Service
@RequiredArgsConstructor
public class StockOrderServiceImpl implements StockOrderService {

    private final StockOrderRepository stockOrderRepository;
    private final StockOrderItemRepository stockOrderItemRepository;
    private final OutletRepository outletRepository;
    private final ProductRepository productRepository;
    private final OutletDivisionProductRepository outletDivisionProductRepository;
    private final BatchService batchService;
    private final NotificationService notificationService;
    private final InventoryApiClient inventoryApiClient;
    private final EmailService emailService;

    @Override
    @Transactional
    public StockOrderResponse createOrder(StockOrderRequest request) {
        Outlet outlet = outletRepository.findById(request.getOutletId())
                .orElseThrow(() -> new RuntimeException("Outlet not found"));

        StockOrder order = new StockOrder();
        String seq = String.format("%04d", stockOrderRepository.count() + 1);
        order.setOrderCode("SO-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + seq);
        order.setOutlet(outlet);
        order.setRequestedDate(request.getRequestedDate());
        order.setStatus("PENDING");
        order.setNotes(request.getNotes());
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        // FIX: batch-load all products in one query instead of findById inside loop
        Set<Long> productIds = request.getItems().stream()
                .map(i -> i.getProductId()).collect(Collectors.toSet());
        Map<Long, Products> productMap = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Products::getId, p -> p));

        List<StockOrderItem> items = request.getItems().stream().map(reqItem -> {
            Products product = productMap.get(reqItem.getProductId());
            if (product == null) throw new RuntimeException("Product not found");
            StockOrderItem item = new StockOrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantityRequested(reqItem.getQuantityRequested());
            item.setUnitPriceAtOrder(product.getSellingPrice());
            return item;
        }).collect(Collectors.toList());

        order.setItems(items);
        StockOrder saved = stockOrderRepository.save(order);
        
        String ownerName = saved.getCreatedBy();
        if (ownerName == null || ownerName.isEmpty()) {
            ownerName = "System";
        }
        String msg = String.format("New stock order #%d placed by %s for outlet %s",
                saved.getId(), ownerName, saved.getOutlet().getOutletName());
        notificationService.sendToRole("SUPER_ADMIN", NotificationType.STOCK_ORDER_CREATED, "New Stock Order", msg);
        notificationService.sendToRole("INVENTORY_MANAGER", NotificationType.STOCK_ORDER_CREATED, "New Stock Order", msg);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        BigDecimal totalAmount = saved.getItems().stream()
                .map(i -> i.getUnitPriceAtOrder().multiply(java.math.BigDecimal.valueOf(i.getQuantityRequested())))
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        emailService.sendStockOrderCreatedEmail(
                "admin@outletmanagement.com",
                saved.getId(), saved.getOrderCode(),
                saved.getOutlet().getOutletName(),
                ownerName, totalAmount, saved.getItems().size());

        return mapToResponse(saved);
    }

    @Override
    public Page<StockOrderResponse> getAllOrders(String keyword, Long outletId, String status, LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        Specification<StockOrder> spec = StockOrderSpecification.searchAndFilter(keyword, outletId, status, fromDate, toDate);
        Page<StockOrder> page = stockOrderRepository.findAll(spec, pageable);

        if (page.isEmpty()) {
            return page.map(this::mapToResponse);
        }

        // FIX: batch-fetch all orders with outlet+items+product in one query after pagination
        Set<Long> ids = page.getContent().stream().map(StockOrder::getId).collect(Collectors.toSet());
        Map<Long, StockOrder> hydrated = stockOrderRepository.findByIdsWithDetails(ids).stream()
                .collect(Collectors.toMap(StockOrder::getId, o -> o));

        List<StockOrderResponse> responses = page.getContent().stream()
                .map(o -> mapToResponse(hydrated.getOrDefault(o.getId(), o)))
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, page.getTotalElements());
    }

    @Override
    public StockOrderResponse getOrderById(Long id) {
        // FIX: use fetch-join to load outlet+items+product in one query
        StockOrder order = stockOrderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return mapToResponse(order);
    }

    @Override
    @Transactional
    public StockOrderResponse updateOrder(Long id, StockOrderRequest request) {
        StockOrder order = stockOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("Can only update PENDING orders");
        }

        Outlet outlet = outletRepository.findById(request.getOutletId())
                .orElseThrow(() -> new RuntimeException("Outlet not found"));

        order.setOutlet(outlet);
        order.setRequestedDate(request.getRequestedDate());
        order.setNotes(request.getNotes());
        order.setUpdatedAt(LocalDateTime.now());

        stockOrderItemRepository.deleteByOrder_Id(id);

        // FIX: batch-load all products in one query instead of findById inside loop
        Set<Long> productIds = request.getItems().stream()
                .map(i -> i.getProductId()).collect(Collectors.toSet());
        Map<Long, Products> productMap = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Products::getId, p -> p));

        List<StockOrderItem> newItems = request.getItems().stream().map(reqItem -> {
            Products product = productMap.get(reqItem.getProductId());
            if (product == null) throw new RuntimeException("Product not found");
            StockOrderItem item = new StockOrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantityRequested(reqItem.getQuantityRequested());
            item.setUnitPriceAtOrder(product.getSellingPrice());
            return item;
        }).collect(Collectors.toList());

        order.getItems().clear();
        order.getItems().addAll(newItems);

        StockOrder saved = stockOrderRepository.save(order);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public StockOrderResponse payOrder(Long id) {
        StockOrder order = stockOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        if ("PAID".equals(order.getPaymentStatus())) {
            throw new RuntimeException("Order is already paid");
        }
        
        order.setPaymentStatus("PAID");
        order.setPaymentMethod("ONLINE");
        order.setUpdatedAt(LocalDateTime.now());
        StockOrder saved = stockOrderRepository.save(order);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public StockOrderResponse requestCancelOrder(Long id) {
        StockOrder order = stockOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("Only PENDING orders can be requested for cancellation");
        }
        order.setStatus("CANCEL_REQUESTED");
        order.setUpdatedAt(LocalDateTime.now());
        StockOrder saved = stockOrderRepository.save(order);

        // Notify the user who created the order
        String orderOwner = saved.getCreatedBy();
        if (orderOwner != null && !orderOwner.isEmpty()) {
            String msg = String.format("Cancellation requested for stock order #%d.", saved.getId());
            notificationService.sendToUser(orderOwner,
                    NotificationType.STOCK_ORDER_CANCELLED, "Cancellation Requested", msg);

            // ── Mailtrap Email ──────────────────────────────────────────────────
            emailService.sendStockOrderCancelledEmail(
                    orderOwner, saved.getId(), saved.getOrderCode(),
                    saved.getOutlet().getOutletName());
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteOrder(Long id) {
        StockOrder order = stockOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("Only PENDING orders can be deleted");
        }
        stockOrderRepository.delete(order);
    }

    @Override
    @Transactional
    public StockOrderResponse retryImsPush(Long id) {
        StockOrder order = stockOrderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        if (!"IMS_PUSH_FAILED".equals(order.getImsPushStatus())) {
            throw new RuntimeException("Only orders with IMS_PUSH_FAILED status can be retried");
        }

        // Re-trigger the async push
        inventoryApiClient.pushStockRequest(order.getId());
        
        return mapToResponse(order);
    }

    private StockOrderResponse mapToResponse(StockOrder order) {
        StockOrderResponse response = new StockOrderResponse();
        response.setId(order.getId());
        response.setOrderCode(order.getOrderCode());
        response.setOutletId(order.getOutlet().getId());
        response.setOutletName(order.getOutlet().getOutletName());
        response.setOutletCode(order.getOutlet().getOutletCode());
        response.setRequestedDate(order.getRequestedDate());
        response.setStatus(order.getStatus());
        response.setImsPushStatus(order.getImsPushStatus());
        response.setNotes(order.getNotes());
        response.setCreatedBy(order.getCreatedBy());
        response.setPaymentMethod(order.getPaymentMethod());
        response.setPaymentStatus(order.getPaymentStatus());
        response.setCreatedAt(order.getCreatedAt());
        response.setUpdatedAt(order.getUpdatedAt());

        List<StockOrderItemResponse> itemResponses = order.getItems().stream().map(item -> {
            StockOrderItemResponse ir = new StockOrderItemResponse();
            ir.setId(item.getId());
            ir.setProductId(item.getProduct().getId());
            ir.setProductName(item.getProduct().getName());
            ir.setProductCode(item.getProduct().getProductCode());
            ir.setQuantityRequested(item.getQuantityRequested());
            ir.setUnitPriceAtOrder(item.getUnitPriceAtOrder());
            BigDecimal lineTotal = item.getUnitPriceAtOrder().multiply(BigDecimal.valueOf(item.getQuantityRequested()));
            ir.setLineTotal(lineTotal);
            return ir;
        }).collect(Collectors.toList());

        response.setItems(itemResponses);
        response.setItemCount(itemResponses.size());

        BigDecimal totalAmount = itemResponses.stream()
                .map(StockOrderItemResponse::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        response.setTotalAmount(totalAmount);

        return response;
    }

    @Override
    public WarehouseProductsResponse getWarehouseProducts(Long outletId) {
        try {
            Outlet outlet = outletRepository.findById(outletId)
                    .orElseThrow(() -> new RuntimeException("Outlet not found"));

            String outletCode = outlet.getOutletCode();
            if (outletCode == null || outletCode.isEmpty()) {
                outletCode = "";
            }

            List<WarehouseProductsResponse.ImsWarehouseProductDto> productDtos = 
                    inventoryApiClient.fetchFullWarehouseProducts(outletCode);

            // JIT Sync: Ensure IMS products exist in local DB and return local IDs
            List<WarehouseProductsResponse.ImsWarehouseProductDto> syncedDtos = new java.util.ArrayList<>();
            java.util.Set<Long> seenIds = new java.util.HashSet<>();
            for (var dto : productDtos) {
                if (dto.getProductCode() == null || dto.getProductCode().isEmpty()) continue;
                
                Products localP = productRepository.findByProductCode(dto.getProductCode()).orElse(null);
                if (localP == null) {
                    localP = new Products();
                    localP.setProductCode(dto.getProductCode());
                    localP.setName(dto.getName() != null && !dto.getName().isEmpty() ? dto.getName() : dto.getProductCode());
                    localP.setUimPrice(dto.getSellingPrice());
                    localP.setMrp(dto.getSellingPrice());
                    localP.setSellingPrice(dto.getSellingPrice());
                    localP.setPurchasePrice(dto.getSellingPrice());
                    localP.setStatus(ProductStatus.ACTIVE);
                    localP = productRepository.save(localP);
                } else {
                    boolean changed = false;
                    String newName = dto.getName() != null && !dto.getName().isEmpty() ? dto.getName() : dto.getProductCode();
                    if (!localP.getName().equals(newName)) { localP.setName(newName); changed = true; }
                    if (localP.getSellingPrice().compareTo(dto.getSellingPrice()) != 0) { 
                        localP.setSellingPrice(dto.getSellingPrice()); 
                        localP.setUimPrice(dto.getSellingPrice());
                        localP.setMrp(dto.getSellingPrice());
                        localP.setPurchasePrice(dto.getSellingPrice());
                        changed = true; 
                    }
                    if (changed) localP = productRepository.save(localP);
                }
                
                // CRITICAL: Return the LOCAL ID so createOrder() can find it!
                dto.setId(localP.getId()); 
                if (seenIds.add(localP.getId())) {
                    syncedDtos.add(dto);
                }
            }

            boolean imsAvailable = !syncedDtos.isEmpty();
            return new WarehouseProductsResponse(imsAvailable, syncedDtos);
        } catch (Exception ex) {
            try {
                java.io.StringWriter sw = new java.io.StringWriter();
                ex.printStackTrace(new java.io.PrintWriter(sw));
                java.nio.file.Files.writeString(
                    java.nio.file.Paths.get("debug_error.txt"), 
                    sw.toString(), 
                    java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
            } catch (Exception ignore) {}
            throw new RuntimeException("Debug wrapped: " + ex.getMessage(), ex);
        }
    }

    @Override
    public void syncOrdersFromIms() {
        // TODO: Implement external sync
    }

    @Override
    public byte[] generateBill(Long id) {
        StockOrder order = stockOrderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!"PAID".equals(order.getPaymentStatus())) {
            throw new RuntimeException("Bill can only be generated for PAID orders");
        }

        BigDecimal total = order.getItems().stream()
                .map(i -> i.getUnitPriceAtOrder().multiply(BigDecimal.valueOf(i.getQuantityRequested())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        StringBuilder rows = new StringBuilder();
        int sno = 1;
        for (StockOrderItem item : order.getItems()) {
            BigDecimal lineTotal = item.getUnitPriceAtOrder()
                    .multiply(BigDecimal.valueOf(item.getQuantityRequested()));
            rows.append("<tr>")
                .append("<td>").append(sno++).append("</td>")
                .append("<td>").append(item.getProduct().getName()).append("</td>")
                .append("<td>").append(item.getProduct().getProductCode()).append("</td>")
                .append("<td style='text-align:center'>").append(item.getQuantityRequested()).append("</td>")
                .append("<td style='text-align:right'>&#8377;").append(item.getUnitPriceAtOrder().toPlainString()).append("</td>")
                .append("<td style='text-align:right'>&#8377;").append(lineTotal.toPlainString()).append("</td>")
                .append("</tr>");
        }

        String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'/>"
            + "<title>Invoice " + order.getOrderCode() + "</title>"
            + "<style>"
            + "body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:40px;color:#1e293b;background:#f8fafc}"
            + ".card{background:#fff;border-radius:12px;padding:40px;max-width:800px;margin:auto;box-shadow:0 4px 24px rgba(0,0,0,.08)}"
            + ".header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0ea5e9;padding-bottom:24px;margin-bottom:24px}"
            + ".logo{font-size:24px;font-weight:800;color:#0ea5e9}"
            + ".invoice-title{font-size:32px;font-weight:800;color:#1e293b;margin:0}"
            + ".meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px}"
            + ".meta-box{background:#f1f5f9;border-radius:8px;padding:14px}"
            + ".meta-label{font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}"
            + ".meta-value{font-size:15px;font-weight:700;color:#1e293b}"
            + "table{width:100%;border-collapse:collapse;margin-bottom:24px}"
            + "th{background:#0ea5e9;color:#fff;padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase}"
            + "td{padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px}"
            + "tr:last-child td{border-bottom:none}"
            + "tr:nth-child(even){background:#f8fafc}"
            + ".total-row{background:#0ea5e9!important;color:#fff;font-weight:700;font-size:15px}"
            + ".total-row td{color:#fff;border:none}"
            + ".badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700}"
            + ".badge-paid{background:#dcfce7;color:#16a34a}"
            + ".footer{margin-top:32px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px}"
            + "</style></head><body>"
            + "<div class='card'>"
            + "<div class='header'>"
            + "<div><div class='logo'>OutletMS</div><div style='font-size:12px;color:#64748b;margin-top:4px'>Outlet Management System</div></div>"
            + "<div style='text-align:right'><div class='invoice-title'>INVOICE</div>"
            + "<div style='font-size:13px;color:#64748b;margin-top:4px'>" + order.getOrderCode() + "</div></div>"
            + "</div>"
            + "<div class='meta'>"
            + "<div class='meta-box'><div class='meta-label'>Outlet</div><div class='meta-value'>" + order.getOutlet().getOutletName() + "</div></div>"
            + "<div class='meta-box'><div class='meta-label'>Order Date</div><div class='meta-value'>" + order.getRequestedDate() + "</div></div>"
            + "<div class='meta-box'><div class='meta-label'>Payment Method</div><div class='meta-value'>" + (order.getPaymentMethod() != null ? order.getPaymentMethod() : "N/A") + "</div></div>"
            + "<div class='meta-box'><div class='meta-label'>Payment Status</div><div class='meta-value'><span class='badge badge-paid'>PAID</span></div></div>"
            + "</div>"
            + "<table><thead><tr><th>#</th><th>Product</th><th>Code</th><th style='text-align:center'>Qty</th><th style='text-align:right'>Unit Price</th><th style='text-align:right'>Line Total</th></tr></thead>"
            + "<tbody>" + rows + "</tbody>"
            + "<tfoot><tr class='total-row'><td colspan='5' style='text-align:right;font-weight:800;font-size:15px'>GRAND TOTAL</td>"
            + "<td style='text-align:right;font-size:16px;font-weight:800'>&#8377;" + total.toPlainString() + "</td></tr></tfoot>"
            + "</table>"
            + "<div class='footer'>Thank you for your business! &bull; Generated on " + java.time.LocalDateTime.now().toString().replace("T", " ").substring(0, 19) + "</div>"
            + "</div></body></html>";

        return html.getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
}
