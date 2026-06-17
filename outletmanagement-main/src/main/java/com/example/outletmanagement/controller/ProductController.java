package com.example.outletmanagement.controller;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.outletmanagement.annotation.AuditAction;
import com.example.outletmanagement.model.entity.Products;
import com.example.outletmanagement.payload.dto.ProductDto.ProductRequest;
import com.example.outletmanagement.payload.dto.ProductDto.ProductResponse;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.payload.response.ImportResult;
import com.example.outletmanagement.repository.ProductRepository;
import com.example.outletmanagement.service.FailedImportStorageService;
import com.example.outletmanagement.service.ProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ProductRepository productRepository;
    private final FailedImportStorageService failedImportStorageService;

    @PostMapping
    @AuditAction(action = "CREATE_PRODUCT", entity = "Product", captureBody = true)
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
                keyword, divisionId, minSellingPrice, maxSellingPrice,
                minPurchasePrice, maxPurchasePrice, PageRequest.of(page, size));
        return ResponseEntity.ok(new ApiResponse<>(true, "Products fetched", response));
    }

    @PostMapping("/import")
    @AuditAction(action = "IMPORT_PRODUCTS", entity = "Product")
    public ResponseEntity<ApiResponse<ImportResult>> importProducts(
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Import completed", productService.importProducts(file)));
    }

    @GetMapping("/import/failed/{id}")
    public ResponseEntity<byte[]> downloadFailedImport(@PathVariable String id) {
        byte[] data = failedImportStorageService.getFile(id);
        if (data == null) return ResponseEntity.notFound().build();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "failed_import_products.xlsx");
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportProducts(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String divisionId,
            @RequestParam(required = false) String minSellingPrice,
            @RequestParam(required = false) String maxSellingPrice,
            @RequestParam(required = false) String minPurchasePrice,
            @RequestParam(required = false) String maxPurchasePrice) {

        Long parsedDivId = parseOrNull(divisionId) != null ? Long.valueOf(divisionId.trim()) : null;
        BigDecimal parsedMinSell  = parseBigDecimal(minSellingPrice);
        BigDecimal parsedMaxSell  = parseBigDecimal(maxSellingPrice);
        BigDecimal parsedMinPurch = parseBigDecimal(minPurchasePrice);
        BigDecimal parsedMaxPurch = parseBigDecimal(maxPurchasePrice);

        byte[] data = productService.exportProducts(format, keyword, parsedDivId,
                parsedMinSell, parsedMaxSell, parsedMinPurch, parsedMaxPurch);

        HttpHeaders headers = new HttpHeaders();
        if ("excel".equalsIgnoreCase(format)) {
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "products_export.xlsx");
        } else {
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "products_export.csv");
        }
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> getTemplate(@RequestParam(defaultValue = "csv") String format) {
        byte[] data = productService.getTemplate(format);
        HttpHeaders headers = new HttpHeaders();
        if ("excel".equalsIgnoreCase(format)) {
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "products_template.xlsx");
        } else {
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "products_template.csv");
        }
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Product fetched", productService.getProductById(id)));
    }

    @PutMapping("/{id:\\d+}")
    @AuditAction(action = "UPDATE_PRODUCT", entity = "Product", captureBody = true)
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Product updated", productService.updateProduct(id, request)));
    }

    @DeleteMapping("/{id:\\d+}")
    @AuditAction(action = "DELETE_PRODUCT", entity = "Product")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    /** Upload or replace product image — delegates fully to service layer */
    @PatchMapping(value = "/{id:\\d+}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @AuditAction(action = "UPLOAD_PRODUCT_IMAGE", entity = "Product")
    public ResponseEntity<ApiResponse<ProductResponse>> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Image uploaded", productService.uploadImage(id, file)));
    }

    /** Serve product image bytes directly */
    @GetMapping("/{id:\\d+}/image")
    public ResponseEntity<byte[]> getProductImage(@PathVariable Long id) throws IOException {
        Products product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (product.getImageUrl() == null || product.getImageUrl().isBlank()) {
            return ResponseEntity.notFound().build();
        }

        Path imagePath = Paths.get(product.getImageUrl().replaceFirst("^/", ""))
                .toAbsolutePath().normalize();

        if (!Files.exists(imagePath)) {
            return ResponseEntity.notFound().build();
        }

        byte[] imageBytes = Files.readAllBytes(imagePath);
        String mimeType = Files.probeContentType(imagePath);
        if (mimeType == null) mimeType = "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mimeType))
                .body(imageBytes);
    }

    private String parseOrNull(String val) {
        return (val != null && !val.trim().isEmpty()) ? val.trim() : null;
    }

    private BigDecimal parseBigDecimal(String val) {
        String trimmed = parseOrNull(val);
        return trimmed != null ? new BigDecimal(trimmed) : null;
    }
}