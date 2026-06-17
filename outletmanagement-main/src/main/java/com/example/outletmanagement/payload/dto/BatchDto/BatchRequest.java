package com.example.outletmanagement.payload.dto.BatchDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.Valid;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchRequest {
    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    private List<BatchItemRequest> items;
}
