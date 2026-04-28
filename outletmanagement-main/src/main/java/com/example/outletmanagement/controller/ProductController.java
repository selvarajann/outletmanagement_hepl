package com.example.outletmanagement.controller;

import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.outletmanagement.payload.dto.ProductDto.ProductRequest;
import com.example.outletmanagement.payload.dto.ProductDto.ProductResponse;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.ProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Product created", productService.createProduct(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAllProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long divisionId,
            @RequestParam(required = false) BigDecimal minSellingPrice,
            @RequestParam(required = false) BigDecimal maxSellingPrice,
            @RequestParam(required = false) BigDecimal minPurchasePrice,
            @RequestParam(required = false) BigDecimal maxPurchasePrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<ProductResponse> response = productService.getAllProducts(
                keyword, divisionId,
                minSellingPrice, maxSellingPrice,
                minPurchasePrice, maxPurchasePrice,
                PageRequest.of(page, size));

        return ResponseEntity.ok(new ApiResponse<>(true, "Products fetched", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Product fetched", productService.getProductById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Product updated", productService.updateProduct(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
