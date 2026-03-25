package com.example.outletmanagement.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.outletmanagement.model.entity.Division;
import com.example.outletmanagement.payload.dto.DivisionDto.DivisionRequest;
import com.example.outletmanagement.payload.dto.DivisionDto.DivisionResponse;
import com.example.outletmanagement.repository.DivisionRepository;
import com.example.outletmanagement.service.DivisionService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DivisionServiceImpl implements DivisionService {

    private final DivisionRepository divisionRepository;

    @Override
    public DivisionResponse createDivision(DivisionRequest request) {

        if (request.getName() == null || request.getName().isBlank()) {
            throw new RuntimeException("Division name is required");
        }

        String name = request.getName().trim();

        if (divisionRepository.existsByName(name)) {
            throw new RuntimeException("Division already exists!");
        }

        Division division = new Division();
        division.setName(name);

        return mapToResponse(divisionRepository.save(division));
    }

    @Override
    public List<DivisionResponse> getAllDivisions() {

        return divisionRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public DivisionResponse getDivisionById(Long id) {

        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found with ID: " + id));

        return mapToResponse(division);
    }

    @Override
    public DivisionResponse updateDivision(Long id, DivisionRequest request) {

        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found"));

        if (request.getName() == null || request.getName().isBlank()) {
            throw new RuntimeException("Division name is required");
        }

        String newName = request.getName().trim();

        if (!division.getName().equalsIgnoreCase(newName)
                && divisionRepository.existsByName(newName)) {
            throw new RuntimeException("Division name already exists!");
        }

        division.setName(newName);

        return mapToResponse(divisionRepository.save(division));
    }

    @Override
    public void deleteDivision(Long id) {

        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found"));

        divisionRepository.delete(division);
    }

    private DivisionResponse mapToResponse(Division division) {
        return new DivisionResponse(
                division.getId(),
                division.getName()
        );
    }
}