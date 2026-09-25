package com.example.outletmanagement.payload.dto.ImsPortalDto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImsPortalReturnResponseDto {
    private Long id;
    private String returnCode;
    private String outletName;
    private String batchCode;
    private String status;
    private String reason;
    private String notes;
    private String createdBy;
    private String imsAckCode;
    private String pickupReferenceCode;
    private String completionReferenceCode;
    private LocalDateTime createdAt;
    private List<ImsPortalReturnItemDto> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImsPortalReturnItemDto {
        private Long id;
        private String productCode;
        private String productName;
        private Integer quantity;
        private String notes;
    }
}
