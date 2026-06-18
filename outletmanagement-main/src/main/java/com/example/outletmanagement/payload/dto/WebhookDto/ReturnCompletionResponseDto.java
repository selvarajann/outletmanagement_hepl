package com.example.outletmanagement.payload.dto.WebhookDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReturnCompletionResponseDto {
    private String returnCode;
    private String completionReferenceCode;
    private String processingStatus; // SUCCESS, IGNORED, FAILED
}
