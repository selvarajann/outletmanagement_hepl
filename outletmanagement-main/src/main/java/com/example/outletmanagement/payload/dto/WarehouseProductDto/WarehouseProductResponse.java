package com.example.outletmanagement.payload.dto.WarehouseProductDto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WarehouseProductResponse {

    private Long id;
    private String name;
    private String productCode;
    private Long divisionId;
    private BigDecimal uimPrice;
    private BigDecimal mrp;
    private BigDecimal sellingPrice;
    private BigDecimal purchasePrice;
    private String imageUrl;
}
