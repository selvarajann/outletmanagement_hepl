package com.example.outletmanagement.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.outletmanagement.model.entity.Division;
import com.example.outletmanagement.model.entity.Location;
import com.example.outletmanagement.model.entity.Outlet;
import com.example.outletmanagement.payload.dto.OutletDto.OutletRequest;
import com.example.outletmanagement.payload.dto.OutletDto.OutletResponse;
import com.example.outletmanagement.repository.DivisionRepository;
import com.example.outletmanagement.repository.LocationRepository;
import com.example.outletmanagement.repository.OutletRepository;
import com.example.outletmanagement.service.OutletService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OutletServiceImpl implements OutletService {

    private final OutletRepository outletRepository;
    private final LocationRepository locationRepository;
    private final DivisionRepository divisionRepository;

    @Override
    public OutletResponse createOutlet(OutletRequest request) {

       
        if (request.getOutletName() == null || request.getOutletName().isBlank()) {
            throw new RuntimeException("Outlet name is required");
        }

       // String outletCode = request.getOutletCode().trim();
        String outletName = request.getOutletName().trim();

      
       // if (outletRepository.existsByOutletCode(outletCode)) {
      //      throw new RuntimeException("Outlet code already exists!");
       // }


        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found"));

        if (request.getDivisionIds() == null || request.getDivisionIds().isEmpty()) {
            throw new RuntimeException("At least one division is required");
        }

        List<Long> uniqueIds = request.getDivisionIds().stream()
                .distinct()
                .toList();

        List<Division> divisions = divisionRepository.findAllById(uniqueIds);

        if (divisions.size() != uniqueIds.size()) {
            throw new RuntimeException("One or more divisions not found");
        }

        if (outletRepository.existsByOutletNameAndLocation(outletName, location)) {
            throw new RuntimeException("Duplicate outlet name in this location!");
        }

        Outlet outlet = new Outlet();
        outlet.setOutletCode("O"+System.currentTimeMillis());
        outlet.setOutletName(outletName);
        outlet.setAddress(request.getAddress());
        outlet.setLocation(location);
        outlet.setDivisions(divisions);
        outlet.setOutletType(request.getOutletType());
        outlet.setOwnerName(request.getOwnerName());
       // outlet.setCreatedBy(username);
       // outlet.setUpdatedBy(username);
        outlet.setCreatedAt(LocalDateTime.now());
        outlet.setUpdatedAt(LocalDateTime.now());

        Outlet saved = outletRepository.save(outlet);

        return mapToResponse(saved);
    }

    @Override
    public OutletResponse getOutletById(Long id) {

        Outlet outlet = outletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Outlet not found with ID: " + id));

        return mapToResponse(outlet);
    }

    @Override
    public List<OutletResponse> getAllOutlets() {

        return outletRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public OutletResponse updateOutlet(Long id, OutletRequest request) {

        Outlet outlet = outletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Outlet not found"));

        

        //String newCode = request.getOutletCode().trim();
        String newName = request.getOutletName().trim();

        //if (!outlet.getOutletCode().equalsIgnoreCase(newCode)
        //        && outletRepository.existsByOutletCode(newCode)) {
        //    throw new RuntimeException("Outlet code already exists!");
        //}

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found"));

        List<Long> uniqueIds = request.getDivisionIds().stream()
                .distinct()
                .toList();

        List<Division> divisions = divisionRepository.findAllById(uniqueIds);

        if (divisions.size() != uniqueIds.size()) {
            throw new RuntimeException("Invalid divisions");
        }

        outlet.setOutletCode("O"+System.currentTimeMillis());
        outlet.setOutletName(newName);
        outlet.setAddress(request.getAddress());
        outlet.setLocation(location);
        outlet.setDivisions(divisions);
        outlet.setOutletType(request.getOutletType());
        outlet.setOwnerName(request.getOwnerName());
       // outlet.setUpdatedBy(username);
        outlet.setUpdatedAt(LocalDateTime.now());

        Outlet updated = outletRepository.save(outlet);

        return mapToResponse(updated);
    }

    @Override
    public void deleteOutlet(Long id) {

        Outlet outlet = outletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Outlet not found"));

        outletRepository.delete(outlet);
    }

    private OutletResponse mapToResponse(Outlet outlet) {

        String locationName = outlet.getLocation() != null
                ? outlet.getLocation().getName()
                : null;

        List<String> divisionNames = outlet.getDivisions() != null
                ? outlet.getDivisions().stream()
                        .map(Division::getName)
                        .toList()
                : List.of();

        return new OutletResponse(
                outlet.getId(),
                outlet.getOutletName(),
                outlet.getOutletCode(),
                locationName,
                divisionNames,
                outlet.getOutletType()
        );
    }
}