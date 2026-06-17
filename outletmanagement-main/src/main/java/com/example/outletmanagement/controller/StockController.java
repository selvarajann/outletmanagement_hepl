package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.payload.dto.StockDto.StockResponse;
import com.example.outletmanagement.payload.dto.StockDto.StockSummaryResponse;
import com.example.outletmanagement.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<StockResponse>>> getAllStock(
            @RequestParam(required = false) Long outletId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "lastUpdatedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        
        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        
        return ResponseEntity.ok(new ApiResponse<>(true, "All stock fetched", 
                stockService.getAllStock(outletId, productId, keyword, pageable)));
    }

    @GetMapping("/outlet/{outletId}")
    public ResponseEntity<ApiResponse<List<StockResponse>>> getStockByOutlet(@PathVariable Long outletId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Outlet stock fetched", stockService.getStockByOutlet(outletId)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<List<StockSummaryResponse>>> getStockSummary() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Stock summary fetched", stockService.getStockSummary()));
    }
}
