package com.example.outletmanagement.payload.dto.WebhookDto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImsStockOrderStatusRequestDto {
    @NotBlank(message = "Order code is required")
    private String orderCode;

    @NotBlank(message = "Status is required")
    private String status;

    private String remarks;
}
