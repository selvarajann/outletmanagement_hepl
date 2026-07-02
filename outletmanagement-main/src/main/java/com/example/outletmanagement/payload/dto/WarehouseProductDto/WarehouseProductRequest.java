package com.example.outletmanagement.payload.dto.WarehouseProductDto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WarehouseProductRequest {

    @NotBlank(message = "Product name is required")
    private String name;

    @NotBlank(message = "Product code is required")
    private String productCode;

    private Long divisionId;

    @NotNull(message = "UIM price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "UIM price must be greater than 0")
    private BigDecimal uimPrice;

    @NotNull(message = "MRP is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "MRP must be greater than 0")
    private BigDecimal mrp;

    @NotNull(message = "Selling price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Selling price must be greater than 0")
    private BigDecimal sellingPrice;

    @NotNull(message = "Purchase price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Purchase price must be greater than 0")
    private BigDecimal purchasePrice;
}
