package com.example.outletmanagement.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import com.example.outletmanagement.payload.dto.DivisionDto.DivisionRequest;
import com.example.outletmanagement.payload.dto.DivisionDto.DivisionResponse;
import com.example.outletmanagement.payload.response.ImportResult;

public interface DivisionService {
    DivisionResponse createDivision(DivisionRequest request);
    Page<DivisionResponse> getAllDivisions(String keyword, Boolean hasProducts, Pageable pageable);
    DivisionResponse getDivisionById(Long id);
    DivisionResponse updateDivision(Long id, DivisionRequest request);
    void deleteDivision(Long id);
    ImportResult importDivisions(MultipartFile file);
    byte[] exportDivisions(String format, String keyword, Boolean hasProducts);
    byte[] getTemplate(String format);
}
