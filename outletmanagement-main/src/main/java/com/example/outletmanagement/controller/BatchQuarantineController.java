package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.BatchQuarantineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

import com.example.outletmanagement.payload.dto.BatchQuarantineResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api/batch-quarantine")
@RequiredArgsConstructor
public class BatchQuarantineController {

    private final BatchQuarantineService batchQuarantineService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BatchQuarantineResponseDto>>> getQuarantinedItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "batch.createdAt"));
        return ResponseEntity.ok(new ApiResponse<>(true, "Fetched quarantined items", 
                batchQuarantineService.getQuarantinedBatchItems(pageable)));
    }

    @PostMapping("/{batchItemId}/approve")
    public ResponseEntity<ApiResponse<?>> approveQuarantine(
            @PathVariable Long batchItemId,
            @RequestHeader(value = "X-User-Name", defaultValue = "SYSTEM") String reviewedBy) {
        try {
            return ResponseEntity.ok(batchQuarantineService.approveQuarantine(batchItemId, reviewedBy));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/{batchItemId}/reject")
    public ResponseEntity<ApiResponse<?>> rejectQuarantine(
            @PathVariable Long batchItemId,
            @RequestBody Map<String, String> payload,
            @RequestHeader(value = "X-User-Name", defaultValue = "SYSTEM") String reviewedBy) {
        try {
            String reason = payload.getOrDefault("reason", "No reason provided");
            return ResponseEntity.ok(batchQuarantineService.rejectQuarantine(batchItemId, reviewedBy, reason));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
