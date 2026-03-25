package com.example.outletmanagement.payload.dto.OutletDto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OutletRequest {

    
    @NotBlank
    private String outletName;

    private String address;

    @NotNull
    private Long locationId;  

    @NotNull
    private List<Long> divisionIds;   

    private String outletType;
    private String ownerName;
}