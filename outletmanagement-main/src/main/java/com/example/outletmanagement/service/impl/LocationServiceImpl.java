package com.example.outletmanagement.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.outletmanagement.model.entity.Location;
import com.example.outletmanagement.payload.dto.LocationDto.LocationRequest;
import com.example.outletmanagement.payload.dto.LocationDto.LocationResponse;
import com.example.outletmanagement.repository.LocationRepository;
import com.example.outletmanagement.service.LocationService;
import com.example.outletmanagement.specification.LocationSpecification;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LocationServiceImpl implements LocationService {

    private final LocationRepository locationRepository;

    @Override
    public LocationResponse createLocation(LocationRequest request) {

        String name = request.getName().trim();

        if (locationRepository.existsByName(name)) {
            throw new RuntimeException("Location already exists!");
        }

        Location location = new Location();
        location.setName(name);

        return mapToResponse(locationRepository.save(location));
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

        if (!location.getName().equalsIgnoreCase(newName)
                && locationRepository.existsByName(newName)) {
            throw new RuntimeException("Location already exists!");
        }

        location.setName(newName);

        return mapToResponse(locationRepository.save(location));
    }

    @Override
    public void deleteLocation(Long id) {

        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found"));

        locationRepository.delete(location);
    }

    private LocationResponse mapToResponse(Location location) {
        return new LocationResponse(
                location.getId(),
                location.getName()
        );
    }
}