package com.example.outletmanagement.service;
import java.util.List;

import com.example.outletmanagement.payload.dto.LocationDto.LocationRequest;
import com.example.outletmanagement.payload.dto.LocationDto.LocationResponse;
public interface LocationService {

    LocationResponse createLocation(LocationRequest request);

    List<LocationResponse> getAllLocations();
    LocationResponse getLocationById(Long id);
LocationResponse updateLocation(Long id, LocationRequest request);
void deleteLocation(Long id);
}
