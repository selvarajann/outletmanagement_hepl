package com.example.outletmanagement.payload.dto.OutletDto;

import java.util.List;

import com.example.outletmanagement.payload.dto.OutletDivisionProductDto.OutletDivisionProductRequest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OutletRequest {

    @NotBlank(message = "Outlet name is required")
    @Size(min = 2, max = 150, message = "Outlet name must be between 2 and 150 characters")
    private String outletName;

    @NotBlank(message = "Address is required")
    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;

    @NotNull(message = "Location ID is required")
    private Long locationId;

    @NotBlank(message = "Outlet type is required")
    private String outletType;

    @NotBlank(message = "Owner name is required")
    @Size(min = 2, max = 100, message = "Owner name must be between 2 and 100 characters")
    private String ownerName;

    @NotEmpty(message = "At least one division-product mapping is required")
    @Valid
    private List<OutletDivisionProductRequest> mappings;
}
