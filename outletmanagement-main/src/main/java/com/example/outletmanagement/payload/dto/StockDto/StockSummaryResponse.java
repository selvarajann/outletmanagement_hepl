package com.example.outletmanagement.payload.dto.StockDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockSummaryResponse {
    private Long outletId;
    private String outletName;
    private Long totalProductsInStock;
    private Long outOfStockItems;
    private BigDecimal totalStockValue;
}
