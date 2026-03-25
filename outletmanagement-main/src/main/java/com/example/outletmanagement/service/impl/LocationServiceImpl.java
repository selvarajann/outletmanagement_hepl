package com.example.outletmanagement.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.outletmanagement.model.entity.Location;
import com.example.outletmanagement.payload.dto.LocationDto.LocationRequest;
import com.example.outletmanagement.payload.dto.LocationDto.LocationResponse;
import com.example.outletmanagement.repository.LocationRepository;
import com.example.outletmanagement.service.LocationService;

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

        Location saved = locationRepository.save(location);

        return mapToResponse(saved);
    }


    @Override
    public List<LocationResponse> getAllLocations() {

        return locationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    
    @Override
    public LocationResponse getLocationById(Long id) {

        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found with ID: " + id));

        return mapToResponse(location);
    }

    @Override
    public LocationResponse updateLocation(Long id, LocationRequest request) {

        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found with ID: " + id));

        String newName = request.getName().trim();


        if (!location.getName().equalsIgnoreCase(newName)
                && locationRepository.existsByName(newName)) {
            throw new RuntimeException("Location name already exists!");
        }

        location.setName(newName);

        Location updated = locationRepository.save(location);

        return mapToResponse(updated);
    }


    @Override
    public void deleteLocation(Long id) {

        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found with ID: " + id));

        locationRepository.delete(location);
    }

    private LocationResponse mapToResponse(Location location) {
        return new LocationResponse(
                location.getId(),
                location.getName()
        );
    }
}