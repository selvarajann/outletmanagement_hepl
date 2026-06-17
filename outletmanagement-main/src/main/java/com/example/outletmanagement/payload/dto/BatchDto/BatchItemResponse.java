package com.example.outletmanagement.payload.dto.BatchDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchItemResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String productCode;
    private String divisionName;
    private Integer quantity;
    private Integer remainingQuantity;
    private LocalDate mfgDate;
    private LocalDate expiryDate;
    private BigDecimal sellingPrice;
    private BigDecimal purchasePrice;
    private BigDecimal mrp;
    private BigDecimal uimPrice;
    private BigDecimal lineTotal;
    private BigDecimal lineProfit;
}
