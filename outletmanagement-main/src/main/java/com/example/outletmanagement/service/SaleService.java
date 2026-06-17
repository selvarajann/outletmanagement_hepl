package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.SaleDto.SaleRequest;
import com.example.outletmanagement.payload.dto.SaleDto.SaleResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface SaleService {
    /**
     * Processes a POS sale using FEFO-based stock deduction.
     * Creates SaleTransaction + SaleTransactionItems (FEFO audit trail).
     */
    SaleResponse processSale(SaleRequest request);

    Page<SaleResponse> getAllSales(Long outletId, LocalDate fromDate, LocalDate toDate, Pageable pageable);

    SaleResponse getSaleById(Long id);
}
