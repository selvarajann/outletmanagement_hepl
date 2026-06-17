package com.example.outletmanagement.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.outletmanagement.model.entity.Batch;
import com.example.outletmanagement.model.entity.BatchItem;
import com.example.outletmanagement.model.entity.Products;
import com.example.outletmanagement.model.entity.StockOrder;
import com.example.outletmanagement.model.enums.NotificationType;
import com.example.outletmanagement.payload.dto.BatchDto.BatchCreateRequest;
import com.example.outletmanagement.payload.dto.BatchDto.BatchItemRequest;
import com.example.outletmanagement.payload.dto.BatchDto.BatchItemResponse;
import com.example.outletmanagement.payload.dto.BatchDto.BatchReceiveRequest;
import com.example.outletmanagement.payload.dto.BatchDto.BatchResponse;
import com.example.outletmanagement.repository.BatchItemRepository;
import com.example.outletmanagement.repository.BatchRepository;
import com.example.outletmanagement.repository.ProductRepository;
import com.example.outletmanagement.repository.StockOrderRepository;
import com.example.outletmanagement.service.BatchService;
import com.example.outletmanagement.service.EmailService;
import com.example.outletmanagement.service.NotificationService;
import com.example.outletmanagement.service.StockService;
import com.example.outletmanagement.specification.BatchSpecification;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BatchServiceImpl implements BatchService {

    private final BatchRepository batchRepository;
    private final BatchItemRepository batchItemRepository;
    private final StockOrderRepository stockOrderRepository;
    private final ProductRepository productRepository;
    private final StockService stockService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    // ── Internal creation (from approved order) ───────────────────────────────

    /**
     * Creates a batch with PENDING_RECEIPT status from an approved stock order.
     * Quantities and prices are copied from the order; mfg/expiry dates are set later
     * by the outlet admin when they call receiveBatch().
     */
    @Override
    @Transactional
    public void createBatchFromOrder(StockOrder order) {
        Batch batch = buildBatchShell(order.getOutlet().getOutletCode(), order);

        List<BatchItem> items = order.getItems().stream().map(orderItem -> {
            BatchItem item = new BatchItem();
            item.setBatch(batch);
            item.setProduct(orderItem.getProduct());
            item.setQuantity(orderItem.getQuantityRequested());
            item.setRemainingQuantity(0); // 0 until received
            // Copy master prices as initial values
            item.setSellingPrice(orderItem.getProduct().getSellingPrice());
            item.setPurchasePrice(orderItem.getProduct().getPurchasePrice());
            item.setMrp(orderItem.getProduct().getMrp());
            item.setUimPrice(orderItem.getProduct().getUimPrice());
            return item;
        }).collect(Collectors.toList());

        batch.setItems(items);
        batchRepository.save(batch);
    }

    // ── Manual creation (outlet admin records goods arrival) ─────────────────

    @Override
    @Transactional
    public BatchResponse createBatch(BatchCreateRequest request, String createdBy) {
        StockOrder order = stockOrderRepository.findByIdWithDetails(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Stock order not found: " + request.getOrderId()));

        if (!"APPROVED".equals(order.getStatus()) && !"FULFILLED".equals(order.getStatus())) {
            throw new RuntimeException("Batch can only be created for APPROVED or FULFILLED orders");
        }

        // Batch-load all products in one query
        Map<Long, Products> productMap = request.getItems().stream()
                .map(BatchCreateRequest.BatchCreateItemDetail::getProductId)
                .distinct()
                .collect(Collectors.toSet())
                .stream()
                .collect(Collectors.toMap(id -> id,
                        id -> productRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Product not found: " + id))));

        Batch batch = buildBatchShell(order.getOutlet().getOutletCode(), order);
        batch.setNotes(request.getNotes());

        List<BatchItem> items = request.getItems().stream().map(detail -> {
            Products product = productMap.get(detail.getProductId());
            BatchItem item = new BatchItem();
            item.setBatch(batch);
            item.setProduct(product);
            item.setQuantity(detail.getQuantity());
            item.setRemainingQuantity(0); // 0 until receiveBatch() is called
            item.setMfgDate(detail.getMfgDate());
            item.setExpiryDate(detail.getExpiryDate());
            item.setSellingPrice(product.getSellingPrice());
            item.setPurchasePrice(product.getPurchasePrice());
            item.setMrp(product.getMrp());
            item.setUimPrice(product.getUimPrice());
            return item;
        }).collect(Collectors.toList());

        batch.setItems(items);
        Batch saved = batchRepository.save(batch);
        return mapToResponse(saved);
    }

    // ── Receive batch (marks as RECEIVED, sets dates, updates stock) ──────────

    @Override
    @Transactional
    public BatchResponse receiveBatch(Long id, BatchReceiveRequest request, String receivedBy) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + id));

        if (!"PENDING_RECEIPT".equals(batch.getStatus()) && !"PROCESSING".equals(batch.getStatus())) {
            throw new RuntimeException("Only PENDING_RECEIPT or PROCESSING batches can be marked as received");
        }

        // Build a productId → detail map for O(1) lookups
        Map<Long, BatchReceiveRequest.BatchItemReceiveDetail> detailMap = request.getItems().stream()
                .collect(Collectors.toMap(d -> d.getProductId(), d -> d));

        for (BatchItem item : batch.getItems()) {
            BatchReceiveRequest.BatchItemReceiveDetail detail = detailMap.get(item.getProduct().getId());
            if (detail != null) {
                item.setMfgDate(detail.getMfgDate());
                item.setExpiryDate(detail.getExpiryDate());
            }
            // Set remainingQuantity = quantity upon receipt
            item.setRemainingQuantity(item.getQuantity());

            // Update aggregate stock
            stockService.upsertStock(batch.getOutlet(), item.getProduct(), item.getQuantity(), batch.getBatchCode());
        }

        batch.setStatus("RECEIVED");
        batch.setReceivedDate(LocalDate.now());
        batch.setReceivedBy(receivedBy);
        batch.setUpdatedAt(LocalDateTime.now());

        Batch saved = batchRepository.save(batch);

        // Notify super admin via WebSocket
        String msg = String.format("Batch %s received at outlet %s by %s",
                saved.getBatchCode(), saved.getOutlet().getOutletName(), receivedBy);
        notificationService.sendToRole("SUPER_ADMIN", NotificationType.SUCCESS, "Batch Received", msg);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        // Summarise first product name for the email subject line
        String firstProductName = saved.getItems().isEmpty() ? "N/A"
                : saved.getItems().get(0).getProduct().getName();
        int totalQty = saved.getItems().stream().mapToInt(BatchItem::getQuantity).sum();
        emailService.sendBatchReceivedEmail(
                "admin@outletmanagement.com",
                saved.getBatchCode(),
                saved.getOutlet().getOutletName(),
                firstProductName + (saved.getItems().size() > 1 ? " + " + (saved.getItems().size() - 1) + " more" : ""),
                totalQty);

        return mapToResponse(saved);
    }

    // ── Legacy deliver (backward compat) ──────────────────────────────────────

    @Override
    @Deprecated
    @Transactional
    public BatchResponse deliverBatch(Long id) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + id));

        // Support old PROCESSING status for any legacy batches in DB
        if ("PROCESSING".equals(batch.getStatus())) {
            for (BatchItem item : batch.getItems()) {
                if (item.getRemainingQuantity() == null) item.setRemainingQuantity(0);
                item.setRemainingQuantity(item.getQuantity());
                stockService.upsertStock(batch.getOutlet(), item.getProduct(), item.getQuantity(), batch.getBatchCode());
            }
            batch.setStatus("RECEIVED");
            batch.setUpdatedAt(LocalDateTime.now());
            return mapToResponse(batchRepository.save(batch));
        }

        // Delegate new flow
        return receiveBatch(id, new BatchReceiveRequest(List.of()), "system");
    }

    // ── Cancel ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BatchResponse cancelBatch(Long id) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + id));
        if (!"PENDING_RECEIPT".equals(batch.getStatus()) && !"PROCESSING".equals(batch.getStatus())) {
            throw new RuntimeException("Only PENDING_RECEIPT batches can be cancelled");
        }
        batch.setStatus("CANCELLED");
        batch.setUpdatedAt(LocalDateTime.now());
        return mapToResponse(batchRepository.save(batch));
    }

    // ── Price editing ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BatchResponse updateBatchItemPrices(Long id, List<BatchItemRequest> itemsRequest) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + id));
        if (!"PENDING_RECEIPT".equals(batch.getStatus()) && !"PROCESSING".equals(batch.getStatus())) {
            throw new RuntimeException("Can only edit prices of PENDING_RECEIPT batches");
        }

        for (BatchItemRequest req : itemsRequest) {
            BatchItem item = batchItemRepository.findByBatch_IdAndProduct_Id(id, req.getProductId())
                    .orElseThrow(() -> new RuntimeException("Batch item not found for product id: " + req.getProductId()));
            item.setSellingPrice(req.getSellingPrice());
            item.setPurchasePrice(req.getPurchasePrice());
            item.setMrp(req.getMrp());
            item.setUimPrice(req.getUimPrice());
            batchItemRepository.save(item);
        }

        batch.setUpdatedAt(LocalDateTime.now());
        return mapToResponse(batchRepository.save(batch));
    }

    // ── Pagination ────────────────────────────────────────────────────────────

    @Override
    public Page<BatchResponse> getAllBatches(String keyword, Long outletId, String status,
            LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        Specification<Batch> spec = BatchSpecification.searchAndFilter(keyword, outletId, status, fromDate, toDate);
        return batchRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Override
    public BatchResponse getBatchById(Long id) {
        return mapToResponse(batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + id)));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Batch buildBatchShell(String outletCode, StockOrder order) {
        Batch batch = new Batch();
        String seq = String.format("%04d", batchRepository.count() + 1);
        batch.setBatchCode("BATCH-" + outletCode + "-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + seq);
        batch.setOrder(order);
        batch.setOutlet(order.getOutlet());
        batch.setStatus("PENDING_RECEIPT");
        batch.setCreatedAt(LocalDateTime.now());
        batch.setUpdatedAt(LocalDateTime.now());
        return batch;
    }

    private BatchResponse mapToResponse(Batch batch) {
        BatchResponse response = new BatchResponse();
        response.setId(batch.getId());
        response.setBatchCode(batch.getBatchCode());
        response.setOrderId(batch.getOrder() != null ? batch.getOrder().getId() : null);
        response.setOrderCode(batch.getOrder() != null ? batch.getOrder().getOrderCode() : null);
        response.setOutletId(batch.getOutlet().getId());
        response.setOutletName(batch.getOutlet().getOutletName());
        response.setReceivedDate(batch.getReceivedDate());
        response.setStatus(batch.getStatus());
        response.setReceivedBy(batch.getReceivedBy());
        response.setNotes(batch.getNotes());
        response.setCreatedAt(batch.getCreatedAt());
        response.setUpdatedAt(batch.getUpdatedAt());

        List<BatchItemResponse> itemResponses = batch.getItems().stream().map(item -> {
            BatchItemResponse ir = new BatchItemResponse();
            ir.setId(item.getId());
            ir.setProductId(item.getProduct().getId());
            ir.setProductName(item.getProduct().getName());
            ir.setProductCode(item.getProduct().getProductCode());
            ir.setDivisionName(item.getProduct().getDivision() != null ? item.getProduct().getDivision().getName() : null);
            ir.setQuantity(item.getQuantity());
            ir.setRemainingQuantity(item.getRemainingQuantity());
            ir.setMfgDate(item.getMfgDate());
            ir.setExpiryDate(item.getExpiryDate());
            ir.setSellingPrice(item.getSellingPrice());
            ir.setPurchasePrice(item.getPurchasePrice());
            ir.setMrp(item.getMrp());
            ir.setUimPrice(item.getUimPrice());

            BigDecimal lineTotal = item.getSellingPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            ir.setLineTotal(lineTotal);

            BigDecimal profit = item.getSellingPrice().subtract(item.getPurchasePrice());
            ir.setLineProfit(profit.multiply(BigDecimal.valueOf(item.getQuantity())));

            return ir;
        }).collect(Collectors.toList());

        response.setItems(itemResponses);
        response.setItemCount(itemResponses.size());

        BigDecimal totalValue = itemResponses.stream()
                .map(BatchItemResponse::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        response.setTotalValue(totalValue);

        return response;
    }
}
