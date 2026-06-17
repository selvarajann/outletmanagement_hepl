package com.example.outletmanagement.payload.dto.ShipmentDto;

import com.example.outletmanagement.model.enums.ShipmentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentReceiveResponseDto {

    private Long id;
    private String shipmentCode;
    private String imsReferenceCode;
    private Long orderId;
    private String orderCode;
    private Long outletId;
    private String outletName;
    private ShipmentStatus status;
    private LocalDate dispatchDate;
    private LocalDate receivedDate;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ShipmentReceiveItemResponseDto> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShipmentReceiveItemResponseDto {
        private Long id;
        private Long productId;
        private String productName;
        private String productCode;
        private Integer quantityDispatched;
        private Integer quantityReceived;
        private LocalDate mfgDate;
        private LocalDate expiryDate;
    }
}
