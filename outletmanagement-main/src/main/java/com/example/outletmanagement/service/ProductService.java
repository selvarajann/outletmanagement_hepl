package com.example.outletmanagement.service;

import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import com.example.outletmanagement.payload.dto.ProductDto.ProductRequest;
import com.example.outletmanagement.payload.dto.ProductDto.ProductResponse;
import com.example.outletmanagement.payload.response.ImportResult;

public interface ProductService {
    ProductResponse createProduct(ProductRequest request);
    ProductResponse updateProduct(Long id, ProductRequest request);
    Page<ProductResponse> getAllProducts(
            String keyword,
            Long divisionId,
            BigDecimal minSellingPrice,
            BigDecimal maxSellingPrice,
            BigDecimal minPurchasePrice,
            BigDecimal maxPurchasePrice,
            Pageable pageable);
    ProductResponse getProductById(Long id);
    void deleteProduct(Long id);
    ProductResponse uploadImage(Long id, MultipartFile file);
    ImportResult importProducts(MultipartFile file);
    byte[] exportProducts(String format, String keyword, Long divisionId, BigDecimal minSellingPrice, BigDecimal maxSellingPrice, BigDecimal minPurchasePrice, BigDecimal maxPurchasePrice);
    byte[] getTemplate(String format);
}
