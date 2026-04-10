package com.example.outletmanagement.payload.dto.OutletDivisionProductDto;
import lombok.Data;

@Data
public class OutletDivisionProductResponse {
    private Long id;
    private String outletName;
    private String divisionName;
    private String productName;
}
