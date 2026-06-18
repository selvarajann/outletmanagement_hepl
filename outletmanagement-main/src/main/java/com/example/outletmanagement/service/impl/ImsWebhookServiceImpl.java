package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.model.entity.*;
import com.example.outletmanagement.model.enums.ShipmentStatus;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsDispatchWebhookRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsDispatchWebhookResponseDto;
import com.example.outletmanagement.repository.ProductRepository;
import com.example.outletmanagement.repository.ShipmentRepository;
import com.example.outletmanagement.repository.StockOrderRepository;
import com.example.outletmanagement.repository.StockReturnRepository;
import com.example.outletmanagement.repository.DivisionRepository;
import com.example.outletmanagement.service.AuditLogService;
import com.example.outletmanagement.service.ImsWebhookService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final StockReturnRepository stockReturnRepository;
    private final DivisionRepository divisionRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

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
    public com.example.outletmanagement.payload.dto.WebhookDto.ImsProductSyncResponseDto handleProductSync(com.example.outletmanagement.payload.dto.WebhookDto.ImsProductSyncRequestDto request) {
        String payloadJson = "";
        try {
            payloadJson = objectMapper.writeValueAsString(request);
        } catch (Exception ignored) {}

        try {
            Division division = null;
            if (request.getDivisionName() != null && !request.getDivisionName().trim().isEmpty()) {
                division = divisionRepository.findByNameIgnoreCase(request.getDivisionName().trim())
                        .orElseThrow(() -> new IllegalArgumentException("Unknown division name: " + request.getDivisionName()));
            }

            com.example.outletmanagement.model.enums.ProductStatus requestedStatus = com.example.outletmanagement.model.enums.ProductStatus.ACTIVE;
            if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
                try {
                    requestedStatus = com.example.outletmanagement.model.enums.ProductStatus.valueOf(request.getStatus().trim().toUpperCase());
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("Invalid product status: " + request.getStatus());
                }
            }

            Products product = productRepository.findByProductCode(request.getProductCode()).orElse(null);

            if (product == null) {
                // Create
                product = new Products();
                product.setProductCode(request.getProductCode());
                product.setName(request.getName());
                product.setUimPrice(request.getUimPrice());
                product.setMrp(request.getMrp());
                product.setSellingPrice(request.getSellingPrice());
                product.setPurchasePrice(request.getPurchasePrice());
                product.setDivision(division);
                product.setImageUrl(request.getImageUrl());
                product.setStatus(requestedStatus);

                productRepository.save(product);

                auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "PRODUCT_CREATED", "Product", request.getProductCode(), "POST", "/api/webhook/ims/product-sync", "IMS", 200, payloadJson, null);

                return new com.example.outletmanagement.payload.dto.WebhookDto.ImsProductSyncResponseDto(request.getProductCode(), "CREATED");
            } else {
                // Update or Duplicate
                boolean isDuplicate = true;
                if (!java.util.Objects.equals(product.getName(), request.getName())) isDuplicate = false;
                if (product.getUimPrice().compareTo(request.getUimPrice()) != 0) isDuplicate = false;
                if (product.getMrp().compareTo(request.getMrp()) != 0) isDuplicate = false;
                if (product.getSellingPrice().compareTo(request.getSellingPrice()) != 0) isDuplicate = false;
                if (product.getPurchasePrice().compareTo(request.getPurchasePrice()) != 0) isDuplicate = false;
                if (!java.util.Objects.equals(product.getImageUrl(), request.getImageUrl())) isDuplicate = false;
                if (product.getStatus() != requestedStatus) isDuplicate = false;
                
                Long currentDivId = product.getDivision() != null ? product.getDivision().getId() : null;
                Long newDivId = division != null ? division.getId() : null;
                if (!java.util.Objects.equals(currentDivId, newDivId)) isDuplicate = false;

                if (isDuplicate) {
                    auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "PRODUCT_DUPLICATE", "Product", request.getProductCode(), "POST", "/api/webhook/ims/product-sync", "IMS", 200, payloadJson, null);
                    return new com.example.outletmanagement.payload.dto.WebhookDto.ImsProductSyncResponseDto(request.getProductCode(), "IGNORED");
                }

                product.setName(request.getName());
                product.setUimPrice(request.getUimPrice());
                product.setMrp(request.getMrp());
                product.setSellingPrice(request.getSellingPrice());
                product.setPurchasePrice(request.getPurchasePrice());
                product.setDivision(division);
                product.setImageUrl(request.getImageUrl());
                product.setStatus(requestedStatus);

                productRepository.save(product);

                auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "PRODUCT_UPDATED", "Product", request.getProductCode(), "POST", "/api/webhook/ims/product-sync", "IMS", 200, payloadJson, null);

                return new com.example.outletmanagement.payload.dto.WebhookDto.ImsProductSyncResponseDto(request.getProductCode(), "UPDATED");
            }
        } catch (Exception e) {
            auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "PRODUCT_SYNC_FAILED", "Product", request.getProductCode(), "POST", "/api/webhook/ims/product-sync", "IMS", 500, payloadJson + " | ERROR: " + e.getMessage(), null);
            throw e;
        }
    }
}
