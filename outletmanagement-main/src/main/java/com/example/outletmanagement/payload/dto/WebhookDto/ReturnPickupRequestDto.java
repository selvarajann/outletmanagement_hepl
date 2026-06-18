package com.example.outletmanagement.payload.dto.WebhookDto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReturnPickupRequestDto {
    @NotBlank(message = "returnCode is required")
    private String returnCode;
    
    @NotBlank(message = "pickupReferenceCode is required")
    private String pickupReferenceCode;
    
    private String pickupDate;
    
    private String notes;
}
