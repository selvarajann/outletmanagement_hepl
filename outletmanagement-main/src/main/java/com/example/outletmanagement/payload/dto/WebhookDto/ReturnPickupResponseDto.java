package com.example.outletmanagement.payload.dto.WebhookDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReturnPickupResponseDto {
    private String returnCode;
    private String pickupReferenceCode;
    private String processingStatus; // SUCCESS, IGNORED, FAILED
}
