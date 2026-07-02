package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.DashboardDto.DashboardSummaryDto;
import com.example.outletmanagement.payload.dto.DashboardDto.LowStockItemDto;
import com.example.outletmanagement.payload.dto.DashboardDto.ExpiringItemDto;

import java.util.List;

public interface DashboardService {
    DashboardSummaryDto getSummary();
    List<LowStockItemDto> getLowStockItems();
    List<ExpiringItemDto> getExpiringItems(int daysAhead);
}
