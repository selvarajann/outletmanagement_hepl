package com.example.outletmanagement.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.outletmanagement.payload.dto.DivisionDto.DivisionRequest;
import com.example.outletmanagement.payload.dto.DivisionDto.DivisionResponse;

public interface DivisionService {
    DivisionResponse createDivision(DivisionRequest request);
    Page<DivisionResponse> getAllDivisions(String keyword, Boolean hasProducts, Pageable pageable);
    DivisionResponse getDivisionById(Long id);
    DivisionResponse updateDivision(Long id, DivisionRequest request);
    void deleteDivision(Long id);
}
