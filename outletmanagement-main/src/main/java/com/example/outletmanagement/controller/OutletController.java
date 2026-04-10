package com.example.outletmanagement.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.outletmanagement.payload.dto.OutletDto.OutletRequest;
import com.example.outletmanagement.payload.dto.OutletDto.OutletResponse;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.OutletService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/outlets")
@RequiredArgsConstructor
public class OutletController {

    private final OutletService outletService;

    @PostMapping
    public ResponseEntity<ApiResponse<OutletResponse>> create(
            @Valid @RequestBody OutletRequest request) {

        OutletResponse response = outletService.createOutlet(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Outlet created", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OutletResponse>> getOutletById(@PathVariable Long id) {

        OutletResponse response = outletService.getOutletById(id);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Outlet fetched successfully", response)
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OutletResponse>>> getAllOutlets(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) Long divisionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<OutletResponse> response =
                outletService.getAllOutlets(keyword, locationId, divisionId,
                        PageRequest.of(page, size));

        return ResponseEntity.ok(
                new ApiResponse<>(true, "All outlets fetched", response)
        );
    }


    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OutletResponse>> updateOutlet(
            @PathVariable Long id,
            @Valid @RequestBody OutletRequest request) {

        OutletResponse response = outletService.updateOutlet(id, request);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Outlet updated successfully", response)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOutlet(@PathVariable Long id) {

        outletService.deleteOutlet(id);

        return ResponseEntity.noContent().build();
    }
}