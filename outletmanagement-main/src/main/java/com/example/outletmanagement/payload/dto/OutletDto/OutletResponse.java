package com.example.outletmanagement.payload.dto.OutletDto;

import com.example.outletmanagement.payload.dto.DivisionDto.DivisionResponse;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class OutletResponse {

    private Long id;
    private String outletName;
    private String outletCode;
    private String locationName;
    // private List<DivisionResponse> divisionNames;
    // private List<ProductResponse> productNames;
    private List<DivisionResponse> divisions;
    private String outletType;
    private String ownerName;
    private String address;
}