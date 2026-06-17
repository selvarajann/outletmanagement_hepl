package com.example.outletmanagement.payload.dto.ShipmentDto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentRequestDto {
    private String notes;

    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    private List<ShipmentItemDto> items;
}
