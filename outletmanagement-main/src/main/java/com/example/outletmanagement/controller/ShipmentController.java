package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.dto.ShipmentDto.ShipmentReceiveRequestDto;
import com.example.outletmanagement.payload.dto.ShipmentDto.ShipmentReceiveResponseDto;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ShipmentReceiveResponseDto>>> getShipments(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long outletId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {

        Page<ShipmentReceiveResponseDto> shipments = shipmentService.getShipments(
                keyword, outletId, status, fromDate, toDate, page, size, sortBy, direction);

        return ResponseEntity.ok(new ApiResponse<>(true, "Shipments fetched successfully", shipments));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShipmentReceiveResponseDto>> getShipmentDetails(@PathVariable Long id) {
        ShipmentReceiveResponseDto response = shipmentService.getShipmentDetails(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Shipment details fetched successfully", response));
    }

    @PostMapping("/{id}/receive")
    public ResponseEntity<ApiResponse<ShipmentReceiveResponseDto>> receiveShipment(
            @PathVariable Long id,
            @RequestBody ShipmentReceiveRequestDto request,
            HttpServletRequest servletRequest) {

        String username = (String) servletRequest.getAttribute("authenticatedUsername");
        if (username == null) {
            username = "SYSTEM"; // Fallback if no JWT is parsed
        }

        ShipmentReceiveResponseDto response = shipmentService.receiveShipment(id, request, username);
        return ResponseEntity.ok(new ApiResponse<>(true, "Shipment received successfully", response));
    }
}
