package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.model.entity.*;
import com.example.outletmanagement.model.enums.ShipmentStatus;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsDispatchWebhookRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsDispatchWebhookResponseDto;
import com.example.outletmanagement.repository.ProductRepository;
import com.example.outletmanagement.repository.ShipmentRepository;
import com.example.outletmanagement.payload.dto.WebhookDto.ReturnCompletionRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ReturnCompletionResponseDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsStockOrderStatusRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsStockOrderStatusResponseDto;
import com.example.outletmanagement.repository.StockOrderRepository;
import com.example.outletmanagement.repository.StockReturnRepository;
import com.example.outletmanagement.service.AuditLogService;
import com.example.outletmanagement.service.ImsWebhookService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.outletmanagement.service.NotificationService;
import com.example.outletmanagement.model.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImsWebhookServiceImpl implements ImsWebhookService {

    private final ShipmentRepository shipmentRepository;
    private final StockOrderRepository stockOrderRepository;
    private final ProductRepository productRepository;
    private final com.example.outletmanagement.repository.ImsMasterBatchRepository imsMasterBatchRepository;
    private final com.example.outletmanagement.repository.BatchItemRepository batchItemRepository;
    private final StockReturnRepository stockReturnRepository;
    private final com.example.outletmanagement.repository.DivisionRepository divisionRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public com.example.outletmanagement.payload.dto.WebhookDto.ImsBatchSyncResponseDto handleBatchSync(com.example.outletmanagement.payload.dto.WebhookDto.ImsBatchSyncRequestDto request) {
        String payloadJson = "";
        try {
            payloadJson = objectMapper.writeValueAsString(request);
        } catch (Exception ignored) {}

        try {
            Products product = productRepository.findByProductCode(request.getProductCode())
                    .orElseThrow(() -> new IllegalArgumentException("Product code not found: " + request.getProductCode()));

            java.util.Optional<ImsMasterBatch> existingBatchOpt = imsMasterBatchRepository.findByBatchCodeAndProduct_Id(request.getBatchCode(), product.getId());

            if (existingBatchOpt.isPresent()) {
                ImsMasterBatch existingBatch = existingBatchOpt.get();

                boolean isDuplicate = true;
                if (!existingBatch.getMfgDate().equals(request.getMfgDate())) isDuplicate = false;
                if (!existingBatch.getExpiryDate().equals(request.getExpiryDate())) isDuplicate = false;
                
                String reqNotes = request.getNotes() != null ? request.getNotes() : "";
                String exNotes = existingBatch.getNotes() != null ? existingBatch.getNotes() : "";
                if (!exNotes.equals(reqNotes)) isDuplicate = false;

                if (isDuplicate) {
                    log.info("Duplicate Batch Sync Webhook for {}", request.getBatchCode());
                    auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "BATCH_SYNC_DUPLICATE", "ImsMasterBatch", request.getBatchCode(), "POST", "/api/webhook/ims/batch-sync", "IMS", 200, payloadJson, null);
                    return new com.example.outletmanagement.payload.dto.WebhookDto.ImsBatchSyncResponseDto(request.getBatchCode(), "IGNORED");
                }

                existingBatch.setMfgDate(request.getMfgDate());
                existingBatch.setExpiryDate(request.getExpiryDate());
                existingBatch.setNotes(request.getNotes());
                existingBatch.setImsUpdatedAt(LocalDateTime.now());
                imsMasterBatchRepository.save(existingBatch);

                // Cascade updates to active batch items
                List<BatchItem> activeItems = batchItemRepository.findActiveItemsByProductAndBatchCode(product.getId(), request.getBatchCode());
                for (BatchItem item : activeItems) {
                    item.setMfgDate(request.getMfgDate());
                    item.setExpiryDate(request.getExpiryDate());
                }
                if (!activeItems.isEmpty()) {
                    batchItemRepository.saveAll(activeItems);
                    log.info("Cascaded expiry/mfg updates to {} active BatchItems for batchCode={}", activeItems.size(), request.getBatchCode());
                }

                auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "BATCH_SYNC_UPDATED", "ImsMasterBatch", request.getBatchCode(), "POST", "/api/webhook/ims/batch-sync", "IMS", 200, payloadJson, null);
                return new com.example.outletmanagement.payload.dto.WebhookDto.ImsBatchSyncResponseDto(request.getBatchCode(), "UPDATED");

            } else {
                ImsMasterBatch newBatch = new ImsMasterBatch();
                newBatch.setBatchCode(request.getBatchCode());
                newBatch.setProduct(product);
                newBatch.setMfgDate(request.getMfgDate());
                newBatch.setExpiryDate(request.getExpiryDate());
                newBatch.setNotes(request.getNotes());
                newBatch.setImsCreatedAt(LocalDateTime.now());
                
                imsMasterBatchRepository.save(newBatch);

                auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "BATCH_SYNC_CREATED", "ImsMasterBatch", request.getBatchCode(), "POST", "/api/webhook/ims/batch-sync", "IMS", 200, payloadJson, null);
                return new com.example.outletmanagement.payload.dto.WebhookDto.ImsBatchSyncResponseDto(request.getBatchCode(), "CREATED");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "BATCH_SYNC_FAILED", "ImsMasterBatch", request.getBatchCode(), "POST", "/api/webhook/ims/batch-sync", "IMS", 500, payloadJson, e.getMessage());
            throw e;
        }
    }

    @Override
    @Transactional
    public com.example.outletmanagement.payload.dto.WebhookDto.ImsProductSyncResponseDto handleProductSync(com.example.outletmanagement.payload.dto.WebhookDto.ImsProductSyncRequestDto request) {
        String payloadJson = "";
        try {
            payloadJson = objectMapper.writeValueAsString(request);
        } catch (Exception ignored) {}

        try {
            java.util.Optional<Products> existingProductOpt = productRepository.findByProductCode(request.getProductCode());
            
            Division division = null;
            if (request.getDivisionName() != null && !request.getDivisionName().trim().isEmpty()) {
                division = divisionRepository.findByNameIgnoreCase(request.getDivisionName().trim())
                        .orElseGet(() -> {
                            Division newDiv = new Division();
                            newDiv.setName(request.getDivisionName().trim());
                            return divisionRepository.save(newDiv);
                        });
            }

            if (existingProductOpt.isPresent()) {
                Products existingProduct = existingProductOpt.get();
                
                boolean isDuplicate = true;
                if (!existingProduct.getName().equals(request.getName())) isDuplicate = false;
                if (existingProduct.getUimPrice().compareTo(request.getUimPrice()) != 0) isDuplicate = false;
                if (existingProduct.getMrp().compareTo(request.getMrp()) != 0) isDuplicate = false;
                if (existingProduct.getSellingPrice().compareTo(request.getSellingPrice()) != 0) isDuplicate = false;
                if (existingProduct.getPurchasePrice().compareTo(request.getPurchasePrice()) != 0) isDuplicate = false;
                
                String reqStatus = request.getStatus() != null ? request.getStatus() : "ACTIVE";
                if (!existingProduct.getStatus().name().equals(reqStatus)) isDuplicate = false;
                
                if (request.getImageUrl() != null && !request.getImageUrl().equals(existingProduct.getImageUrl())) isDuplicate = false;
                
                if (division != null) {
                    if (existingProduct.getDivision() == null || !existingProduct.getDivision().getId().equals(division.getId())) {
                        isDuplicate = false;
                    }
                }

                if (isDuplicate) {
                    log.info("Duplicate Product Sync Webhook for {}", request.getProductCode());
                    auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "PRODUCT_DUPLICATE", "Products", request.getProductCode(), "POST", "/api/webhook/ims/product-sync", "IMS", 200, payloadJson, null);
                    return new com.example.outletmanagement.payload.dto.WebhookDto.ImsProductSyncResponseDto(request.getProductCode(), "IGNORED");
                }
                
                existingProduct.setName(request.getName());
                existingProduct.setUimPrice(request.getUimPrice());
                existingProduct.setMrp(request.getMrp());
                existingProduct.setSellingPrice(request.getSellingPrice());
                existingProduct.setPurchasePrice(request.getPurchasePrice());
                if (request.getImageUrl() != null) existingProduct.setImageUrl(request.getImageUrl());
                existingProduct.setStatus(com.example.outletmanagement.model.enums.ProductStatus.valueOf(reqStatus));
                if (division != null) existingProduct.setDivision(division);
                
                productRepository.save(existingProduct);
                
                auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "PRODUCT_UPDATED", "Products", request.getProductCode(), "POST", "/api/webhook/ims/product-sync", "IMS", 200, payloadJson, null);
                return new com.example.outletmanagement.payload.dto.WebhookDto.ImsProductSyncResponseDto(request.getProductCode(), "UPDATED");
                
            } else {
                Products newProduct = new Products();
                newProduct.setProductCode(request.getProductCode());
                newProduct.setName(request.getName());
                newProduct.setUimPrice(request.getUimPrice());
                newProduct.setMrp(request.getMrp());
                newProduct.setSellingPrice(request.getSellingPrice());
                newProduct.setPurchasePrice(request.getPurchasePrice());
                if (request.getImageUrl() != null) newProduct.setImageUrl(request.getImageUrl());
                
                String reqStatus = request.getStatus() != null ? request.getStatus() : "ACTIVE";
                newProduct.setStatus(com.example.outletmanagement.model.enums.ProductStatus.valueOf(reqStatus));
                if (division != null) newProduct.setDivision(division);
                
                productRepository.save(newProduct);
                
                auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "PRODUCT_CREATED", "Products", request.getProductCode(), "POST", "/api/webhook/ims/product-sync", "IMS", 200, payloadJson, null);
                return new com.example.outletmanagement.payload.dto.WebhookDto.ImsProductSyncResponseDto(request.getProductCode(), "CREATED");
            }
        } catch (Exception e) {
            auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "PRODUCT_SYNC_FAILED", "Products", request.getProductCode(), "POST", "/api/webhook/ims/product-sync", "IMS", 500, payloadJson, e.getMessage());
            throw e;
        }
    }

    @Override
    @Transactional
    public ImsDispatchWebhookResponseDto handleDispatch(ImsDispatchWebhookRequestDto request) {
        String payloadJson = "";
        try {
            payloadJson = objectMapper.writeValueAsString(request);
        } catch (Exception ignored) {}

        // Idempotency: Check if IMS Reference Code already exists
        if (shipmentRepository.findByImsReferenceCode(request.getImsReferenceCode()).isPresent()) {
            log.warn("Duplicate webhook received for IMS Reference: {}", request.getImsReferenceCode());
            auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "IMS_DISPATCH_DUPLICATE", "Shipment", request.getOrderCode(), "POST", "/api/webhook/ims/dispatch", "IMS", 200, payloadJson, null);
            return new ImsDispatchWebhookResponseDto(request.getImsReferenceCode(), null, "IGNORED");
        }

        StockOrder order = stockOrderRepository.findByOrderCode(request.getOrderCode())
                .orElseThrow(() -> new IllegalArgumentException("StockOrder not found: " + request.getOrderCode()));

        if ("CANCELLED".equals(order.getStatus())) {
            throw new IllegalArgumentException("StockOrder is cancelled");
        }
        
        if ("RECEIVED".equals(order.getStatus())) {
            throw new IllegalArgumentException("StockOrder is already fully received");
        }

        order.setStatus("DISPATCHED");
        order.setUpdatedAt(LocalDateTime.now());
        stockOrderRepository.save(order);

        String shipmentCode = "SHP-" + System.currentTimeMillis();
        Shipment shipment = new Shipment();
        shipment.setShipmentCode(shipmentCode);
        shipment.setImsReferenceCode(request.getImsReferenceCode());
        shipment.setOrder(order);
        shipment.setOutlet(order.getOutlet());
        shipment.setStatus(ShipmentStatus.IN_TRANSIT);
        shipment.setDispatchDate(request.getDispatchDate() != null ? request.getDispatchDate() : LocalDate.now());
        shipment.setNotes(request.getNotes());

        Map<String, Products> productsMap = productRepository.findAll().stream()
                .collect(Collectors.toMap(Products::getProductCode, p -> p, (p1, p2) -> p1));

        List<ShipmentItem> shipmentItems = new ArrayList<>();
        for (ImsDispatchWebhookRequestDto.ImsDispatchItemDto itemDto : request.getItems()) {
            Products product = productsMap.get(itemDto.getProductCode());
            if (product == null) {
                throw new IllegalArgumentException("Product code not found: " + itemDto.getProductCode());
            }

            ShipmentItem item = new ShipmentItem();
            item.setShipment(shipment);
            item.setProduct(product);
            item.setQuantityDispatched(itemDto.getQuantityDispatched());
            item.setQuantityReceived(0);
            item.setMfgDate(itemDto.getMfgDate());
            item.setExpiryDate(itemDto.getExpiryDate());
            shipmentItems.add(item);
        }
        shipment.setItems(shipmentItems);

        shipmentRepository.save(shipment);

        auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "IMS_DISPATCH_SUCCESS", "Shipment", request.getOrderCode(), "POST", "/api/webhook/ims/dispatch", "IMS", 200, payloadJson, null);

        return new ImsDispatchWebhookResponseDto(request.getImsReferenceCode(), shipmentCode, "SUCCESS");
    }

    @Override
    @Transactional
    public com.example.outletmanagement.payload.dto.WebhookDto.ReturnAckResponseDto handleReturnAck(com.example.outletmanagement.payload.dto.WebhookDto.ReturnAckRequestDto request) {
        String payloadJson = "";
        try {
            payloadJson = objectMapper.writeValueAsString(request);
        } catch (Exception ignored) {}

        StockReturn stockReturn = stockReturnRepository.findByReturnCode(request.getReturnCode())
                .orElseThrow(() -> new IllegalArgumentException("StockReturn not found: " + request.getReturnCode()));

        // Idempotency: Check if already acknowledged or has the same imsAckCode
        if (stockReturn.getImsAckCode() != null && stockReturn.getImsAckCode().equals(request.getImsAckCode()) ||
                stockReturn.getStatus() == com.example.outletmanagement.model.enums.StockReturnStatus.ACKNOWLEDGED ||
                stockReturn.getStatus() == com.example.outletmanagement.model.enums.StockReturnStatus.COMPLETED) {
            
            log.warn("Duplicate webhook received for Return Code: {}", request.getReturnCode());
            auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "RETURN_ACK_DUPLICATE", "StockReturn", request.getReturnCode(), "POST", "/api/webhook/ims/return-ack", "IMS", 200, payloadJson, null);
            return new com.example.outletmanagement.payload.dto.WebhookDto.ReturnAckResponseDto(request.getReturnCode(), request.getImsAckCode(), stockReturn.getStatus().name(), "IGNORED");
        }

        try {
            stockReturn.setStatus(com.example.outletmanagement.model.enums.StockReturnStatus.valueOf(request.getStatus().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + request.getStatus());
        }
        
        stockReturn.setImsAckCode(request.getImsAckCode());
        
        if (request.getNotes() != null && !request.getNotes().isEmpty()) {
            stockReturn.setNotes(stockReturn.getNotes() != null ? stockReturn.getNotes() + " | IMS: " + request.getNotes() : "IMS: " + request.getNotes());
        }

        stockReturn.setUpdatedAt(LocalDateTime.now());
        stockReturnRepository.save(stockReturn);

        auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "RETURN_ACK_RECEIVED", "StockReturn", request.getReturnCode(), "POST", "/api/webhook/ims/return-ack", "IMS", 200, payloadJson, null);

        return new com.example.outletmanagement.payload.dto.WebhookDto.ReturnAckResponseDto(request.getReturnCode(), request.getImsAckCode(), stockReturn.getStatus().name(), "SUCCESS");
    }

    @Override
    @Transactional
    public com.example.outletmanagement.payload.dto.WebhookDto.ReturnPickupResponseDto handleReturnPickup(com.example.outletmanagement.payload.dto.WebhookDto.ReturnPickupRequestDto request) {
        String payloadJson = "";
        try {
            payloadJson = objectMapper.writeValueAsString(request);
        } catch (Exception ignored) {}

        StockReturn stockReturn = stockReturnRepository.findByReturnCode(request.getReturnCode())
                .orElseThrow(() -> new IllegalArgumentException("StockReturn not found: " + request.getReturnCode()));

        // Idempotency check
        if (stockReturn.getPickupReferenceCode() != null && stockReturn.getPickupReferenceCode().equals(request.getPickupReferenceCode()) ||
                stockReturn.getStatus() == com.example.outletmanagement.model.enums.StockReturnStatus.PICKED_UP ||
                stockReturn.getStatus() == com.example.outletmanagement.model.enums.StockReturnStatus.COMPLETED) {

            log.warn("Duplicate pickup webhook received for Return Code: {}", request.getReturnCode());
            auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "RETURN_PICKUP_DUPLICATE", "StockReturn", request.getReturnCode(), "POST", "/api/webhook/ims/return-pickup", "IMS", 200, payloadJson, null);
            return new com.example.outletmanagement.payload.dto.WebhookDto.ReturnPickupResponseDto(request.getReturnCode(), request.getPickupReferenceCode(), "IGNORED");
        }

        // Status transition validation: Only ACKNOWLEDGED -> PICKED_UP is allowed
        if (stockReturn.getStatus() != com.example.outletmanagement.model.enums.StockReturnStatus.ACKNOWLEDGED) {
            throw new IllegalArgumentException("Invalid state transition. StockReturn must be ACKNOWLEDGED to be marked as PICKED_UP.");
        }

        stockReturn.setStatus(com.example.outletmanagement.model.enums.StockReturnStatus.PICKED_UP);
        stockReturn.setPickupReferenceCode(request.getPickupReferenceCode());

        if (request.getNotes() != null && !request.getNotes().isEmpty()) {
            stockReturn.setNotes(stockReturn.getNotes() != null ? stockReturn.getNotes() + " | IMS Pickup: " + request.getNotes() : "IMS Pickup: " + request.getNotes());
        }

        stockReturn.setUpdatedAt(LocalDateTime.now());
        stockReturnRepository.save(stockReturn);

        auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "RETURN_PICKUP_RECEIVED", "StockReturn", request.getReturnCode(), "POST", "/api/webhook/ims/return-pickup", "IMS", 200, payloadJson, null);

        return new com.example.outletmanagement.payload.dto.WebhookDto.ReturnPickupResponseDto(request.getReturnCode(), request.getPickupReferenceCode(), "SUCCESS");
    }

    @Override
    @Transactional
    public com.example.outletmanagement.payload.dto.WebhookDto.ReturnCompletionResponseDto handleReturnCompletion(com.example.outletmanagement.payload.dto.WebhookDto.ReturnCompletionRequestDto request) {
        String payloadJson = "";
        try {
            payloadJson = objectMapper.writeValueAsString(request);
        } catch (Exception ignored) {}

        StockReturn stockReturn = stockReturnRepository.findByReturnCode(request.getReturnCode())
                .orElseThrow(() -> new IllegalArgumentException("StockReturn not found: " + request.getReturnCode()));

        // Idempotency check
        if (stockReturn.getCompletionReferenceCode() != null && stockReturn.getCompletionReferenceCode().equals(request.getCompletionReferenceCode()) ||
                stockReturn.getStatus() == com.example.outletmanagement.model.enums.StockReturnStatus.COMPLETED) {

            log.warn("Duplicate completion webhook received for Return Code: {}", request.getReturnCode());
            auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "RETURN_COMPLETED_DUPLICATE", "StockReturn", request.getReturnCode(), "POST", "/api/webhook/ims/return-completion", "IMS", 200, payloadJson, null);
            return new com.example.outletmanagement.payload.dto.WebhookDto.ReturnCompletionResponseDto(request.getReturnCode(), request.getCompletionReferenceCode(), "IGNORED");
        }

        // Status transition validation: Only PICKED_UP -> COMPLETED is allowed
        if (stockReturn.getStatus() != com.example.outletmanagement.model.enums.StockReturnStatus.PICKED_UP) {
            throw new IllegalArgumentException("Invalid state transition. StockReturn must be PICKED_UP to be marked as COMPLETED.");
        }

        stockReturn.setStatus(com.example.outletmanagement.model.enums.StockReturnStatus.COMPLETED);
        stockReturn.setCompletionReferenceCode(request.getCompletionReferenceCode());

        if (request.getNotes() != null && !request.getNotes().isEmpty()) {
            stockReturn.setNotes(stockReturn.getNotes() != null ? stockReturn.getNotes() + " | IMS Completion: " + request.getNotes() : "IMS Completion: " + request.getNotes());
        }

        stockReturn.setUpdatedAt(LocalDateTime.now());
        stockReturnRepository.save(stockReturn);

        auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "RETURN_COMPLETED_RECEIVED", "StockReturn", request.getReturnCode(), "POST", "/api/webhook/ims/return-completion", "IMS", 200, payloadJson, null);

        return new com.example.outletmanagement.payload.dto.WebhookDto.ReturnCompletionResponseDto(request.getReturnCode(), request.getCompletionReferenceCode(), "SUCCESS");
    }

    @Override
    @Transactional
    public ImsStockOrderStatusResponseDto handleStockOrderStatus(ImsStockOrderStatusRequestDto request) {
        String payloadJson = "";
        try {
            payloadJson = objectMapper.writeValueAsString(request);
        } catch (Exception ignored) {}

        StockOrder order = stockOrderRepository.findByOrderCode(request.getOrderCode())
                .orElseThrow(() -> new IllegalArgumentException("StockOrder not found: " + request.getOrderCode()));

        if (order.getStatus().equals(request.getStatus())) {
            log.warn("Duplicate webhook received for Stock Order Status: {}", request.getOrderCode());
            auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "STOCK_ORDER_STATUS_DUPLICATE", "StockOrder", request.getOrderCode(), "POST", "/api/webhook/ims/stock-order-status", "IMS", 200, payloadJson, null);
            return new ImsStockOrderStatusResponseDto(request.getOrderCode(), "IGNORED", "Status is already " + request.getStatus());
        }

        try {
            // Validate expected statuses
            String reqStatus = request.getStatus().toUpperCase();
            if (!List.of("PENDING", "ACCEPTED", "APPROVED", "REJECTED", "CANCELLED", "DISPATCHED", "RECEIVED", "FULFILLED").contains(reqStatus)) {
                throw new IllegalArgumentException("Invalid status update: " + reqStatus);
            }
            order.setStatus(reqStatus);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + request.getStatus());
        }

        if (request.getRemarks() != null && !request.getRemarks().isEmpty()) {
            order.setNotes(order.getNotes() != null ? order.getNotes() + " | IMS Remarks: " + request.getRemarks() : "IMS Remarks: " + request.getRemarks());
        }

        order.setUpdatedAt(LocalDateTime.now());
        stockOrderRepository.save(order);

        auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "STOCK_ORDER_STATUS_UPDATED", "StockOrder", request.getOrderCode(), "POST", "/api/webhook/ims/stock-order-status", "IMS", 200, payloadJson, null);

        // Notify Order Owner
        String orderOwner = order.getCreatedBy();
        if (orderOwner != null && !orderOwner.isEmpty()) {
            String msg = String.format("Your stock order %s has been %s by IMS.", order.getOrderCode(), order.getStatus());
            NotificationType type = NotificationType.INFO;
            if ("APPROVED".equals(order.getStatus())) type = NotificationType.STOCK_ORDER_APPROVED;
            else if ("CANCELLED".equals(order.getStatus())) type = NotificationType.STOCK_ORDER_CANCELLED;
            notificationService.sendToUser(orderOwner, type, "Order Status Updated", msg);
        }

        return new ImsStockOrderStatusResponseDto(request.getOrderCode(), "SUCCESS", "Order status updated to " + order.getStatus());
    }
}
