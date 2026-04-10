package com.example.outletmanagement.service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.outletmanagement.payload.dto.LocationDto.LocationRequest;
import com.example.outletmanagement.payload.dto.LocationDto.LocationResponse;
public interface LocationService {

    LocationResponse createLocation(LocationRequest request);

    Page<LocationResponse> getAllLocations(String keyword, Pageable pageable);
    LocationResponse getLocationById(Long id);
LocationResponse updateLocation(Long id, LocationRequest request);
void deleteLocation(Long id);
}
