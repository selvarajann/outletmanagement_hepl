package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.model.entity.BatchItem;
import com.example.outletmanagement.payload.dto.BatchQuarantineResponseDto;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.repository.BatchItemRepository;
import com.example.outletmanagement.service.AuditLogService;
import com.example.outletmanagement.service.BatchQuarantineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BatchQuarantineServiceImpl implements BatchQuarantineService {

    private final BatchItemRepository batchItemRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public Page<BatchQuarantineResponseDto> getQuarantinedBatchItems(Pageable pageable) {
        return batchItemRepository.findByIsQuarantinedTrue(pageable)
                .map(bi -> new BatchQuarantineResponseDto(
                        bi.getId(),
                        bi.getImsBatchCode(),
                        bi.getProduct().getProductCode(),
                        bi.getProduct().getName(),
                        bi.getRemainingQuantity(),
                        bi.getQuarantineReason(),
                        bi.getBatch().getOutlet().getOutletName(),
                        bi.getBatch().getCreatedAt().toLocalDate(),
                        bi.isQuarantined()
                ));
    }

    @Override
    @Transactional
    public ApiResponse<?> approveQuarantine(Long batchItemId, String reviewedBy) {
        BatchItem batchItem = batchItemRepository.findById(batchItemId)
                .orElseThrow(() -> new IllegalArgumentException("BatchItem not found with ID: " + batchItemId));

        if (!batchItem.isQuarantined()) {
            throw new IllegalArgumentException("BatchItem is not currently quarantined.");
        }

        batchItem.setQuarantined(false);
        batchItem.setQuarantineReviewedBy(reviewedBy);
        batchItem.setQuarantineReviewedAt(LocalDateTime.now());
        batchItemRepository.save(batchItem);

        auditLogService.saveAsync(
                UUID.randomUUID().toString(),
                reviewedBy,
                "QUARANTINE_APPROVED",
                "BatchItem",
                String.valueOf(batchItemId),
                "POST",
                "/api/batch-quarantine/" + batchItemId + "/approve",
                "CLIENT",
                200,
                "{}",
                null
        );

        return new ApiResponse<>(true, "Quarantine approved. Stock is now available for FEFO.", null);
    }

    @Override
    @Transactional
    public ApiResponse<?> rejectQuarantine(Long batchItemId, String reviewedBy, String reason) {
        BatchItem batchItem = batchItemRepository.findById(batchItemId)
                .orElseThrow(() -> new IllegalArgumentException("BatchItem not found with ID: " + batchItemId));

        if (!batchItem.isQuarantined()) {
            throw new IllegalArgumentException("BatchItem is not currently quarantined.");
        }

        batchItem.setQuarantineReason(batchItem.getQuarantineReason() + " | REJECTED: " + reason);
        batchItem.setQuarantineReviewedBy(reviewedBy);
        batchItem.setQuarantineReviewedAt(LocalDateTime.now());
        // keep isQuarantined = true
        batchItemRepository.save(batchItem);

        auditLogService.saveAsync(
                UUID.randomUUID().toString(),
                reviewedBy,
                "QUARANTINE_REJECTED",
                "BatchItem",
                String.valueOf(batchItemId),
                "POST",
                "/api/batch-quarantine/" + batchItemId + "/reject",
                "CLIENT",
                200,
                "{\"reason\":\"" + reason + "\"}",
                null
        );

        return new ApiResponse<>(true, "Quarantine rejected. Stock remains isolated.", null);
    }
}
