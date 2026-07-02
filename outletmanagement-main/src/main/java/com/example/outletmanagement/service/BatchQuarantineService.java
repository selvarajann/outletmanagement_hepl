package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.payload.dto.BatchQuarantineResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BatchQuarantineService {
    Page<BatchQuarantineResponseDto> getQuarantinedBatchItems(Pageable pageable);
    ApiResponse<?> approveQuarantine(Long batchItemId, String reviewedBy);
    ApiResponse<?> rejectQuarantine(Long batchItemId, String reviewedBy, String reason);
}
