package com.example.outletmanagement.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.outletmanagement.model.entity.Outlet;
import com.example.outletmanagement.model.entity.Products;
import com.example.outletmanagement.model.entity.SaleTransaction;
import com.example.outletmanagement.model.entity.SaleTransactionItem;
import com.example.outletmanagement.payload.dto.SaleDto.SaleRequest;
import com.example.outletmanagement.payload.dto.SaleDto.SaleResponse;
import com.example.outletmanagement.repository.OutletRepository;
import com.example.outletmanagement.repository.ProductRepository;
import com.example.outletmanagement.repository.SaleTransactionRepository;
import com.example.outletmanagement.service.EmailService;
import com.example.outletmanagement.service.SaleService;
import com.example.outletmanagement.service.StockService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SaleServiceImpl implements SaleService {

    private final SaleTransactionRepository saleTransactionRepository;
    private final OutletRepository outletRepository;
    private final ProductRepository productRepository;
    private final StockService stockService;
    private final EmailService emailService;

    @Override
    @Transactional
    public SaleResponse processSale(SaleRequest request) {
        Outlet outlet = outletRepository.findById(request.getOutletId())
                .orElseThrow(() -> new RuntimeException("Outlet not found: " + request.getOutletId()));

        // Validate unique reference
        String refNo = request.getReferenceNo();
        if (refNo == null || refNo.isBlank()) {
            refNo = "SALE-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        }
        if (saleTransactionRepository.existsByReferenceNo(refNo)) {
            throw new RuntimeException("A sale with reference number '" + refNo + "' already exists");
        }

        // Batch-load all products in one query
        Set<Long> productIds = request.getItems().stream()
                .map(SaleRequest.SaleItemRequest::getProductId)
                .collect(Collectors.toSet());
        Map<Long, Products> productMap = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Products::getId, p -> p));

        // Build the parent transaction
        SaleTransaction transaction = new SaleTransaction();
        transaction.setReferenceNo(refNo);
        transaction.setOutlet(outlet);
        transaction.setSaleTime(LocalDateTime.now());
        transaction.setSoldBy(request.getSoldBy() != null ? request.getSoldBy() : "System");

        List<SaleTransactionItem> transactionItems = new ArrayList<>();
        List<SaleResponse.SaleItemResponse> responseItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (SaleRequest.SaleItemRequest saleItem : request.getItems()) {
            Products product = productMap.get(saleItem.getProductId());
            if (product == null) throw new RuntimeException("Product not found: " + saleItem.getProductId());

            // FEFO deduction — throws InsufficientStockException if stock insufficient
            List<StockService.DeductionResult> deductions =
                    stockService.deductStockFEFO(outlet, product, saleItem.getQuantity());

            for (StockService.DeductionResult deduction : deductions) {
                SaleTransactionItem tItem = new SaleTransactionItem();
                tItem.setTransaction(transaction);
                tItem.setBatchItem(deduction.batchItem());
                tItem.setProduct(product);
                tItem.setQuantityDeducted(deduction.deductedQty());
                tItem.setUnitPrice(saleItem.getUnitPrice());
                tItem.setLineTotal(saleItem.getUnitPrice().multiply(BigDecimal.valueOf(deduction.deductedQty())));
                transactionItems.add(tItem);

                SaleResponse.SaleItemResponse ir = new SaleResponse.SaleItemResponse();
                ir.setProductId(product.getId());
                ir.setProductName(product.getName());
                ir.setProductCode(product.getProductCode());
                ir.setBatchCode(deduction.batchItem().getBatch().getBatchCode());
                ir.setExpiryDate(deduction.batchItem().getExpiryDate());
                ir.setQuantityDeducted(deduction.deductedQty());
                ir.setUnitPrice(saleItem.getUnitPrice());
                ir.setLineTotal(tItem.getLineTotal());
                responseItems.add(ir);

                totalAmount = totalAmount.add(tItem.getLineTotal());
            }
        }

        transaction.setTotalAmount(totalAmount);
        transaction.setItems(transactionItems);
        SaleTransaction saved = saleTransactionRepository.save(transaction);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendSaleCompletedEmail(
                "admin@outletmanagement.com",
                saved.getReferenceNo(),
                outlet.getOutletName(),
                saved.getTotalAmount(),
                saved.getSoldBy(),
                transactionItems.size());

        return buildResponse(saved, responseItems);
    }

    @Override
    public Page<SaleResponse> getAllSales(Long outletId, LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime to = toDate != null ? toDate.atTime(23, 59, 59) : null;

        Page<SaleTransaction> page = saleTransactionRepository.findWithFilters(outletId, from, to, pageable);
        List<SaleResponse> responses = page.getContent().stream()
                .map(t -> buildResponse(t, List.of()))
                .collect(Collectors.toList());
        return new PageImpl<>(responses, pageable, page.getTotalElements());
    }

    @Override
    public SaleResponse getSaleById(Long id) {
        SaleTransaction tx = saleTransactionRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Sale not found: " + id));

        List<SaleResponse.SaleItemResponse> items = tx.getItems().stream().map(item -> {
            SaleResponse.SaleItemResponse ir = new SaleResponse.SaleItemResponse();
            ir.setProductId(item.getProduct().getId());
            ir.setProductName(item.getProduct().getName());
            ir.setProductCode(item.getProduct().getProductCode());
            ir.setBatchCode(item.getBatchItem().getBatch().getBatchCode());
            ir.setExpiryDate(item.getBatchItem().getExpiryDate());
            ir.setQuantityDeducted(item.getQuantityDeducted());
            ir.setUnitPrice(item.getUnitPrice());
            ir.setLineTotal(item.getLineTotal());
            return ir;
        }).collect(Collectors.toList());

        return buildResponse(tx, items);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private SaleResponse buildResponse(SaleTransaction tx, List<SaleResponse.SaleItemResponse> items) {
        SaleResponse resp = new SaleResponse();
        resp.setId(tx.getId());
        resp.setReferenceNo(tx.getReferenceNo());
        resp.setOutletId(tx.getOutlet().getId());
        resp.setOutletName(tx.getOutlet().getOutletName());
        resp.setTotalAmount(tx.getTotalAmount());
        resp.setSaleTime(tx.getSaleTime());
        resp.setSoldBy(tx.getSoldBy());
        resp.setItems(items);
        return resp;
    }
}
