package com.example.outletmanagement.payload.dto.ImsPortalDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImsPortalOrderItemDto {
    private Long id;
    private Long productId;
    private String productCode;
    private String productName;
    private Integer quantityRequested;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
}
