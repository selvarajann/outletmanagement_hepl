package com.example.outletmanagement.service;

import java.util.List;

import com.example.outletmanagement.payload.dto.OutletDto.OutletRequest;
import com.example.outletmanagement.payload.dto.OutletDto.OutletResponse;

public interface OutletService {

    OutletResponse createOutlet(OutletRequest request);

    OutletResponse getOutletById(Long id);

    List<OutletResponse> getAllOutlets();

    OutletResponse updateOutlet(Long id, OutletRequest request);

    void deleteOutlet(Long id);
}