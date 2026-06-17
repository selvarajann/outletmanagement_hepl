package com.example.outletmanagement.payload.dto.StockOrderDto;

import jakarta.validation.Valid;
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
public class StockOrderRequest {

    @NotNull(message = "Outlet ID is required")
    private Long outletId;

    @NotNull(message = "Requested Date is required")
    private LocalDate requestedDate;

    private String notes;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<StockOrderItemRequest> items;
}
