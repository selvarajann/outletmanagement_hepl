package com.example.outletmanagement.controller;

import org.springframework.web.bind.annotation.*;

import com.example.outletmanagement.payload.dto.OutletDto.OutletRequest;
import com.example.outletmanagement.payload.dto.OutletDto.OutletResponse;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.OutletService;

import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/outlets")
@RequiredArgsConstructor
public class OutletController {

    private final OutletService outletService;

  
    @PostMapping
    public ApiResponse<OutletResponse> create(
            @RequestBody OutletRequest request
    ) {
        return new ApiResponse<>(true, "Created",
                outletService.createOutlet(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<OutletResponse> getOutletById(@PathVariable Long id) {

        OutletResponse response = outletService.getOutletById(id);

        return new ApiResponse<>(
                true,
                "Outlet fetched successfully",
                response
        );
    }

 
    @GetMapping
    public ApiResponse<List<OutletResponse>> getAllOutlets() {

        List<OutletResponse> list = outletService.getAllOutlets();

        return new ApiResponse<>(
                true,
                "All outlets fetched",
                list
        );
    }

    @PutMapping("/{id}")
    public ApiResponse<OutletResponse> updateOutlet(
            @PathVariable Long id,
            @RequestBody OutletRequest request
    ) {

        OutletResponse response = outletService.updateOutlet(id, request);

        return new ApiResponse<>(
                true,
                "Outlet updated successfully",
                response
        );
    }

  
    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteOutlet(
            @PathVariable Long id
    ) {

        outletService.deleteOutlet(id);

        return new ApiResponse<>(
                true,
                "Outlet deleted successfully",
                null
        );
    }
}