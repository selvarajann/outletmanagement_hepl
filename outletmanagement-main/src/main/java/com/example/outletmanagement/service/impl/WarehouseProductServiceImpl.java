package com.example.outletmanagement.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.outletmanagement.model.entity.Division;
import com.example.outletmanagement.model.entity.WarehouseProducts;
import com.example.outletmanagement.payload.dto.WarehouseProductDto.WarehouseProductRequest;
import com.example.outletmanagement.payload.dto.WarehouseProductDto.WarehouseProductResponse;
import com.example.outletmanagement.repository.DivisionRepository;
import com.example.outletmanagement.repository.WarehouseProductRepository;
import com.example.outletmanagement.service.WarehouseProductService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class WarehouseProductServiceImpl implements WarehouseProductService {

    private final WarehouseProductRepository warehouseProductRepository;
    private final DivisionRepository divisionRepository;

    @Override
    public WarehouseProductResponse createProduct(WarehouseProductRequest request) {
        String name = request.getName().trim();
        String code = request.getProductCode().trim();

        if (warehouseProductRepository.existsByProductCode(code))
            throw new RuntimeException("Warehouse Product code already exists!");
        if (request.getSellingPrice().compareTo(request.getMrp()) > 0)
            throw new RuntimeException("Selling price cannot be greater than MRP");
        if (request.getPurchasePrice().compareTo(request.getMrp()) > 0)
            throw new RuntimeException("Purchase price cannot be greater than MRP");

        Division division = divisionRepository.findById(request.getDivisionId())
                .orElseThrow(() -> new RuntimeException("Division not found"));

        WarehouseProducts product = new WarehouseProducts();
        product.setName(name);
        product.setProductCode(code);
        product.setUimPrice(request.getUimPrice());
        product.setMrp(request.getMrp());
        product.setSellingPrice(request.getSellingPrice());
        product.setPurchasePrice(request.getPurchasePrice());
        product.setDivision(division);

        WarehouseProducts saved = warehouseProductRepository.save(product);
        return mapToResponse(saved);
    }

    @Override
    public Page<WarehouseProductResponse> getAllProducts(Pageable pageable) {
        return warehouseProductRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    public WarehouseProductResponse getProductById(Long id) {
        WarehouseProducts product = warehouseProductRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse Product not found"));
        return mapToResponse(product);
    }

    @Override
    public WarehouseProductResponse updateProduct(Long id, WarehouseProductRequest request) {
        WarehouseProducts product = warehouseProductRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse Product not found"));

        String newName = request.getName().trim();
        String newCode = request.getProductCode().trim();

        if (!product.getProductCode().equalsIgnoreCase(newCode) && warehouseProductRepository.existsByProductCode(newCode))
            throw new RuntimeException("Warehouse Product code already exists!");
        if (request.getSellingPrice().compareTo(request.getMrp()) > 0)
            throw new RuntimeException("Selling price cannot be greater than MRP");
        if (request.getPurchasePrice().compareTo(request.getMrp()) > 0)
            throw new RuntimeException("Purchase price cannot be greater than MRP");

        Division division = divisionRepository.findById(request.getDivisionId())
                .orElseThrow(() -> new RuntimeException("Division not found"));

        product.setName(newName);
        product.setProductCode(newCode);
        product.setUimPrice(request.getUimPrice());
        product.setMrp(request.getMrp());
        product.setSellingPrice(request.getSellingPrice());
        product.setPurchasePrice(request.getPurchasePrice());
        product.setDivision(division);

        WarehouseProducts saved = warehouseProductRepository.save(product);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        WarehouseProducts product = warehouseProductRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse Product not found"));
        warehouseProductRepository.delete(product);
    }

    private WarehouseProductResponse mapToResponse(WarehouseProducts product) {
        WarehouseProductResponse r = new WarehouseProductResponse();
        r.setId(product.getId());
        r.setName(product.getName());
        r.setProductCode(product.getProductCode());
        r.setDivisionId(product.getDivision() != null ? product.getDivision().getId() : null);
        r.setUimPrice(product.getUimPrice());
        r.setMrp(product.getMrp());
        r.setSellingPrice(product.getSellingPrice());
        r.setPurchasePrice(product.getPurchasePrice());
        r.setImageUrl(product.getImageUrl());
        return r;
    }
}
