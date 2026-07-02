package com.example.outletmanagement.payload.dto.DashboardDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LowStockItemDto {
    private String productCode;
    private String productName;
    private String outletName;
    private long currentQuantity;
    private int threshold;
}
