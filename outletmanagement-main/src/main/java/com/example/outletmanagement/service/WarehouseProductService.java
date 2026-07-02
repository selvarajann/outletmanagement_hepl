package com.example.outletmanagement.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.example.outletmanagement.payload.dto.WarehouseProductDto.WarehouseProductRequest;
import com.example.outletmanagement.payload.dto.WarehouseProductDto.WarehouseProductResponse;

public interface WarehouseProductService {
    WarehouseProductResponse createProduct(WarehouseProductRequest request);
    Page<WarehouseProductResponse> getAllProducts(Pageable pageable);
    WarehouseProductResponse getProductById(Long id);
    WarehouseProductResponse updateProduct(Long id, WarehouseProductRequest request);
    void deleteProduct(Long id);
}
