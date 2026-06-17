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
public class ImsDispatchWebhookRequestDto {

    @NotBlank(message = "IMS reference code is required for idempotency")
    private String imsReferenceCode;

    @NotBlank(message = "Order code is required")
    private String orderCode;

    private String notes;

    private LocalDate dispatchDate;

    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    private List<ImsDispatchItemDto> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImsDispatchItemDto {
        @NotBlank(message = "Product code is required")
        private String productCode;

        @NotNull(message = "Quantity dispatched is required")
        private Integer quantityDispatched;

        private LocalDate mfgDate;
        private LocalDate expiryDate;
    }
}
