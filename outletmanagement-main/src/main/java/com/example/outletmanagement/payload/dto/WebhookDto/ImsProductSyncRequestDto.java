package com.example.outletmanagement.payload.dto.WebhookDto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImsProductSyncRequestDto {
    @NotBlank(message = "productCode is required")
    private String productCode;

    @NotBlank(message = "name is required")
    private String name;

    @NotNull(message = "uimPrice is required")
    @PositiveOrZero(message = "uimPrice must be zero or positive")
    private BigDecimal uimPrice;

    @NotNull(message = "mrp is required")
    @PositiveOrZero(message = "mrp must be zero or positive")
    private BigDecimal mrp;

    @NotNull(message = "sellingPrice is required")
    @PositiveOrZero(message = "sellingPrice must be zero or positive")
    private BigDecimal sellingPrice;

    @NotNull(message = "purchasePrice is required")
    @PositiveOrZero(message = "purchasePrice must be zero or positive")
    private BigDecimal purchasePrice;

    private String divisionName;

    private String imageUrl;
    
    private String status; // ACTIVE, INACTIVE, DISCONTINUED
}
