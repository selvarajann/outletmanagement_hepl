package com.example.outletmanagement.service;

import java.util.List;

import com.example.outletmanagement.payload.dto.DivisionDto.DivisionRequest;
import com.example.outletmanagement.payload.dto.DivisionDto.DivisionResponse;

public interface DivisionService {

    DivisionResponse createDivision(DivisionRequest request);

    List<DivisionResponse> getAllDivisions();

    DivisionResponse getDivisionById(Long id);

    DivisionResponse updateDivision(Long id, DivisionRequest request);

    void deleteDivision(Long id);
}