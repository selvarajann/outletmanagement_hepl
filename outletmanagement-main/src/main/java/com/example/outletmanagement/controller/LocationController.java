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

import com.example.outletmanagement.payload.dto.LocationDto.LocationRequest;
import com.example.outletmanagement.payload.dto.LocationDto.LocationResponse;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.payload.response.ImportResult;
import com.example.outletmanagement.service.LocationService;
import com.example.outletmanagement.service.FailedImportStorageService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;
    private final FailedImportStorageService failedImportStorageService;

    @PostMapping
    public ResponseEntity<ApiResponse<LocationResponse>> createLocation(
            @Valid @RequestBody LocationRequest request) {
        LocationResponse response = locationService.createLocation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Location created", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<LocationResponse>>> getAllLocations(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<LocationResponse> response =
                locationService.getAllLocations(keyword, PageRequest.of(page, size));
        return ResponseEntity.ok(new ApiResponse<>(true, "Locations fetched", response));
    }

    /** Bulk import from file */
    @PostMapping("/import")
    public ResponseEntity<ApiResponse<ImportResult>> importLocations(
            @RequestParam("file") MultipartFile file) {
        ImportResult result = locationService.importLocations(file);
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
        headers.setContentDispositionFormData("attachment", "failed_import_locations.xlsx");
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportLocations(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) String keyword) {

        byte[] data = locationService.exportLocations(format, keyword);
        
        HttpHeaders headers = new HttpHeaders();
        if ("excel".equalsIgnoreCase(format)) {
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "locations_export.xlsx");
        } else {
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "locations_export.csv");
        }
        
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> getTemplate(@RequestParam(defaultValue = "csv") String format) {
        byte[] data = locationService.getTemplate(format);
        
        HttpHeaders headers = new HttpHeaders();
        if ("excel".equalsIgnoreCase(format)) {
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "locations_template.xlsx");
        } else {
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "locations_template.csv");
        }
        
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<LocationResponse>> getLocationById(@PathVariable Long id) {
        LocationResponse response = locationService.getLocationById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Location fetched", response));
    }

    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<LocationResponse>> updateLocation(
            @PathVariable Long id,
            @Valid @RequestBody LocationRequest request) {
        LocationResponse response = locationService.updateLocation(id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Location updated", response));
    }

    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<Void> deleteLocation(@PathVariable Long id) {
        locationService.deleteLocation(id);
        return ResponseEntity.noContent().build();
    }
}