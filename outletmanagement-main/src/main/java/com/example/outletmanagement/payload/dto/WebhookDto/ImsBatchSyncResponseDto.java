package com.example.outletmanagement.payload.dto.WebhookDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImsBatchSyncResponseDto {
    private String batchCode;
    private String processingStatus;
}
