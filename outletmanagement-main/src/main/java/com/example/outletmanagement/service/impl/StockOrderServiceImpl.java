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

@Service
@RequiredArgsConstructor
public class StockOrderServiceImpl implements StockOrderService {

    private final StockOrderRepository stockOrderRepository;
    private final StockOrderItemRepository stockOrderItemRepository;
    private final OutletRepository outletRepository;
    private final ProductRepository productRepository;
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
        
        // Notify Admins and Inventory Managers
        String ownerName = saved.getCreatedBy();
        if (ownerName == null || ownerName.isEmpty()) {
            ownerName = "System";
        }
        String msg = String.format("New stock order #%d placed by %s for outlet %s", 
                saved.getId(), ownerName, saved.getOutlet().getOutletName());
        notificationService.sendToRole("SUPER_ADMIN", NotificationType.STOCK_ORDER_CREATED, "New Stock Order", msg);
        notificationService.sendToRole("INVENTORY_MANAGER", NotificationType.STOCK_ORDER_CREATED, "New Stock Order", msg);

        // Async: push to Inventory Management System (non-blocking)
        inventoryApiClient.pushStockRequest(saved.getId());

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
    public StockOrderResponse approveOrder(Long id) {
        StockOrder order = stockOrderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("Only PENDING orders can be approved");
        }
        order.setStatus("APPROVED");
        order.setUpdatedAt(LocalDateTime.now());
        // NOTE: Batch is NOT auto-created here.
        // The outlet admin creates the batch manually via POST /api/batches
        // when goods physically arrive from the Inventory Management System.
        StockOrder saved = stockOrderRepository.save(order);

        // Notify the user who created the order
        String orderOwner = saved.getCreatedBy();
        if (orderOwner != null && !orderOwner.isEmpty()) {
            String msg = String.format("Your stock order #%d has been approved. Goods will be dispatched by the Inventory Management System.", saved.getId());
            notificationService.sendToUser(orderOwner,
                    NotificationType.STOCK_ORDER_APPROVED, "Order Approved", msg);

            // ── Mailtrap Email ──────────────────────────────────────────────────
            // Note: orderOwner is a username; adapt if email lookup is needed
            emailService.sendStockOrderApprovedEmail(
                    orderOwner, saved.getId(), saved.getOrderCode(),
                    saved.getOutlet().getOutletName());
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public StockOrderResponse cancelOrder(Long id) {
        StockOrder order = stockOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("Only PENDING orders can be cancelled");
        }
        order.setStatus("CANCELLED");
        order.setUpdatedAt(LocalDateTime.now());
        StockOrder saved = stockOrderRepository.save(order);

        // Notify the user who created the order
        String orderOwner = saved.getCreatedBy();
        if (orderOwner != null && !orderOwner.isEmpty()) {
            String msg = String.format("Your stock order #%d has been cancelled.", saved.getId());
            notificationService.sendToUser(orderOwner,
                    NotificationType.STOCK_ORDER_CANCELLED, "Order Cancelled", msg);

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
}
