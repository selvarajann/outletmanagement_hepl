package com.example.outletmanagement.payload.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchQuarantineResponseDto {
    private Long id;
    private String batchCode;
    private String productCode;
    private String productName;
    private Integer quantity;
    private String quarantineReason;
    private String outletName;
    private LocalDate receivedDate;
    private Boolean isQuarantined;
}
