package com.example.outletmanagement.service.impl;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.outletmanagement.model.entity.Division;
import com.example.outletmanagement.model.entity.Products;
import com.example.outletmanagement.payload.dto.ProductDto.ProductRequest;
import com.example.outletmanagement.payload.dto.ProductDto.ProductResponse;
import com.example.outletmanagement.payload.response.ImportResult;
import com.example.outletmanagement.repository.DivisionRepository;
import com.example.outletmanagement.repository.OutletDivisionProductRepository;
import com.example.outletmanagement.repository.ProductRepository;
import com.example.outletmanagement.service.ProductService;
import com.example.outletmanagement.service.EmailService;
import com.example.outletmanagement.specification.ProductSpecification;
import com.example.outletmanagement.util.ExportUtil;
import com.example.outletmanagement.util.FileUtil;
import com.example.outletmanagement.util.FileValidator;
import com.example.outletmanagement.service.FailedImportStorageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024L; // 5 MB
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp", ".gif");

    @Value("${app.upload.dir:uploads/products}")
    private String uploadDir;

    private final ProductRepository productRepository;
    private final OutletDivisionProductRepository mappingRepo;
    private final DivisionRepository divisionRepository;
    private final FailedImportStorageService failedImportStorageService;
    private final EmailService emailService;

    @Override
    public ProductResponse createProduct(ProductRequest request) {
        String name = request.getName().trim();
        String code = request.getProductCode().trim();

        if (productRepository.existsByName(name))
            throw new RuntimeException("Product name already exists!");
        if (productRepository.existsByProductCode(code))
            throw new RuntimeException("Product code already exists!");
        if (request.getSellingPrice().compareTo(request.getMrp()) > 0)
            throw new RuntimeException("Selling price cannot be greater than MRP");
        if (request.getPurchasePrice().compareTo(request.getMrp()) > 0)
            throw new RuntimeException("Purchase price cannot be greater than MRP");

        Division division = divisionRepository.findById(request.getDivisionId())
                .orElseThrow(() -> new RuntimeException("Division not found"));

        Products product = new Products();
        product.setName(name);
        product.setProductCode(code);
        product.setUimPrice(request.getUimPrice());
        product.setMrp(request.getMrp());
        product.setSellingPrice(request.getSellingPrice());
        product.setPurchasePrice(request.getPurchasePrice());
        product.setDivision(division);

        Products saved = productRepository.save(product);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendProductCreatedEmail(
                "admin@outletmanagement.com",
                saved.getName(), saved.getProductCode(),
                division.getName(), saved.getSellingPrice());

        return mapToResponse(saved);
    }

    @Override
    public Page<ProductResponse> getAllProducts(
            String keyword, Long divisionId,
            BigDecimal minSellingPrice, BigDecimal maxSellingPrice,
            BigDecimal minPurchasePrice, BigDecimal maxPurchasePrice,
            Pageable pageable) {
        return productRepository.findAll(
                ProductSpecification.searchAndFilter(keyword, divisionId,
                        minSellingPrice, maxSellingPrice, minPurchasePrice, maxPurchasePrice),
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

        if (!product.getName().equalsIgnoreCase(newName) && productRepository.existsByName(newName))
            throw new RuntimeException("Product name already exists!");
        if (!product.getProductCode().equalsIgnoreCase(newCode) && productRepository.existsByProductCode(newCode))
            throw new RuntimeException("Product code already exists!");
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

        Products saved = productRepository.save(product);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendProductUpdatedEmail(
                "admin@outletmanagement.com",
                saved.getName(), saved.getProductCode(), saved.getSellingPrice());

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ProductResponse uploadImage(Long id, MultipartFile file) {
        validateImageFile(file);

        Products product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        String originalFilename = file.getOriginalFilename();
        String extension = (originalFilename != null && originalFilename.contains("."))
                ? originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase()
                : ".jpg";

        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Invalid image file extension: " + extension);
        }

        String filename = "product_" + id + "_" + UUID.randomUUID() + extension;
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(uploadPath);
            Path destination = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Failed to store image for product {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to store image. Please try again.");
        }

        // Delete old image after new one is saved successfully
        if (product.getImageUrl() != null) {
            deleteOldImage(product.getImageUrl());
        }

        product.setImageUrl("/uploads/products/" + filename);
        return mapToResponse(productRepository.save(product));
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file cannot be empty.");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("Image size exceeds the 5MB limit.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Only JPEG, PNG, WebP, and GIF images are allowed.");
        }
    }

    private void deleteOldImage(String imageUrl) {
        try {
            String relativePath = imageUrl.replaceFirst("^/", "");
            Path oldPath = Paths.get(relativePath).toAbsolutePath().normalize();
            Files.deleteIfExists(oldPath);
        } catch (IOException e) {
            log.warn("Could not delete old image: {}", imageUrl);
        }
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Products product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        mappingRepo.deleteByProduct_Id(id);
        mappingRepo.flush();
        productRepository.delete(product);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendProductDeletedEmail(
                "admin@outletmanagement.com",
                product.getName(), product.getProductCode());
    }

    @Override
    public ImportResult importProducts(MultipartFile file) {
        FileValidator.validateImportFile(file);

        int imported = 0;
        int failed   = 0;
        List<String[]> failedRows = new ArrayList<>();
        String[] originalHeaders = null;
        String failedFileUrl = null;

        try {
            List<String[]> rows = FileUtil.parseFile(file, 7);
            if (rows.isEmpty() || rows.size() == 1) { // 1 means only header
                return new ImportResult(false, 0, 0, 0, null);
            }

            originalHeaders = rows.get(0);
            int rowNum = 1;
            boolean firstRow = true;
            for (String[] cols : rows) {
                if (firstRow) {
                    firstRow = false;
                    continue; // Skip header
                }
                rowNum++;

                if (cols.length < 7) {
                    addFailedRow(failedRows, cols, originalHeaders.length, "Expected 7 columns");
                    failed++;
                    continue;
                }

                String name         = cols[0] != null ? cols[0].trim() : "";
                String productCode  = cols[1] != null ? cols[1].trim() : "";
                String divisionName = cols[2] != null ? cols[2].trim() : "";
                String uimPriceStr  = cols[3] != null ? cols[3].trim() : "";
                String mrpStr       = cols[4] != null ? cols[4].trim() : "";
                String sellStr      = cols[5] != null ? cols[5].trim() : "";
                String purchStr     = cols[6] != null ? cols[6].trim() : "";

                if (name.isEmpty() || productCode.isEmpty()) {
                    addFailedRow(failedRows, cols, originalHeaders.length, "name and productCode are required");
                    failed++;
                    continue;
                }
                if (productRepository.existsByName(name)) {
                    addFailedRow(failedRows, cols, originalHeaders.length, "Product name already exists");
                    failed++;
                    continue;
                }
                if (productRepository.existsByProductCode(productCode)) {
                    addFailedRow(failedRows, cols, originalHeaders.length, "Product code already exists");
                    failed++;
                    continue;
                }

                Division division = null;
                if (!divisionName.isEmpty()) {
                    division = divisionRepository.findByNameIgnoreCase(divisionName).orElse(null);
                    if (division == null) {
                        addFailedRow(failedRows, cols, originalHeaders.length, "Division not found");
                        failed++;
                        continue;
                    }
                }

                BigDecimal uimPrice, mrp, sellingPrice, purchasePrice;
                try {
                    uimPrice      = new BigDecimal(uimPriceStr);
                    mrp           = new BigDecimal(mrpStr);
                    sellingPrice  = new BigDecimal(sellStr);
                    purchasePrice = new BigDecimal(purchStr);
                } catch (NumberFormatException e) {
                    addFailedRow(failedRows, cols, originalHeaders.length, "Invalid price value");
                    failed++;
                    continue;
                }

                if (sellingPrice.compareTo(mrp) > 0) {
                    addFailedRow(failedRows, cols, originalHeaders.length, "Selling price > MRP");
                    failed++;
                    continue;
                }

                Products product = new Products();
                product.setName(name);
                product.setProductCode(productCode);
                product.setUimPrice(uimPrice);
                product.setMrp(mrp);
                product.setSellingPrice(sellingPrice);
                product.setPurchasePrice(purchasePrice);
                product.setDivision(division);
                productRepository.save(product);
                imported++;
            }
            
            if (!failedRows.isEmpty() && originalHeaders != null) {
                String[] failedHeaders = java.util.Arrays.copyOf(originalHeaders, originalHeaders.length + 1);
                failedHeaders[failedHeaders.length - 1] = "Error Reason";
                byte[] excelBytes = ExportUtil.generateExcel(failedHeaders, failedRows);
                String fileId = failedImportStorageService.storeFile(excelBytes);
                failedFileUrl = "/api/products/import/failed/" + fileId;
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to read file: " + e.getMessage());
        }

        boolean success = failed == 0;
        ImportResult result = new ImportResult(success, imported, failed, 0, failedFileUrl);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendImportCompletedEmail(
                "admin@outletmanagement.com",
                "Products", imported, failed, failedFileUrl);

        return result;
    }

    @Override
    public byte[] exportProducts(String format, String keyword, Long divisionId, BigDecimal minSellingPrice, BigDecimal maxSellingPrice, BigDecimal minPurchasePrice, BigDecimal maxPurchasePrice) {
        List<Products> products = productRepository.findAll(ProductSpecification.searchAndFilter(keyword, divisionId, minSellingPrice, maxSellingPrice, minPurchasePrice, maxPurchasePrice));
        
        String[] headers = {"name", "productCode", "divisionName", "uimPrice", "mrp", "sellingPrice", "purchasePrice"};
        List<String[]> data = new ArrayList<>();
        
        for (Products p : products) {
            data.add(new String[]{
                p.getName(),
                p.getProductCode(),
                p.getDivision() != null ? p.getDivision().getName() : "",
                p.getUimPrice() != null ? p.getUimPrice().toString() : "0",
                p.getMrp() != null ? p.getMrp().toString() : "0",
                p.getSellingPrice() != null ? p.getSellingPrice().toString() : "0",
                p.getPurchasePrice() != null ? p.getPurchasePrice().toString() : "0"
            });
        }
        
        try {
            if ("excel".equalsIgnoreCase(format)) {
                return ExportUtil.generateExcel(headers, data);
            } else {
                return ExportUtil.generateCsv(headers, data);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate export file", e);
        }
    }

    @Override
    public byte[] getTemplate(String format) {
        String[] headers = {"name", "productCode", "divisionName", "uimPrice", "mrp", "sellingPrice", "purchasePrice"};
        List<String[]> data = new ArrayList<>();
        data.add(new String[]{"Milk Powder", "PRD-001", "Dairy", "45.00", "55.00", "50.00", "40.00"});
        
        try {
            if ("excel".equalsIgnoreCase(format)) {
                return ExportUtil.generateExcel(headers, data);
            } else {
                return ExportUtil.generateCsv(headers, data);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate template file", e);
        }
    }

    private ProductResponse mapToResponse(Products product) {
        ProductResponse r = new ProductResponse();
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

    private void addFailedRow(List<String[]> failedRows, String[] cols, int headerLength, String errorReason) {
        String[] failedRow = new String[headerLength + 1];
        for (int i = 0; i < cols.length && i < headerLength; i++) {
            failedRow[i] = cols[i] != null ? cols[i] : "";
        }
        for (int i = cols.length; i < headerLength; i++) {
            failedRow[i] = "";
        }
        failedRow[headerLength] = errorReason;
        failedRows.add(failedRow);
    }
}
