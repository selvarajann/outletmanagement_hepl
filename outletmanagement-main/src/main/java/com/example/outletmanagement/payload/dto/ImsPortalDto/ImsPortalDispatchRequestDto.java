package com.example.outletmanagement.payload.dto.ImsPortalDto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class ImsPortalDispatchRequestDto {
    @NotBlank(message = "Carrier is required")
    private String carrier;

    @NotBlank(message = "Tracking number is required")
    private String trackingNumber;

    private List<ImsDispatchItemOverride> itemOverrides;

    @Data
    public static class ImsDispatchItemOverride {
        private String productCode;
        private LocalDate mfgDate;
        private LocalDate expiryDate;
        private BigDecimal unitPrice;
    }
}
