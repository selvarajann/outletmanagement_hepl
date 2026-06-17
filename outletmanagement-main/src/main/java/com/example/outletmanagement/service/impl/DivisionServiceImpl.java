package com.example.outletmanagement.service.impl;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.outletmanagement.model.entity.Division;
import com.example.outletmanagement.payload.dto.DivisionDto.DivisionRequest;
import com.example.outletmanagement.payload.dto.DivisionDto.DivisionResponse;
import com.example.outletmanagement.payload.dto.ProductDto.ProductResponse;
import com.example.outletmanagement.payload.response.ImportResult;
import com.example.outletmanagement.repository.DivisionRepository;
import com.example.outletmanagement.repository.OutletDivisionProductRepository;
import com.example.outletmanagement.repository.ProductRepository;
import com.example.outletmanagement.service.DivisionService;
import com.example.outletmanagement.specification.DivisionSpecification;
import com.example.outletmanagement.util.ExportUtil;
import com.example.outletmanagement.util.FileUtil;
import com.example.outletmanagement.util.FileValidator;
import com.example.outletmanagement.service.FailedImportStorageService;
import com.example.outletmanagement.service.EmailService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DivisionServiceImpl implements DivisionService {

    private final DivisionRepository divisionRepository;
    private final ProductRepository productRepository;
    private final OutletDivisionProductRepository outletDivisionProductRepository;
    private final FailedImportStorageService failedImportStorageService;
    private final EmailService emailService;

    @Override
    public DivisionResponse createDivision(DivisionRequest request) {
        String name = request.getName().trim();
        if (divisionRepository.existsByNameIgnoreCase(name))
            throw new RuntimeException("Division already exists!");
        Division division = new Division();
        division.setName(name);
        Division saved = divisionRepository.save(division);
        assignProducts(saved, request.getProductIds());

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendDivisionCreatedEmail("admin@outletmanagement.com", saved.getName());

        return mapToResponse(saved);
    }

    @Override
    public Page<DivisionResponse> getAllDivisions(String keyword, Boolean hasProducts, Pageable pageable) {
        return divisionRepository.findAll(DivisionSpecification.searchAndFilter(keyword, hasProducts), pageable)
                .map(this::mapToResponse);
    }

    @Override
    public DivisionResponse getDivisionById(Long id) {
        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found"));
        return mapToResponse(division);
    }

    @Override
    public DivisionResponse updateDivision(Long id, DivisionRequest request) {
        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found"));
        String newName = request.getName().trim();
        if (!division.getName().equalsIgnoreCase(newName) && divisionRepository.existsByNameIgnoreCase(newName))
            throw new RuntimeException("Division already exists!");
        String oldName = division.getName();
        division.setName(newName);
        Division saved = divisionRepository.save(division);
        productRepository.findByDivision_Id(saved.getId())
                .forEach(p -> { p.setDivision(null); productRepository.save(p); });
        assignProducts(saved, request.getProductIds());

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendDivisionUpdatedEmail("admin@outletmanagement.com", oldName, saved.getName());

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteDivision(Long id) {
        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found"));
        productRepository.findByDivision_Id(id)
                .forEach(p -> { p.setDivision(null); productRepository.save(p); });
        outletDivisionProductRepository.deleteByDivision_Id(id);
        divisionRepository.delete(division);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendDivisionDeletedEmail("admin@outletmanagement.com", division.getName());
    }

    @Override
    public ImportResult importDivisions(MultipartFile file) {
        FileValidator.validateImportFile(file);

        int imported = 0;
        int failed   = 0;
        List<String[]> failedRows = new ArrayList<>();
        String[] originalHeaders = null;
        String failedFileUrl = null;

        try {
            List<String[]> rows = FileUtil.parseFile(file, 1);
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

                String name = cols.length > 0 && cols[0] != null ? cols[0].trim() : "";

                if (name.isEmpty()) {
                    addFailedRow(failedRows, cols, originalHeaders.length, "name is required");
                    failed++;
                    continue;
                }
                if (divisionRepository.existsByNameIgnoreCase(name)) {
                    addFailedRow(failedRows, cols, originalHeaders.length, "Division already exists");
                    failed++;
                    continue;
                }

                Division division = new Division();
                division.setName(name);
                divisionRepository.save(division);
                imported++;
            }
            
            if (!failedRows.isEmpty() && originalHeaders != null) {
                String[] failedHeaders = java.util.Arrays.copyOf(originalHeaders, originalHeaders.length + 1);
                failedHeaders[failedHeaders.length - 1] = "Error Reason";
                byte[] excelBytes = ExportUtil.generateExcel(failedHeaders, failedRows);
                String fileId = failedImportStorageService.storeFile(excelBytes);
                failedFileUrl = "/api/divisions/import/failed/" + fileId;
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to read file: " + e.getMessage());
        }

        boolean success = failed == 0;
        ImportResult result = new ImportResult(success, imported, failed, 0, failedFileUrl);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendImportCompletedEmail("admin@outletmanagement.com", "Divisions", imported, failed, failedFileUrl);

        return result;
    }

    @Override
    public byte[] exportDivisions(String format, String keyword, Boolean hasProducts) {
        List<Division> divisions = divisionRepository.findAll(DivisionSpecification.searchAndFilter(keyword, hasProducts));
        
        String[] headers = {"name"};
        List<String[]> data = new ArrayList<>();
        
        for (Division d : divisions) {
            data.add(new String[]{d.getName()});
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
        String[] headers = {"name"};
        List<String[]> data = new ArrayList<>();
        data.add(new String[]{"Dairy"});
        
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

    private void assignProducts(Division division, List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) return;
        productRepository.findAllById(productIds)
                .forEach(p -> { p.setDivision(division); productRepository.save(p); });
    }

    private DivisionResponse mapToResponse(Division division) {
        List<ProductResponse> products = productRepository
                .findByDivision_Id(division.getId())
                .stream()
                .map(p -> new ProductResponse(
                        p.getId(), p.getName(), p.getProductCode(),
                        p.getDivision() != null ? p.getDivision().getId() : null,
                        p.getUimPrice(), p.getMrp(), p.getSellingPrice(),
                        p.getPurchasePrice(), p.getImageUrl()))
                .toList();

        return new DivisionResponse(division.getId(), division.getName(), products);
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