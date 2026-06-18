package com.example.outletmanagement.payload.dto.WebhookDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImsProductSyncResponseDto {
    private String productCode;
    private String processingStatus; // CREATED, UPDATED, IGNORED
}
