package com.example.outletmanagement.payload.dto.StockOrderDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockOrderItemResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String productCode;
    private Integer quantityRequested;
    private BigDecimal unitPriceAtOrder;
    private BigDecimal lineTotal;
}
