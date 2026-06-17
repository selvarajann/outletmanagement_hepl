package com.example.outletmanagement.integration;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Payload DTO sent to the Inventory Management System when a stock order is approved.
 * Adjust field names/structure here to match the IMS team's API contract.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImsStockRequestDto {

    /** OMS-generated unique order code, usable as the IMS reference. */
    private String orderCode;

    /** Outlet's unique code — IMS uses this to identify the target outlet. */
    private String outletCode;

    /** Outlet display name for human-readable IMS records. */
    private String outletName;

    /** Date by which the outlet needs the stock. */
    private LocalDate requestedDate;

    /** Notes / special instructions from the outlet admin. */
    private String notes;

    private List<ImsItemDto> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImsItemDto {
        private String productCode;
        private String productName;
        private Integer quantityRequested;
    }
}
