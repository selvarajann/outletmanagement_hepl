package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.model.entity.*;
import com.example.outletmanagement.model.enums.ShipmentStatus;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsDispatchWebhookRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsDispatchWebhookResponseDto;
import com.example.outletmanagement.repository.ProductRepository;
import com.example.outletmanagement.repository.ShipmentRepository;
import com.example.outletmanagement.repository.StockOrderRepository;
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
            auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "IMS_DISPATCH_DUPLICATE", "Shipment", "POST", "/api/webhook/ims/dispatch", "IMS", 200, payloadJson, null);
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

        auditLogService.saveAsync(UUID.randomUUID().toString(), "IMS_WEBHOOK", "IMS_DISPATCH_SUCCESS", "Shipment", "POST", "/api/webhook/ims/dispatch", "IMS", 200, payloadJson, null);

        return new ImsDispatchWebhookResponseDto(request.getImsReferenceCode(), shipmentCode, "SUCCESS");
    }
}
