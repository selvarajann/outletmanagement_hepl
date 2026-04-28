package com.example.outletmanagement.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.outletmanagement.model.entity.Division;
import com.example.outletmanagement.model.entity.Products;
import com.example.outletmanagement.payload.dto.ProductDto.ProductRequest;
import com.example.outletmanagement.payload.dto.ProductDto.ProductResponse;
import com.example.outletmanagement.repository.DivisionRepository;
import com.example.outletmanagement.repository.OutletDivisionProductRepository;
import com.example.outletmanagement.repository.ProductRepository;
import com.example.outletmanagement.service.ProductService;
import com.example.outletmanagement.specification.ProductSpecification;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final OutletDivisionProductRepository mappingRepo;
    private final DivisionRepository divisionRepository;

    @Override
    public ProductResponse createProduct(ProductRequest request) {

        String name = request.getName().trim();
        String code = request.getProductCode().trim();

        if (productRepository.existsByName(name)) {
            throw new RuntimeException("Product name already exists!");
        }

        if (productRepository.existsByProductCode(code)) {
            throw new RuntimeException("Product code already exists!");
        }

        if (request.getSellingPrice().compareTo(request.getMrp()) > 0) {
            throw new RuntimeException("Selling price cannot be greater than MRP");
        }

        if (request.getPurchasePrice().compareTo(request.getMrp()) > 0) {
            throw new RuntimeException("Purchase price cannot be greater than MRP");
        }

        Division division = divisionRepository.findById(request.getDivisionId())
                .orElseThrow(() -> new RuntimeException("Division not found"));

        Products product = new Products();
        product.setName(name);
        product.setProductCode(code);
        product.setUimPrice(request.getUimPrice());
        product.setMrp(request.getMrp());
        product.setSellingPrice(request.getSellingPrice());
        product.setPurchasePrice(request.getPurchasePrice());
        // product.setExpireDate(request.getExpireDate());
        product.setDivision(division);

        return mapToResponse(productRepository.save(product));
    }

    @Override
    public Page<ProductResponse> getAllProducts(
            String keyword,
            Long divisionId,
            java.math.BigDecimal minSellingPrice,
            java.math.BigDecimal maxSellingPrice,
            java.math.BigDecimal minPurchasePrice,
            java.math.BigDecimal maxPurchasePrice,
            Pageable pageable) {
        return productRepository.findAll(
                ProductSpecification.searchAndFilter(keyword, divisionId, minSellingPrice, maxSellingPrice, minPurchasePrice, maxPurchasePrice),
                pageable).map(this::mapToResponse);
    }

    @Override
    public ProductResponse getProductById(Long id) {
        Products product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        return mapToResponse(product);
    }

    @Override
    public ProductResponse updateProduct(Long id, ProductRequest request) {

        Products product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        String newName = request.getName().trim();
        String newCode = request.getProductCode().trim();

        if (!product.getName().equalsIgnoreCase(newName) && productRepository.existsByName(newName)) {
            throw new RuntimeException("Product name already exists!");
        }

        if (!product.getProductCode().equalsIgnoreCase(newCode) && productRepository.existsByProductCode(newCode)) {
            throw new RuntimeException("Product code already exists!");
        }

        if (request.getSellingPrice().compareTo(request.getMrp()) > 0) {
            throw new RuntimeException("Selling price cannot be greater than MRP");
        }

        if (request.getPurchasePrice().compareTo(request.getMrp()) > 0) {
            throw new RuntimeException("Purchase price cannot be greater than MRP");
        }

        Division division = divisionRepository.findById(request.getDivisionId())
                .orElseThrow(() -> new RuntimeException("Division not found"));

        product.setName(newName);
        product.setProductCode(newCode);
        product.setUimPrice(request.getUimPrice());
        product.setMrp(request.getMrp());
        product.setSellingPrice(request.getSellingPrice());
        product.setPurchasePrice(request.getPurchasePrice());
        // product.setExpireDate(request.getExpireDate());
        product.setDivision(division);

        return mapToResponse(productRepository.save(product));
    }

    @Override
    public void deleteProduct(Long id) {
        Products product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (mappingRepo.existsByProduct_Id(id)) {
            throw new RuntimeException("Product is used in mapping, cannot delete");
        }

        productRepository.delete(product);
    }

    private ProductResponse mapToResponse(Products product) {
        return new ProductResponse(

                product.getId(),
                product.getName(),
                product.getProductCode(),
                product.getUimPrice(),
                product.getMrp(),
                product.getSellingPrice(),
                product.getPurchasePrice()
                // product.getExpireDate()
        );
    }
}
