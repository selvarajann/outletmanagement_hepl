package com.example.outletmanagement.payload.dto.StockReturnDto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockReturnRequestDto {
    @NotNull(message = "Batch ID is required")
    private Long batchId;

    @NotBlank(message = "Reason is required")
    private String reason;

    private String notes;

    @NotEmpty(message = "Return items cannot be empty")
    @Valid
    private List<StockReturnItemRequestDto> items;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockReturnItemRequestDto {
        @NotNull(message = "Batch item ID is required")
        private Long batchItemId;
        
        @NotNull(message = "Quantity returned is required")
        private Integer quantityReturned;
        
        private String defectDescription;
    }
}
