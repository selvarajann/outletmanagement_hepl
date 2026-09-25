package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.dto.WarehouseProductDto.WarehouseProductRequest;
import com.example.outletmanagement.payload.dto.WarehouseProductDto.WarehouseProductResponse;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.WarehouseProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/warehouse-products")
@RequiredArgsConstructor
public class WarehouseProductController {

    private final WarehouseProductService warehouseProductService;

    @PostMapping
    public ResponseEntity<ApiResponse<WarehouseProductResponse>> createProduct(
            @Valid @RequestBody WarehouseProductRequest request) {
        WarehouseProductResponse created = warehouseProductService.createProduct(request);
        return new ResponseEntity<>(new ApiResponse<>(true, "Product created", created), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<WarehouseProductResponse>>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long divisionId,
            @RequestParam(required = false) BigDecimal minSellingPrice,
            @RequestParam(required = false) BigDecimal maxSellingPrice,
            @RequestParam(required = false) BigDecimal minPurchasePrice,
            @RequestParam(required = false) BigDecimal maxPurchasePrice) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));
        Page<WarehouseProductResponse> result = warehouseProductService.filterProducts(
                keyword, divisionId, minSellingPrice, maxSellingPrice, minPurchasePrice, maxPurchasePrice, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Products fetched", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WarehouseProductResponse>> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Product fetched",
                warehouseProductService.getProductById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WarehouseProductResponse>> updateProduct(
            @PathVariable Long id, @Valid @RequestBody WarehouseProductRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Product updated",
                warehouseProductService.updateProduct(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        warehouseProductService.deleteProduct(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Product deleted", null));
    }
}
