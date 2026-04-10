package com.example.outletmanagement.service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.outletmanagement.payload.dto.ProductDto.ProductRequest;
import com.example.outletmanagement.payload.dto.ProductDto.ProductResponse;
public interface ProductService {
    ProductResponse createProduct(ProductRequest request);
    ProductResponse updateProduct(Long id, ProductRequest request);
    Page<ProductResponse> getAllProducts(String keyword, Long divisionId, Pageable pageable);
    ProductResponse getProductById(Long id);

    void deleteProduct(Long id);
    
}
