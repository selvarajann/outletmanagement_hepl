package com.example.outletmanagement.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.example.outletmanagement.payload.dto.WarehouseProductDto.WarehouseProductRequest;
import com.example.outletmanagement.payload.dto.WarehouseProductDto.WarehouseProductResponse;

import java.math.BigDecimal;

public interface WarehouseProductService {
    WarehouseProductResponse createProduct(WarehouseProductRequest request);
    Page<WarehouseProductResponse> getAllProducts(Pageable pageable);
    Page<WarehouseProductResponse> filterProducts(String keyword, Long divisionId,
        BigDecimal minSellingPrice, BigDecimal maxSellingPrice,
        BigDecimal minPurchasePrice, BigDecimal maxPurchasePrice, Pageable pageable);
    WarehouseProductResponse getProductById(Long id);
    WarehouseProductResponse updateProduct(Long id, WarehouseProductRequest request);
    void deleteProduct(Long id);
}
