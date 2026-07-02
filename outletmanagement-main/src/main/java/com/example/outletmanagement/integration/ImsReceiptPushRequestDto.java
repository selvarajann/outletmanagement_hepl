package com.example.outletmanagement.integration;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

/**
 * CONTRACT_PENDING: Payload sent to IMS when an outlet receives a shipment.
 * Field names and structure must be verified against the IMS API contract before production.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImsReceiptPushRequestDto {
    private String shipmentCode;
    private String outletCode;
    private String outletName;
    private LocalDate receivedDate;
    private String notes;
    private List<ImsReceiptItemDto> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImsReceiptItemDto {
        private String productCode;
        /** CONTRACT_PENDING: IMS batch code from ims_master_batch. */
        private String imsBatchCode;
        private Integer quantityReceived;
        private LocalDate mfgDate;
        private LocalDate expiryDate;
    }
}
