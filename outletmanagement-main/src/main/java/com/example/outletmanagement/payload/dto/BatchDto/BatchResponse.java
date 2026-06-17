package com.example.outletmanagement.payload.dto.BatchDto;

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
public class BatchResponse {

    private Long id;
    private String batchCode;
    private Long orderId;
    private String orderCode;
    private Long outletId;
    private String outletName;
    private LocalDate receivedDate;
    private String status;
    private String receivedBy;
    private String notes;
    private BigDecimal totalValue;
    private Integer itemCount;
    private List<BatchItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
