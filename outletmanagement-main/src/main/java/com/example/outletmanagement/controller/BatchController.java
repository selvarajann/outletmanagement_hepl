package com.example.outletmanagement.controller;

import com.example.outletmanagement.annotation.AuditAction;
import com.example.outletmanagement.payload.dto.BatchDto.BatchCreateRequest;
import com.example.outletmanagement.payload.dto.BatchDto.BatchItemRequest;
import com.example.outletmanagement.payload.dto.BatchDto.BatchReceiveRequest;
import com.example.outletmanagement.payload.dto.BatchDto.BatchResponse;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.BatchService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/batches")
@RequiredArgsConstructor
public class BatchController {

    private final BatchService batchService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BatchResponse>>> getAllBatches(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long outletId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        return ResponseEntity.ok(new ApiResponse<>(true, "All batches fetched",
                batchService.getAllBatches(keyword, outletId, status, fromDate, toDate, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BatchResponse>> getBatchById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Batch fetched", batchService.getBatchById(id)));
    }

    /**
     * POST /api/batches — Outlet admin manually creates a batch record when goods arrive from IMS.
     * The outlet admin provides product quantities and (optionally) mfg/expiry dates at this step.
     */
    @PostMapping
    @AuditAction(action = "CREATE_BATCH", entity = "Batch", captureBody = true)
    public ResponseEntity<ApiResponse<BatchResponse>> createBatch(
            @Valid @RequestBody BatchCreateRequest request,
            HttpServletRequest httpRequest) {
        String createdBy = (String) httpRequest.getAttribute("username");
        if (createdBy == null) createdBy = "system";
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Batch created", batchService.createBatch(request, createdBy)));
    }

    /**
     * PATCH /api/batches/{id}/receive — Records receipt with mfg/expiry dates; triggers stock update.
     * Sets batch status to RECEIVED and initialises remainingQuantity on each BatchItem.
     */
    @PatchMapping("/{id}/receive")
    @AuditAction(action = "RECEIVE_BATCH", entity = "Batch", captureBody = true)
    public ResponseEntity<ApiResponse<BatchResponse>> receiveBatch(
            @PathVariable Long id,
            @Valid @RequestBody BatchReceiveRequest request,
            HttpServletRequest httpRequest) {
        String receivedBy = (String) httpRequest.getAttribute("username");
        if (receivedBy == null) receivedBy = "system";
        return ResponseEntity.ok(new ApiResponse<>(true, "Batch received and stock updated",
                batchService.receiveBatch(id, request, receivedBy)));
    }

    /** @deprecated Use /receive instead; kept for backward compatibility. */
    @PatchMapping("/{id}/deliver")
    @Deprecated
    public ResponseEntity<ApiResponse<BatchResponse>> deliverBatch(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Batch delivered", batchService.deliverBatch(id)));
    }

    @PatchMapping("/{id}/cancel")
    @AuditAction(action = "CANCEL_BATCH", entity = "Batch")
    public ResponseEntity<ApiResponse<BatchResponse>> cancelBatch(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Batch cancelled", batchService.cancelBatch(id)));
    }

    @PutMapping("/{id}/items")
    @AuditAction(action = "UPDATE_BATCH_PRICES", entity = "Batch", captureBody = true)
    public ResponseEntity<ApiResponse<BatchResponse>> updateBatchPrices(
            @PathVariable Long id,
            @Valid @RequestBody List<BatchItemRequest> items) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Batch items updated",
                batchService.updateBatchItemPrices(id, items)));
    }
}
