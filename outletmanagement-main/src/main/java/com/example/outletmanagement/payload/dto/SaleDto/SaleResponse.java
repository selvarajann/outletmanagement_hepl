package com.example.outletmanagement.payload.dto.SaleDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for a processed POS sale, including FEFO deduction trail.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleResponse {

    private Long id;
    private String referenceNo;
    private Long outletId;
    private String outletName;
    private BigDecimal totalAmount;
    private LocalDateTime saleTime;
    private String soldBy;
    private List<SaleItemResponse> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaleItemResponse {
        private Long productId;
        private String productName;
        private String productCode;
        private String batchCode;
        private LocalDate expiryDate;
        private Integer quantityDeducted;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }
}
