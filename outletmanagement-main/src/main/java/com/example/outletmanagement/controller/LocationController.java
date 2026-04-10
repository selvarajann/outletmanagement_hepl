package com.example.outletmanagement.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
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

import com.example.outletmanagement.payload.dto.LocationDto.LocationRequest;
import com.example.outletmanagement.payload.dto.LocationDto.LocationResponse;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.LocationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

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

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Locations fetched", response)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LocationResponse>> getLocationById(
            @PathVariable Long id) {

        LocationResponse response = locationService.getLocationById(id);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Location fetched", response)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LocationResponse>> updateLocation(
            @PathVariable Long id,
            @Valid @RequestBody LocationRequest request) {

        LocationResponse response = locationService.updateLocation(id, request);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Location updated", response)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable Long id) {

        locationService.deleteLocation(id);

        return ResponseEntity.noContent().build();
    }
}