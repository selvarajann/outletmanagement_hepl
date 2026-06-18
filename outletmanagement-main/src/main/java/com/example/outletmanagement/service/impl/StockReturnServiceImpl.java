package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.integration.InventoryApiClient;
import com.example.outletmanagement.model.entity.*;
import com.example.outletmanagement.payload.dto.StockReturnDto.StockReturnRequestDto;
import com.example.outletmanagement.payload.dto.StockReturnDto.StockReturnResponseDto;
import com.example.outletmanagement.repository.*;
import com.example.outletmanagement.repository.specification.StockReturnSpecification;
import com.example.outletmanagement.service.AuditLogService;
import com.example.outletmanagement.service.StockReturnService;
import com.example.outletmanagement.model.enums.StockReturnStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockReturnServiceImpl implements StockReturnService {

    private final StockReturnRepository stockReturnRepository;
    private final BatchRepository batchRepository;
    private final BatchItemRepository batchItemRepository;
    private final StockRepository stockRepository;
    private final InventoryApiClient inventoryApiClient;
    private final AuditLogService auditLogService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    @Override
    public Page<StockReturnResponseDto> getStockReturns(String keyword, Long outletId, String status, LocalDateTime fromDate, LocalDateTime toDate, int page, int size, String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<StockReturn> spec = Specification.where(StockReturnSpecification.hasKeyword(keyword))
                .and(StockReturnSpecification.hasOutletId(outletId))
                .and(StockReturnSpecification.hasStatus(status))
                .and(StockReturnSpecification.isBetweenDates(fromDate, toDate));

        return stockReturnRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Override
    public StockReturnResponseDto getStockReturnDetails(Long returnId) {
        StockReturn stockReturn = stockReturnRepository.findById(returnId)
                .orElseThrow(() -> new IllegalArgumentException("Stock Return not found"));
        return mapToResponse(stockReturn);
    }

    @Override
    @Transactional
    public StockReturnResponseDto createReturn(StockReturnRequestDto request, String createdBy) {
        Batch batch = batchRepository.findById(request.getBatchId())
                .orElseThrow(() -> new IllegalArgumentException("Batch not found"));

        StockReturn stockReturn = new StockReturn();
        stockReturn.setReturnCode("RTN-" + System.currentTimeMillis());
        stockReturn.setBatch(batch);
        stockReturn.setOutlet(batch.getOutlet());
        stockReturn.setReason(request.getReason());
        stockReturn.setStatus(StockReturnStatus.PENDING);
        stockReturn.setNotes(request.getNotes());
        stockReturn.setCreatedBy(createdBy);

        List<StockReturnItem> returnItems = new ArrayList<>();
        
        // Validate items and check stock without deducting yet
        Map<Long, BatchItem> batchItemsMap = batch.getItems().stream()
                .collect(Collectors.toMap(BatchItem::getId, item -> item));

        for (StockReturnRequestDto.StockReturnItemRequestDto reqItem : request.getItems()) {
            BatchItem batchItem = batchItemsMap.get(reqItem.getBatchItemId());
            if (batchItem == null) {
                throw new IllegalArgumentException("Batch Item not found in this batch: " + reqItem.getBatchItemId());
            }

            if (reqItem.getQuantityReturned() > batchItem.getRemainingQuantity()) {
                throw new IllegalArgumentException("Return quantity exceeds remaining quantity for product: " + batchItem.getProduct().getProductCode());
            }

            // Validate against global stock
            Stock stock = stockRepository.findByOutlet_IdAndProduct_Id(batch.getOutlet().getId(), batchItem.getProduct().getId())
                    .orElseThrow(() -> new IllegalStateException("Active stock not found for product: " + batchItem.getProduct().getProductCode()));

            if (reqItem.getQuantityReturned() > stock.getQuantity()) {
                throw new IllegalArgumentException("Return quantity exceeds total stock quantity for product: " + batchItem.getProduct().getProductCode());
            }

            // Decrease BatchItem remaining quantity (never modify quantity)
            batchItem.setRemainingQuantity(batchItem.getRemainingQuantity() - reqItem.getQuantityReturned());
            batchItemRepository.save(batchItem);

            // Decrease Global Stock quantity
            stock.setQuantity(stock.getQuantity() - reqItem.getQuantityReturned());
            stock.setLastUpdatedAt(LocalDateTime.now());
            stockRepository.save(stock);

            StockReturnItem returnItem = new StockReturnItem();
            returnItem.setStockReturn(stockReturn);
            returnItem.setBatchItem(batchItem);
            returnItem.setQuantityReturned(reqItem.getQuantityReturned());
            returnItem.setDefectDescription(reqItem.getDefectDescription());
            returnItems.add(returnItem);
        }

        stockReturn.setItems(returnItems);
        stockReturn.setImsPushStatus("PENDING");
        stockReturnRepository.save(stockReturn);
        
        // Simulate IMS Push
        simulateImsPush(stockReturn);

        // Audit Log Entry
        String payloadJson = "";
        try {
            payloadJson = objectMapper.writeValueAsString(request);
        } catch (Exception ignored) {}
        
        auditLogService.saveAsync(
                java.util.UUID.randomUUID().toString(),
                createdBy,
                "CREATE_STOCK_RETURN",
                "StockReturn",
                "POST",
                "/api/stock-returns",
                "CLIENT",
                200,
                payloadJson,
                null
        );

        log.info("Stock Return {} created and stock deducted.", stockReturn.getReturnCode());
        return mapToResponse(stockReturn);
    }

    private void simulateImsPush(StockReturn stockReturn) {
        try {
            // Simulate synchronous or async push depending on logic.
            // For now, we simulate a successful API call.
            stockReturn.setImsPushStatus("SUCCESS");
            stockReturnRepository.save(stockReturn);
        } catch (Exception e) {
            stockReturn.setImsPushStatus("FAILED");
            stockReturn.setNotes(stockReturn.getNotes() + " | IMS Push Failed: " + e.getMessage());
            stockReturnRepository.save(stockReturn);
        }
    }

    @Override
    @Transactional
    public StockReturnResponseDto retryImsPush(Long returnId, String requestedBy) {
        StockReturn stockReturn = stockReturnRepository.findById(returnId)
                .orElseThrow(() -> new IllegalArgumentException("Stock Return not found"));

        if ("SUCCESS".equals(stockReturn.getImsPushStatus())) {
            throw new IllegalStateException("IMS push is already successful");
        }

        simulateImsPush(stockReturn);

        auditLogService.saveAsync(
                java.util.UUID.randomUUID().toString(),
                requestedBy,
                "RETRY_RETURN_IMS_PUSH",
                "StockReturn",
                "POST",
                "/api/stock-returns/" + returnId + "/retry-ims",
                "CLIENT",
                200,
                null,
                null
        );

        return mapToResponse(stockReturn);
    }

    @Override
    @Transactional
    public StockReturnResponseDto approveReturn(Long returnId) {
        StockReturn stockReturn = stockReturnRepository.findById(returnId)
                .orElseThrow(() -> new IllegalArgumentException("Stock Return not found"));

        if (stockReturn.getStatus() != StockReturnStatus.PENDING) {
            throw new IllegalStateException("Only PENDING returns can be approved");
        }

        stockReturn.setStatus(StockReturnStatus.APPROVED);
        stockReturnRepository.save(stockReturn);

        // Async notify IMS
        inventoryApiClient.pushStockReturn(returnId);

        return mapToResponse(stockReturn);
    }

    @Override
    @Transactional
    public StockReturnResponseDto rejectReturn(Long returnId, String reason) {
        StockReturn stockReturn = stockReturnRepository.findById(returnId)
                .orElseThrow(() -> new IllegalArgumentException("Stock Return not found"));

        if (stockReturn.getStatus() != StockReturnStatus.PENDING) {
            throw new IllegalStateException("Only PENDING returns can be rejected");
        }

        stockReturn.setStatus(StockReturnStatus.REJECTED);
        stockReturn.setNotes(stockReturn.getNotes() != null ? stockReturn.getNotes() + " | Rejection Reason: " + reason : "Rejection Reason: " + reason);
        stockReturnRepository.save(stockReturn);

        return mapToResponse(stockReturn);
    }

    @Override
    @Transactional
    public StockReturnResponseDto completeReturn(Long returnId, String imsAckCode) {
        StockReturn stockReturn = stockReturnRepository.findById(returnId)
                .orElseThrow(() -> new IllegalArgumentException("Stock Return not found"));

        if (stockReturn.getStatus() != StockReturnStatus.SUBMITTED && stockReturn.getStatus() != StockReturnStatus.APPROVED) {
            throw new IllegalStateException("Only APPROVED/SUBMITTED returns can be completed");
        }

        stockReturn.setStatus(StockReturnStatus.COMPLETED);
        stockReturn.setImsAckCode(imsAckCode);

        stockReturnRepository.save(stockReturn);

        log.info("Stock Return {} completed.", stockReturn.getReturnCode());
        return mapToResponse(stockReturn);
    }

    private StockReturnResponseDto mapToResponse(StockReturn stockReturn) {
        StockReturnResponseDto dto = new StockReturnResponseDto();
        dto.setId(stockReturn.getId());
        dto.setReturnCode(stockReturn.getReturnCode());
        dto.setBatchId(stockReturn.getBatch().getId());
        dto.setBatchCode(stockReturn.getBatch().getBatchCode());
        dto.setOutletId(stockReturn.getOutlet().getId());
        dto.setOutletName(stockReturn.getOutlet().getOutletName());
        dto.setReason(stockReturn.getReason());
        dto.setStatus(stockReturn.getStatus());
        dto.setImsAckCode(stockReturn.getImsAckCode());
        dto.setPickupReferenceCode(stockReturn.getPickupReferenceCode());
        dto.setImsPushStatus(stockReturn.getImsPushStatus());
        dto.setNotes(stockReturn.getNotes());
        dto.setCreatedBy(stockReturn.getCreatedBy());
        dto.setCreatedAt(stockReturn.getCreatedAt());
        dto.setUpdatedAt(stockReturn.getUpdatedAt());

        if (stockReturn.getItems() != null) {
            dto.setItems(stockReturn.getItems().stream().map(item -> {
                StockReturnResponseDto.StockReturnItemResponseDto itemDto = new StockReturnResponseDto.StockReturnItemResponseDto();
                itemDto.setId(item.getId());
                itemDto.setBatchItemId(item.getBatchItem().getId());
                itemDto.setProductId(item.getBatchItem().getProduct().getId());
                itemDto.setProductName(item.getBatchItem().getProduct().getName());
                itemDto.setProductCode(item.getBatchItem().getProduct().getProductCode());
                itemDto.setQuantityReturned(item.getQuantityReturned());
                itemDto.setDefectDescription(item.getDefectDescription());
                return itemDto;
            }).collect(Collectors.toList()));
        }

        return dto;
    }
}
