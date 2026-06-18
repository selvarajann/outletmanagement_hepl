package com.example.outletmanagement.payload.dto.WebhookDto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReturnAckRequestDto {
    @NotBlank(message = "returnCode is required")
    private String returnCode;
    
    @NotBlank(message = "imsAckCode is required")
    private String imsAckCode;
    
    @NotBlank(message = "status is required")
    private String status; // ACKNOWLEDGED, FAILED
    
    private String notes;
}
