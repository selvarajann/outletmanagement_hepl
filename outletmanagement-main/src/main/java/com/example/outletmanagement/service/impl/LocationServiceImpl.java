package com.example.outletmanagement.service.impl;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.outletmanagement.model.entity.Location;
import com.example.outletmanagement.model.entity.Outlet;
import com.example.outletmanagement.payload.dto.LocationDto.LocationRequest;
import com.example.outletmanagement.payload.dto.LocationDto.LocationResponse;
import com.example.outletmanagement.payload.response.ImportResult;
import com.example.outletmanagement.repository.LocationRepository;
import com.example.outletmanagement.repository.OutletDivisionProductRepository;
import com.example.outletmanagement.repository.OutletRepository;
import com.example.outletmanagement.repository.StockOrderRepository;
import com.example.outletmanagement.service.LocationService;
import com.example.outletmanagement.specification.LocationSpecification;
import com.example.outletmanagement.util.ExportUtil;
import com.example.outletmanagement.util.FileUtil;
import com.example.outletmanagement.util.FileValidator;
import com.example.outletmanagement.service.FailedImportStorageService;
import com.example.outletmanagement.service.EmailService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LocationServiceImpl implements LocationService {

    private final LocationRepository locationRepository;
    private final OutletRepository outletRepository;
    private final OutletDivisionProductRepository mappingRepo;
    private final StockOrderRepository stockOrderRepository;
    private final FailedImportStorageService failedImportStorageService;
    private final EmailService emailService;

    @Override
    public LocationResponse createLocation(LocationRequest request) {
        String name = request.getName().trim();
        if (locationRepository.existsByName(name))
            throw new RuntimeException("Location already exists!");
        Location location = new Location();
        location.setName(name);
        Location saved = locationRepository.save(location);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendLocationCreatedEmail("admin@outletmanagement.com", saved.getName());

        return mapToResponse(saved);
    }

    @Override
    public Page<LocationResponse> getAllLocations(String keyword, Pageable pageable) {
        return locationRepository.findAll(LocationSpecification.searchAndFilter(keyword), pageable)
                .map(this::mapToResponse);
    }

    @Override
    public LocationResponse getLocationById(Long id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found"));
        return mapToResponse(location);
    }

    @Override
    public LocationResponse updateLocation(Long id, LocationRequest request) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found"));
        String newName = request.getName().trim();
        if (!location.getName().equalsIgnoreCase(newName) && locationRepository.existsByName(newName))
            throw new RuntimeException("Location already exists!");
        String oldName = location.getName();
        location.setName(newName);
        Location saved = locationRepository.save(location);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendLocationUpdatedEmail("admin@outletmanagement.com", oldName, saved.getName());

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteLocation(Long id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found"));
        List<Outlet> outlets = outletRepository.findByLocation_Id(id);

        if (!outlets.isEmpty()) {
            // FIX: single query to find which outlet IDs have orders — replaces N existsByOutlet_Id calls
            List<Long> outletIds = outlets.stream().map(Outlet::getId).collect(Collectors.toList());
            List<Long> outletsWithOrders = stockOrderRepository.findOutletIdsWithOrders(outletIds);
            if (!outletsWithOrders.isEmpty()) {
                // Find the first offending outlet name for the error message
                String offendingOutletName = outlets.stream()
                        .filter(o -> outletsWithOrders.contains(o.getId()))
                        .map(Outlet::getOutletName)
                        .findFirst().orElse("unknown");
                throw new RuntimeException(
                    "Cannot delete location '" + location.getName() +
                    "' because outlet '" + offendingOutletName +
                    "' has existing stock orders. Please remove the stock orders first.");
            }
            for (Outlet outlet : outlets) {
                mappingRepo.deleteByOutlet_Id(outlet.getId());
            }
            mappingRepo.flush();
        }

        outletRepository.deleteAll(outlets);
        locationRepository.delete(location);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendLocationDeletedEmail("admin@outletmanagement.com", location.getName());
    }

    @Override
    public ImportResult importLocations(MultipartFile file) {
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
                if (locationRepository.existsByNameIgnoreCase(name)) {
                    addFailedRow(failedRows, cols, originalHeaders.length, "Location already exists");
                    failed++;
                    continue;
                }

                Location location = new Location();
                location.setName(name);
                locationRepository.save(location);
                imported++;
            }
            
            if (!failedRows.isEmpty() && originalHeaders != null) {
                String[] failedHeaders = java.util.Arrays.copyOf(originalHeaders, originalHeaders.length + 1);
                failedHeaders[failedHeaders.length - 1] = "Error Reason";
                byte[] excelBytes = ExportUtil.generateExcel(failedHeaders, failedRows);
                String fileId = failedImportStorageService.storeFile(excelBytes);
                failedFileUrl = "/api/locations/import/failed/" + fileId;
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to read file: " + e.getMessage());
        }

        boolean success = failed == 0;
        ImportResult result = new ImportResult(success, imported, failed, 0, failedFileUrl);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendImportCompletedEmail("admin@outletmanagement.com", "Locations", imported, failed, failedFileUrl);

        return result;
    }

    @Override
    public byte[] exportLocations(String format, String keyword) {
        List<Location> locations = locationRepository.findAll(LocationSpecification.searchAndFilter(keyword));
        
        String[] headers = {"name"};
        List<String[]> data = new ArrayList<>();
        
        for (Location l : locations) {
            data.add(new String[]{l.getName()});
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
        data.add(new String[]{"Headquarters"});
        
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

    private LocationResponse mapToResponse(Location location) {
        return new LocationResponse(location.getId(), location.getName());
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
