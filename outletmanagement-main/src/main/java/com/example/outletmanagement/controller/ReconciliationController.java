package com.example.outletmanagement.controller;

import com.example.outletmanagement.model.entity.ReconciliationReport;
import com.example.outletmanagement.model.entity.ReconciliationReportItem;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.repository.ReconciliationReportItemRepository;
import com.example.outletmanagement.service.ReconciliationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reconciliation")
@RequiredArgsConstructor
public class ReconciliationController {

    private final ReconciliationService reconciliationService;
    private final ReconciliationReportItemRepository reportItemRepository;

    @PostMapping("/trigger")
    public ResponseEntity<ApiResponse<ReconciliationReport>> trigger(
            @RequestHeader(value = "X-User-Name", defaultValue = "ADMIN") String username) {
        try {
            ReconciliationReport report = reconciliationService.triggerReconciliation(username);
            return ResponseEntity.ok(new ApiResponse<>(true, "Reconciliation triggered successfully", report));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<Page<ReconciliationReport>>> getReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(new ApiResponse<>(true, "Reports retrieved", reconciliationService.getReports(pageable)));
    }

    @GetMapping("/reports/{id}")
    public ResponseEntity<ApiResponse<ReconciliationReport>> getReport(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new ApiResponse<>(true, "Report retrieved", reconciliationService.getReport(id)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/reports/{id}/items")
    public ResponseEntity<ApiResponse<List<ReconciliationReportItem>>> getReportItems(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Report items retrieved", reportItemRepository.findByReport_Id(id)));
    }

    @GetMapping("/reports/{id}/mismatches")
    public ResponseEntity<ApiResponse<List<ReconciliationReportItem>>> getMismatches(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Mismatches retrieved",
                reportItemRepository.findByReport_IdAndMismatchTypeNot(id, "MATCH")));
    }
}
