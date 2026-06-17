package com.example.outletmanagement.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;

import com.example.outletmanagement.annotation.AuditAction;
import com.example.outletmanagement.payload.dto.DivisionDto.DivisionRequest;
import com.example.outletmanagement.payload.dto.DivisionDto.DivisionResponse;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.payload.response.ImportResult;
import com.example.outletmanagement.service.DivisionService;
import com.example.outletmanagement.service.FailedImportStorageService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/divisions")
@RequiredArgsConstructor
public class DivisionController {

    private final DivisionService divisionService;
    private final FailedImportStorageService failedImportStorageService;

    @PostMapping
    @AuditAction(action = "CREATE_DIVISION", entity = "Division", captureBody = true)
    public ResponseEntity<ApiResponse<DivisionResponse>> createDivision(
            @Valid @RequestBody DivisionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Division created", divisionService.createDivision(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<DivisionResponse>>> getAllDivisions(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean hasProducts,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Divisions fetched",
                divisionService.getAllDivisions(keyword, hasProducts, PageRequest.of(page, size))));
    }

    /** Bulk import from file */
    @PostMapping("/import")
    @AuditAction(action = "IMPORT_DIVISIONS", entity = "Division")
    public ResponseEntity<ApiResponse<ImportResult>> importDivisions(
            @RequestParam("file") MultipartFile file) {
        ImportResult result = divisionService.importDivisions(file);
        String message = result.isSuccess() ? "Import successful" : "Import completed with errors";
        return ResponseEntity.ok(new ApiResponse<>(result.isSuccess(), message, result));
    }

    @GetMapping("/import/failed/{id}")
    public ResponseEntity<byte[]> downloadFailedImport(@PathVariable String id) {
        byte[] data = failedImportStorageService.getFile(id);
        if (data == null) {
            return ResponseEntity.notFound().build();
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "failed_import_divisions.xlsx");
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportDivisions(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String hasProducts) {

        Boolean parsedHasProducts = (hasProducts != null && !hasProducts.trim().isEmpty()) ? Boolean.valueOf(hasProducts) : null;
        byte[] data = divisionService.exportDivisions(format, keyword, parsedHasProducts);
        
        HttpHeaders headers = new HttpHeaders();
        if ("excel".equalsIgnoreCase(format)) {
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "divisions_export.xlsx");
        } else {
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "divisions_export.csv");
        }
        
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> getTemplate(@RequestParam(defaultValue = "csv") String format) {
        byte[] data = divisionService.getTemplate(format);
        
        HttpHeaders headers = new HttpHeaders();
        if ("excel".equalsIgnoreCase(format)) {
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "divisions_template.xlsx");
        } else {
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "divisions_template.csv");
        }
        
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<DivisionResponse>> getDivisionById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Division fetched", divisionService.getDivisionById(id)));
    }

    @PutMapping("/{id:\\d+}")
    @AuditAction(action = "UPDATE_DIVISION", entity = "Division", captureBody = true)
    public ResponseEntity<ApiResponse<DivisionResponse>> updateDivision(
            @PathVariable Long id,
            @Valid @RequestBody DivisionRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Division updated", divisionService.updateDivision(id, request)));
    }

    @DeleteMapping("/{id:\\d+}")
    @AuditAction(action = "DELETE_DIVISION", entity = "Division")
    public ResponseEntity<Void> deleteDivision(@PathVariable Long id) {
        divisionService.deleteDivision(id);
        return ResponseEntity.noContent().build();
    }
}
