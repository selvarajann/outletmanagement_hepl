package com.example.outletmanagement.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import com.example.outletmanagement.payload.dto.LocationDto.LocationRequest;
import com.example.outletmanagement.payload.dto.LocationDto.LocationResponse;
import com.example.outletmanagement.payload.response.ImportResult;

public interface LocationService {

    LocationResponse createLocation(LocationRequest request);

    Page<LocationResponse> getAllLocations(String keyword, Pageable pageable);

    LocationResponse getLocationById(Long id);

    LocationResponse updateLocation(Long id, LocationRequest request);

    void deleteLocation(Long id);

    ImportResult importLocations(MultipartFile file);
    byte[] exportLocations(String format, String keyword);
    byte[] getTemplate(String format);
}
