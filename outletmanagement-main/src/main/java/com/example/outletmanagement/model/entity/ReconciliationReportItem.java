package com.example.outletmanagement.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reconciliation_report_items",
        indexes = {
                @Index(name = "idx_recon_report_id", columnList = "report_id"),
                @Index(name = "idx_recon_product_code", columnList = "product_code")
        })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReconciliationReportItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private ReconciliationReport report;

    @Column(name = "outlet_id")
    private Long outletId;

    @Column(name = "product_code", nullable = false)
    private String productCode;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "oms_quantity", nullable = false)
    private int omsQuantity = 0;

    /**
     * CONTRACT_PENDING: Populated from IMS snapshot when available.
     * Default 0 when IMS is unreachable.
     */
    @Column(name = "ims_quantity", nullable = false)
    private int imsQuantity = 0;

    /** omsQuantity - imsQuantity. Negative = IMS has more than OMS. */
    @Column(nullable = false)
    private int difference = 0;

    /** OMS_SURPLUS / IMS_SURPLUS / MATCH / OMS_ONLY (IMS not available) */
    @Column(name = "mismatch_type", nullable = false)
    private String mismatchType = "OMS_ONLY";
}
