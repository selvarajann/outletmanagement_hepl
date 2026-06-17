package com.example.outletmanagement.payload.dto.BatchDto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchItemRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Selling Price is required")
    private BigDecimal sellingPrice;

    @NotNull(message = "Purchase Price is required")
    private BigDecimal purchasePrice;

    @NotNull(message = "MRP is required")
    private BigDecimal mrp;

    @NotNull(message = "UIM Price is required")
    private BigDecimal uimPrice;
}
