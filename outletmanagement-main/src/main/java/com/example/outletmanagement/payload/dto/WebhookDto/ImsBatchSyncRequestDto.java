package com.example.outletmanagement.payload.dto.WebhookDto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImsBatchSyncRequestDto {
    @NotBlank(message = "batchCode is required")
    private String batchCode;

    @NotBlank(message = "productCode is required")
    private String productCode;

    @NotNull(message = "mfgDate is required")
    private LocalDate mfgDate;

    @NotNull(message = "expiryDate is required")
    private LocalDate expiryDate;
    
    private String notes;
}
