package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.dto.StockReturnDto.StockReturnRequestDto;
import com.example.outletmanagement.payload.dto.StockReturnDto.StockReturnResponseDto;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.StockReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/stock-returns")
@RequiredArgsConstructor
public class StockReturnController {

    private final StockReturnService stockReturnService;

    @PostMapping
    public ResponseEntity<ApiResponse<StockReturnResponseDto>> createReturn(
            @RequestBody StockReturnRequestDto request,
            HttpServletRequest servletRequest) {

        String username = (String) servletRequest.getAttribute("authenticatedUsername");
        if (username == null) {
            username = "SYSTEM";
        }

        StockReturnResponseDto response = stockReturnService.createReturn(request, username);
        return ResponseEntity.ok(new ApiResponse<>(true, "Stock Return created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<StockReturnResponseDto>>> getStockReturns(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long outletId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {

        Page<StockReturnResponseDto> returns = stockReturnService.getStockReturns(
                keyword, outletId, status, fromDate, toDate, page, size, sortBy, direction);

        return ResponseEntity.ok(new ApiResponse<>(true, "Stock Returns fetched successfully", returns));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StockReturnResponseDto>> getStockReturnDetails(@PathVariable Long id) {
        StockReturnResponseDto response = stockReturnService.getStockReturnDetails(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Stock Return details fetched successfully", response));
    }

    @PostMapping("/{id}/retry-ims")
    public ResponseEntity<ApiResponse<StockReturnResponseDto>> retryImsPush(
            @PathVariable Long id,
            HttpServletRequest servletRequest) {

        String username = (String) servletRequest.getAttribute("authenticatedUsername");
        if (username == null) {
            username = "SYSTEM";
        }

        StockReturnResponseDto response = stockReturnService.retryImsPush(id, username);
        return ResponseEntity.ok(new ApiResponse<>(true, "IMS Push retried successfully", response));
    }
}
