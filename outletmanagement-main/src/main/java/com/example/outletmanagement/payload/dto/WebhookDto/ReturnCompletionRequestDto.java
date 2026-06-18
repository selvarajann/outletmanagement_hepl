package com.example.outletmanagement.payload.dto.WebhookDto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReturnCompletionRequestDto {
    @NotBlank(message = "returnCode is required")
    private String returnCode;
    
    @NotBlank(message = "completionReferenceCode is required")
    private String completionReferenceCode;
    
    private String completionDate;
    
    private String notes;
}
