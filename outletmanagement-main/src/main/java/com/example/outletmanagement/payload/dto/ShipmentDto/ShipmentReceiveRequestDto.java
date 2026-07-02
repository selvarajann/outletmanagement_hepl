package com.example.outletmanagement.payload.dto.ShipmentDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentReceiveRequestDto {

    private String notes;

    private List<ShipmentReceiveItemDto> items; // Can be empty since it's full receive

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShipmentReceiveItemDto {
        private Long id;
        private Integer quantityReceived;
        @NotBlank(message = "imsBatchCode is required for receiving items")
        private String imsBatchCode;
    }
}
