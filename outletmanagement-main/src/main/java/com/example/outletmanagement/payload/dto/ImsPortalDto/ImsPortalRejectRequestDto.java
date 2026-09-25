package com.example.outletmanagement.payload.dto.ImsPortalDto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ImsPortalRejectRequestDto {
    @NotBlank(message = "Rejection reason is required")
    private String reason;
}
