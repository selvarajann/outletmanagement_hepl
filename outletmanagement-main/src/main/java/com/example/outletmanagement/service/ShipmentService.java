package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.ShipmentDto.ShipmentReceiveRequestDto;
import com.example.outletmanagement.payload.dto.ShipmentDto.ShipmentReceiveResponseDto;
import org.springframework.data.domain.Page;

import java.time.LocalDate;

public interface ShipmentService {

    Page<ShipmentReceiveResponseDto> getShipments(String keyword, Long outletId, String status, LocalDate fromDate, LocalDate toDate, int page, int size, String sortBy, String direction);

    ShipmentReceiveResponseDto getShipmentDetails(Long shipmentId);

    ShipmentReceiveResponseDto receiveShipment(Long shipmentId, ShipmentReceiveRequestDto request, String receivedBy);
}
