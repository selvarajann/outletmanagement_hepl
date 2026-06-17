package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.StockReturnDto.StockReturnRequestDto;
import com.example.outletmanagement.payload.dto.StockReturnDto.StockReturnResponseDto;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;

public interface StockReturnService {
    
    Page<StockReturnResponseDto> getStockReturns(String keyword, Long outletId, String status, LocalDateTime fromDate, LocalDateTime toDate, int page, int size, String sortBy, String direction);

    StockReturnResponseDto getStockReturnDetails(Long returnId);

    StockReturnResponseDto createReturn(StockReturnRequestDto request, String createdBy);

    StockReturnResponseDto approveReturn(Long returnId);

    StockReturnResponseDto rejectReturn(Long returnId, String reason);

    StockReturnResponseDto completeReturn(Long returnId, String imsAckCode);

    StockReturnResponseDto retryImsPush(Long returnId, String requestedBy);
}
