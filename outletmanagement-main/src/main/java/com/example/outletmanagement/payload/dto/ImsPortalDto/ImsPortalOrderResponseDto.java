package com.example.outletmanagement.payload.dto.ImsPortalDto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ImsPortalOrderResponseDto {
    private Long id;
    private String orderCode;
    private Long outletId;
    private String outletName;
    private String outletCode;
    private LocalDate requestedDate;
    private String status;
    private String imsPushStatus;
    private String notes;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ImsPortalOrderItemDto> items;
    private BigDecimal totalAmount;
    private Integer itemCount;
    private String paymentMethod;
    private String paymentStatus;
}
