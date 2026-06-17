package com.example.outletmanagement.payload.dto.StockOrderDto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockOrderStatusRequest {
    @NotBlank(message = "Status cannot be blank")
    private String status;
}
