package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.dto.LocationDto.LocationRequest;
import com.example.outletmanagement.payload.dto.LocationDto.LocationResponse;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.LocationService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @PostMapping
    public ApiResponse<LocationResponse> createLocation(
            @RequestBody LocationRequest request) {

        LocationResponse response = locationService.createLocation(request);

        return new ApiResponse<>(true, "Location created", response);
    }

    @GetMapping
    public ApiResponse<List<LocationResponse>> getAllLocations() {

        List<LocationResponse> list = locationService.getAllLocations();

        return new ApiResponse<>(true, "Locations fetched", list);
    }

    @GetMapping("/{id}")
    public ApiResponse<LocationResponse> getLocationById(
            @PathVariable Long id) {

        LocationResponse response = locationService.getLocationById(id);

        return new ApiResponse<>(true, "Location fetched", response);
    }

    @PutMapping("/{id}")
    public ApiResponse<LocationResponse> updateLocation(
            @PathVariable Long id,
            @RequestBody LocationRequest request) {

        LocationResponse response = locationService.updateLocation(id, request);

        return new ApiResponse<>(true, "Location updated", response);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteLocation(
            @PathVariable Long id) {

        locationService.deleteLocation(id);

        return new ApiResponse<>(true, "Location deleted", null);
    }
}