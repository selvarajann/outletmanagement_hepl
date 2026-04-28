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

import com.example.outletmanagement.payload.dto.DivisionDto.DivisionRequest;
import com.example.outletmanagement.payload.dto.DivisionDto.DivisionResponse;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.DivisionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/divisions")
@RequiredArgsConstructor
public class DivisionController {

    private final DivisionService divisionService;

    @PostMapping
    public ResponseEntity<ApiResponse<DivisionResponse>> createDivision(
            @Valid @RequestBody DivisionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Division created", divisionService.createDivision(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<DivisionResponse>>> getAllDivisions(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean hasProducts,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(new ApiResponse<>(true, "Divisions fetched",
                divisionService.getAllDivisions(keyword, hasProducts, PageRequest.of(page, size))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DivisionResponse>> getDivisionById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Division fetched", divisionService.getDivisionById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DivisionResponse>> updateDivision(
            @PathVariable Long id,
            @Valid @RequestBody DivisionRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Division updated", divisionService.updateDivision(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDivision(@PathVariable Long id) {
        divisionService.deleteDivision(id);
        return ResponseEntity.noContent().build();
    }
}
