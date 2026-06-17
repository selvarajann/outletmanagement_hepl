package com.example.outletmanagement.service;

import com.example.outletmanagement.model.entity.BatchItem;
import com.example.outletmanagement.model.entity.Outlet;
import com.example.outletmanagement.model.entity.Products;
import com.example.outletmanagement.payload.dto.StockDto.StockResponse;
import com.example.outletmanagement.payload.dto.StockDto.StockSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface StockService {
    void upsertStock(Outlet outlet, Products product, int quantity, String batchCode);
    Page<StockResponse> getAllStock(Long outletId, Long productId, String keyword, Pageable pageable);
    List<StockResponse> getStockByOutlet(Long outletId);
    List<StockSummaryResponse> getStockSummary();

    /**
     * FEFO deduction: deducts quantitySold from the earliest-expiry batch items first.
     * Returns the list of (BatchItem, deductedQty) pairs for audit trail creation.
     *
     * @throws com.example.outletmanagement.exception.InsufficientStockException if stock is insufficient
     */
    List<DeductionResult> deductStockFEFO(Outlet outlet, Products product, int quantitySold);

    /** Holds the result of one FEFO deduction step for audit trail recording. */
    record DeductionResult(BatchItem batchItem, int deductedQty) {}
}
