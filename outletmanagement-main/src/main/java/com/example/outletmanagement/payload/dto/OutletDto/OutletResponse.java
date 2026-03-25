package com.example.outletmanagement.payload.dto.OutletDto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OutletResponse {

    private Long id;
    private String outletName;
    private String outletCode;
    private String location;
    private List<String> divisions;
    private String outletType;
}
