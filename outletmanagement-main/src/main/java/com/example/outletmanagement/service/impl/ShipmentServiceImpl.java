package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.model.entity.*;
import com.example.outletmanagement.model.enums.ShipmentStatus;
import com.example.outletmanagement.payload.dto.ShipmentDto.ShipmentReceiveRequestDto;
import com.example.outletmanagement.payload.dto.ShipmentDto.ShipmentReceiveResponseDto;
import com.example.outletmanagement.repository.*;
import com.example.outletmanagement.repository.specification.ShipmentSpecification;
import com.example.outletmanagement.service.AuditLogService;
import com.example.outletmanagement.service.ShipmentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShipmentServiceImpl implements ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final BatchRepository batchRepository;
    private final StockRepository stockRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Page<ShipmentReceiveResponseDto> getShipments(String keyword, Long outletId, String status, LocalDate fromDate, LocalDate toDate, int page, int size, String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Shipment> spec = Specification.where(ShipmentSpecification.hasKeyword(keyword))
                .and(ShipmentSpecification.hasOutletId(outletId))
                .and(ShipmentSpecification.hasStatus(status))
                .and(ShipmentSpecification.isBetweenDates(fromDate, toDate));

        return shipmentRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Override
    public ShipmentReceiveResponseDto getShipmentDetails(Long shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found with ID: " + shipmentId));
        return mapToResponse(shipment);
    }

    @Override
    @Transactional
    public ShipmentReceiveResponseDto receiveShipment(Long shipmentId, ShipmentReceiveRequestDto request, String receivedBy) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found with ID: " + shipmentId));

        if (shipment.getStatus() != ShipmentStatus.IN_TRANSIT) {
            throw new IllegalStateException("Only IN_TRANSIT shipments can be received. Current status is " + shipment.getStatus());
        }

        Batch batch = new Batch();
        batch.setBatchCode("BATCH-" + shipment.getShipmentCode());
        batch.setOrder(shipment.getOrder());
        batch.setOutlet(shipment.getOutlet());
        batch.setReceivedDate(LocalDate.now());
        batch.setStatus("RECEIVED");
        batch.setReceivedBy(receivedBy);
        batch.setNotes(request.getNotes());
        batch.setCreatedAt(LocalDateTime.now());
        batch.setUpdatedAt(LocalDateTime.now());

        List<BatchItem> newBatchItems = new ArrayList<>();

        for (ShipmentItem shipmentItem : shipment.getItems()) {
            int receivedQty = shipmentItem.getQuantityDispatched();
            
            // Set quantityReceived = quantityDispatched for full receive
            shipmentItem.setQuantityReceived(receivedQty);

            if (receivedQty > 0) {
                // Create Batch Item for the received quantity
                BatchItem batchItem = new BatchItem();
                batchItem.setBatch(batch);
                batchItem.setProduct(shipmentItem.getProduct());
                batchItem.setQuantity(receivedQty);
                batchItem.setRemainingQuantity(receivedQty); 
                batchItem.setMfgDate(shipmentItem.getMfgDate());
                batchItem.setExpiryDate(shipmentItem.getExpiryDate());
                
                // Snapshot prices from the product master
                batchItem.setSellingPrice(shipmentItem.getProduct().getSellingPrice());
                batchItem.setPurchasePrice(shipmentItem.getProduct().getPurchasePrice());
                batchItem.setMrp(shipmentItem.getProduct().getMrp());
                batchItem.setUimPrice(shipmentItem.getProduct().getUimPrice());
                newBatchItems.add(batchItem);

                // Update Stock table (optimistic locking handled automatically by @Version in Stock entity)
                Stock stock = stockRepository.findByOutlet_IdAndProduct_Id(shipment.getOutlet().getId(), shipmentItem.getProduct().getId())
                        .orElseGet(() -> {
                            Stock newStock = new Stock();
                            newStock.setOutlet(shipment.getOutlet());
                            newStock.setProduct(shipmentItem.getProduct());
                            newStock.setQuantity(0);
                            return newStock;
                        });

                stock.setQuantity(stock.getQuantity() + receivedQty);
                stock.setLastBatchCode(batch.getBatchCode());
                stock.setLastUpdatedAt(LocalDateTime.now());
                stockRepository.save(stock);
            }
        }

        if (newBatchItems.isEmpty()) {
            throw new IllegalArgumentException("Cannot receive a shipment with 0 total quantity.");
        }

        batch.setItems(newBatchItems);
        batchRepository.save(batch);

        shipment.setStatus(ShipmentStatus.RECEIVED);
        shipment.setReceivedDate(LocalDate.now());
        shipmentRepository.save(shipment);

        // Audit Log entry
        String payloadJson = "";
        try {
            payloadJson = objectMapper.writeValueAsString(request);
        } catch (Exception ignored) {}
        
        auditLogService.saveAsync(
                UUID.randomUUID().toString(),
                receivedBy,
                "RECEIVE_SHIPMENT",
                "Shipment",
                shipment.getShipmentCode(),
                "POST",
                "/api/shipments/" + shipmentId + "/receive",
                "CLIENT",
                200,
                payloadJson,
                null
        );

        log.info("Shipment {} fully received by {}. Batch {} created with {} items.", shipment.getShipmentCode(), receivedBy, batch.getBatchCode(), newBatchItems.size());

        return mapToResponse(shipment);
    }

    private ShipmentReceiveResponseDto mapToResponse(Shipment shipment) {
        ShipmentReceiveResponseDto dto = new ShipmentReceiveResponseDto();
        dto.setId(shipment.getId());
        dto.setShipmentCode(shipment.getShipmentCode());
        dto.setImsReferenceCode(shipment.getImsReferenceCode());
        if (shipment.getOrder() != null) {
            dto.setOrderId(shipment.getOrder().getId());
            dto.setOrderCode(shipment.getOrder().getOrderCode());
        }
        dto.setOutletId(shipment.getOutlet().getId());
        dto.setOutletName(shipment.getOutlet().getOutletName());
        dto.setStatus(shipment.getStatus());
        dto.setDispatchDate(shipment.getDispatchDate());
        dto.setReceivedDate(shipment.getReceivedDate());
        dto.setNotes(shipment.getNotes());
        dto.setCreatedAt(shipment.getCreatedAt());
        dto.setUpdatedAt(shipment.getUpdatedAt());

        if (shipment.getItems() != null) {
            dto.setItems(shipment.getItems().stream().map(item -> {
                ShipmentReceiveResponseDto.ShipmentReceiveItemResponseDto itemDto = new ShipmentReceiveResponseDto.ShipmentReceiveItemResponseDto();
                itemDto.setId(item.getId());
                itemDto.setProductId(item.getProduct().getId());
                itemDto.setProductName(item.getProduct().getName());
                itemDto.setProductCode(item.getProduct().getProductCode());
                itemDto.setQuantityDispatched(item.getQuantityDispatched());
                itemDto.setQuantityReceived(item.getQuantityReceived());
                itemDto.setMfgDate(item.getMfgDate());
                itemDto.setExpiryDate(item.getExpiryDate());
                return itemDto;
            }).collect(Collectors.toList()));
        }
        return dto;
    }
}
