package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.dto.ImsPortalDto.*;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.ImsPortalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ims-portal")
@RequiredArgsConstructor
public class ImsPortalController {

    private final ImsPortalService imsPortalService;

    // ── Orders ───────────────────────────────────────────────────────────────

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<ImsPortalOrderResponseDto>>> getIncomingOrders(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(new ApiResponse<>(true, "Orders fetched",
                imsPortalService.getIncomingOrders(status, pageable)));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<ImsPortalOrderResponseDto>> getOrderDetail(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Order fetched",
                imsPortalService.getOrderDetail(id)));
    }

    @PostMapping("/orders/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approveOrder(
            @PathVariable Long id,
            @RequestBody(required = false) ImsPortalApproveRequestDto request) {
        imsPortalService.approveOrder(id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order approved", null));
    }

    @PostMapping("/orders/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectOrder(
            @PathVariable Long id,
            @Valid @RequestBody ImsPortalRejectRequestDto request) {
        imsPortalService.rejectOrder(id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order rejected", null));
    }

    @PostMapping("/orders/{id}/dispatch")
    public ResponseEntity<ApiResponse<Void>> dispatchOrder(
            @PathVariable Long id,
            @Valid @RequestBody ImsPortalDispatchRequestDto request) {
        imsPortalService.dispatchOrder(id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order dispatched successfully", null));
    }

    // ── Stock Returns ────────────────────────────────────────────────────────

    @GetMapping("/returns")
    public ResponseEntity<ApiResponse<Page<ImsPortalReturnResponseDto>>> getIncomingReturns(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(new ApiResponse<>(true, "Returns fetched",
                imsPortalService.getIncomingReturns(status, pageable)));
    }

    @GetMapping("/returns/{returnCode}")
    public ResponseEntity<ApiResponse<ImsPortalReturnResponseDto>> getReturnDetail(@PathVariable String returnCode) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Return fetched",
                imsPortalService.getReturnDetail(returnCode)));
    }

    @PostMapping("/returns/{returnCode}/acknowledge")
    public ResponseEntity<ApiResponse<Void>> acknowledgeReturn(
            @PathVariable String returnCode,
            @RequestBody(required = false) ImsPortalReturnActionDto request) {
        imsPortalService.acknowledgeReturn(returnCode, request != null ? request : new ImsPortalReturnActionDto());
        return ResponseEntity.ok(new ApiResponse<>(true, "Return acknowledged", null));
    }

    @PostMapping("/returns/{returnCode}/pickup")
    public ResponseEntity<ApiResponse<Void>> pickupReturn(
            @PathVariable String returnCode,
            @RequestBody(required = false) ImsPortalReturnActionDto request) {
        imsPortalService.pickupReturn(returnCode, request != null ? request : new ImsPortalReturnActionDto());
        return ResponseEntity.ok(new ApiResponse<>(true, "Return pickup initiated", null));
    }

    @PostMapping("/returns/{returnCode}/complete")
    public ResponseEntity<ApiResponse<Void>> completeReturn(
            @PathVariable String returnCode,
            @RequestBody(required = false) ImsPortalReturnActionDto request) {
        imsPortalService.completeReturn(returnCode, request != null ? request : new ImsPortalReturnActionDto());
        return ResponseEntity.ok(new ApiResponse<>(true, "Return completed", null));
    }
}
