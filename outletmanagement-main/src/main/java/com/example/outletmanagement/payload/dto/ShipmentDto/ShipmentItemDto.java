package com.example.outletmanagement.payload.dto.ShipmentDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private String productCode;
    private Integer quantityDispatched;
    private Integer quantityReceived;
    private LocalDate mfgDate;
    private LocalDate expiryDate;
}
