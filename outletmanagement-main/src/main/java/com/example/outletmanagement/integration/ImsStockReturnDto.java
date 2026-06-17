package com.example.outletmanagement.integration;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImsStockReturnDto {
    private String returnCode;
    private String batchCode;
    private String reason;
    private List<ImsReturnItemDto> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImsReturnItemDto {
        private String productCode;
        private Integer quantityReturned;
        private String defectDescription;
    }
}
