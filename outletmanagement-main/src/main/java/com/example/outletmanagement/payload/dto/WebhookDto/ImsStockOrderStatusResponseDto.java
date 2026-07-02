package com.example.outletmanagement.payload.dto.WebhookDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImsStockOrderStatusResponseDto {
    private String orderCode;
    private String processingStatus;
    private String message;
}
