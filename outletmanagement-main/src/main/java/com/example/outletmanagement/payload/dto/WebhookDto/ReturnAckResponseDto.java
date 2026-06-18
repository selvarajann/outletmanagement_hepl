package com.example.outletmanagement.payload.dto.WebhookDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReturnAckResponseDto {
    private String returnCode;
    private String imsAckCode;
    private String returnStatus;
    private String processingStatus; // SUCCESS, IGNORED, FAILED
}
