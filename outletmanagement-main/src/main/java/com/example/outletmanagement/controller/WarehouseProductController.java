package com.example.outletmanagement.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.outletmanagement.payload.dto.WarehouseProductDto.WarehouseProductRequest;
import com.example.outletmanagement.payload.dto.WarehouseProductDto.WarehouseProductResponse;
import com.example.outletmanagement.service.WarehouseProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/warehouse-products")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class WarehouseProductController {

    private final WarehouseProductService warehouseProductService;

    @PostMapping
    public ResponseEntity<WarehouseProductResponse> createProduct(@Valid @RequestBody WarehouseProductRequest request) {
        return new ResponseEntity<>(warehouseProductService.createProduct(request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Page<WarehouseProductResponse>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(warehouseProductService.getAllProducts(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WarehouseProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseProductService.getProductById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WarehouseProductResponse> updateProduct(
            @PathVariable Long id, @Valid @RequestBody WarehouseProductRequest request) {
        return ResponseEntity.ok(warehouseProductService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        warehouseProductService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
