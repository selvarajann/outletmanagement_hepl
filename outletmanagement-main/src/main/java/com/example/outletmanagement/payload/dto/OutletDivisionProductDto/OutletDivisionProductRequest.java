package com.example.outletmanagement.payload.dto.OutletDivisionProductDto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OutletDivisionProductRequest {

    @NotNull(message = "Division ID is required")
    private Long divisionId;

    @NotNull(message = "Product ID is required")
    private Long productId;
}
