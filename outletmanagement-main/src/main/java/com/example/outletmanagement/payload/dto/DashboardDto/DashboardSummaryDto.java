package com.example.outletmanagement.payload.dto.DashboardDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDto {
    private long totalActiveStock;
    private long lowStockAlerts;
    private long expiringWithin30Days;
    private long quarantinedBatchItems;
    private long pendingShipments;
    private long pendingReturns;
    private long pendingStockOrders;
    private long syncFailures;
    private long deadLetterCount;
    private String lastReconciliationStatus;
    private String lastReconciliationCode;
}
