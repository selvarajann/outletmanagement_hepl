package com.example.outletmanagement.payload.dto.StockDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockResponse {

    private Long id;
    private Long outletId;
    private String outletName;
    private Long productId;
    private String productCode;
    private String productName;
    private String divisionName;
    private Integer quantity;
    private java.math.BigDecimal sellingPrice;
    private String lastBatchCode;
    private LocalDateTime lastUpdatedAt;
}
