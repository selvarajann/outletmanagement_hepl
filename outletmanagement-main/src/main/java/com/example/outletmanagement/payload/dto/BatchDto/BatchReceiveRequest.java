package com.example.outletmanagement.payload.dto.BatchDto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

/**
 * Request body for PATCH /api/batches/{id}/receive.
 * The outlet admin provides mfg/expiry dates for each product received.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchReceiveRequest {

    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    private List<BatchItemReceiveDetail> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchItemReceiveDetail {
        @NotNull(message = "Product ID is required")
        private Long productId;

        /** Manufacturing date — may be null if not applicable. */
        private LocalDate mfgDate;

        /** Expiry date — used as FEFO sort key. May be null for non-perishable items. */
        private LocalDate expiryDate;
    }
}
