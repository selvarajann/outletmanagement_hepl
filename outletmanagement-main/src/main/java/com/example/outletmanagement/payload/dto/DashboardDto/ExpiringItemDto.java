package com.example.outletmanagement.payload.dto.DashboardDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpiringItemDto {
    private Long batchItemId;
    private String productCode;
    private String productName;
    private LocalDate expiryDate;
    private int remainingQuantity;
    private long daysUntilExpiry;
}
