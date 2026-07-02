package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.dto.DashboardDto.DashboardSummaryDto;
import com.example.outletmanagement.payload.dto.DashboardDto.ExpiringItemDto;
import com.example.outletmanagement.payload.dto.DashboardDto.LowStockItemDto;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getSummary() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Dashboard summary", dashboardService.getSummary()));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<LowStockItemDto>>> getLowStock() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Low stock items", dashboardService.getLowStockItems()));
    }

    @GetMapping("/expiring-soon")
    public ResponseEntity<ApiResponse<List<ExpiringItemDto>>> getExpiringSoon(
            @RequestParam(defaultValue = "30") int daysAhead) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Expiring items", dashboardService.getExpiringItems(daysAhead)));
    }
}
