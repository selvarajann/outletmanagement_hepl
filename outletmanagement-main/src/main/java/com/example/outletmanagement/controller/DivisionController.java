package com.example.outletmanagement.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.outletmanagement.payload.dto.DivisionDto.DivisionRequest;
import com.example.outletmanagement.payload.dto.DivisionDto.DivisionResponse;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.DivisionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/divisions")
@RequiredArgsConstructor
public class DivisionController {

    private final DivisionService divisionService;

    @PostMapping
    public ApiResponse<DivisionResponse> createDivision(
            @RequestBody DivisionRequest request) {

        return new ApiResponse<>(true, "Division created",
                divisionService.createDivision(request));
    }


    @GetMapping
    public ApiResponse<List<DivisionResponse>> getAllDivisions() {

        return new ApiResponse<>(true, "Divisions fetched",
                divisionService.getAllDivisions());
    }

    @GetMapping("/{id}")
    public ApiResponse<DivisionResponse> getDivisionById(
            @PathVariable Long id) {

        return new ApiResponse<>(true, "Division fetched",
                divisionService.getDivisionById(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<DivisionResponse> updateDivision(
            @PathVariable Long id,
            @RequestBody DivisionRequest request) {

        return new ApiResponse<>(true, "Division updated",
                divisionService.updateDivision(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteDivision(@PathVariable Long id) {

        divisionService.deleteDivision(id);

        return new ApiResponse<>(true, "Division deleted", null);
    }
}