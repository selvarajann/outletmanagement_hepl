package com.example.outletmanagement.payload.dto.StockOrderDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseProductsResponse {
    private boolean imsAvailable;
    private List<ImsWarehouseProductDto> products;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImsWarehouseProductDto {
        private Long id; // Local OMS product ID
        private String productCode;
        private String name;
        private BigDecimal sellingPrice;
        private int availableQuantity;
    }
}
