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
 * Request body for POST /api/batches — manually creating a batch record
 * when goods arrive from the Inventory Management System.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchCreateRequest {

    @NotNull(message = "Order ID is required")
    private Long orderId;

    private String notes;

    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    private List<BatchCreateItemDetail> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchCreateItemDetail {
        @NotNull(message = "Product ID is required")
        private Long productId;

        @NotNull(message = "Quantity is required")
        private Integer quantity;

        private LocalDate mfgDate;
        private LocalDate expiryDate;
    }
}
