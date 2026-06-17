package com.example.outletmanagement.controller;

import com.example.outletmanagement.annotation.AuditAction;
import com.example.outletmanagement.payload.dto.SaleDto.SaleRequest;
import com.example.outletmanagement.payload.dto.SaleDto.SaleResponse;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.SaleService;
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

/**
 * REST endpoints for POS sales and external billing integration.
 * <ul>
 *   <li>POST /api/sales          — Process a sale (FEFO deduction)</li>
 *   <li>GET  /api/sales          — Paginated sale history</li>
 *   <li>GET  /api/sales/{id}     — Sale details with FEFO audit trail</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;

    /**
     * Processes a new POS sale. Deducts stock using FEFO (First Expiry First Out) logic.
     * Can be called from the embedded POS UI or from an external billing system.
     */
    @PostMapping
    @com.example.outletmanagement.annotation.Idempotent
    @AuditAction(action = "PROCESS_SALE", entity = "SaleTransaction", captureBody = true)
    public ResponseEntity<ApiResponse<SaleResponse>> processSale(
            @Valid @RequestBody SaleRequest request,
            HttpServletRequest httpRequest) {
        String username = (String) httpRequest.getAttribute("username");
        if (username != null && (request.getSoldBy() == null || request.getSoldBy().isBlank())) {
            request.setSoldBy(username);
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Sale processed successfully", saleService.processSale(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<SaleResponse>>> getAllSales(
            @RequestParam(required = false) Long outletId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "saleTime") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        return ResponseEntity.ok(new ApiResponse<>(true, "Sales fetched",
                saleService.getAllSales(outletId, fromDate, toDate, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SaleResponse>> getSaleById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Sale fetched", saleService.getSaleById(id)));
    }
}
