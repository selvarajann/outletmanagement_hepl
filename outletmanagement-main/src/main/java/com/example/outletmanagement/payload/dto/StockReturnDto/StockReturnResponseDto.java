package com.example.outletmanagement.payload.dto.StockReturnDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.example.outletmanagement.model.enums.StockReturnStatus;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockReturnResponseDto {
    private Long id;
    private String returnCode;
    private Long batchId;
    private String batchCode;
    private Long outletId;
    private String outletName;
    private String reason;
    private StockReturnStatus status;
    private String imsAckCode;
    private String pickupReferenceCode;
    private String completionReferenceCode;
    private String imsPushStatus;
    private String notes;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<StockReturnItemResponseDto> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockReturnItemResponseDto {
        private Long id;
        private Long batchItemId;
        private Long productId;
        private String productName;
        private String productCode;
        private Integer quantityReturned;
        private String defectDescription;
    }
}
