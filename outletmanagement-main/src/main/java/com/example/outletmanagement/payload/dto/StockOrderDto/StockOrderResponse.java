package com.example.outletmanagement.payload.dto.StockOrderDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockOrderResponse {

    private Long id;
    private String orderCode;
    private Long outletId;
    private String outletName;
    private String outletCode;
    private LocalDate requestedDate;
    private String status;
    /** IMS push status: PENDING / IMS_PUSHED / IMS_PUSH_FAILED */
    private String imsPushStatus;
    private String notes;
    private String createdBy;
    private BigDecimal totalAmount;
    private Integer itemCount;
    private List<StockOrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
