package com.example.outletmanagement.service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.outletmanagement.payload.dto.OutletDto.OutletRequest;
import com.example.outletmanagement.payload.dto.OutletDto.OutletResponse;

public interface OutletService {

    OutletResponse createOutlet(OutletRequest request);

    OutletResponse getOutletById(Long id);

    Page<OutletResponse> getAllOutlets(String keyword, Long locationId, Long divisionId, Pageable pageable);

    OutletResponse updateOutlet(Long id, OutletRequest request);

    void deleteOutlet(Long id);
}
