package com.example.outletmanagement.payload.dto.WebhookDto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WebhookRequestDto {

    @NotBlank(message = "Webhook ID is required for idempotency")
    private String webhookId;

    @NotBlank(message = "Order code is required")
    private String orderCode;

    @NotBlank(message = "IMS reference code is required")
    private String imsReferenceCode;

    @NotBlank(message = "Status is required")
    private String status;

    private LocalDate dispatchDate;
    
    private String notes;

    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    private List<WebhookItemDto> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WebhookItemDto {
        @NotBlank(message = "Product code is required")
        private String productCode;

        @NotNull(message = "Quantity dispatched is required")
        private Integer quantityDispatched;

        private LocalDate mfgDate;
        private LocalDate expiryDate;
    }
}
