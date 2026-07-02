package com.example.outletmanagement.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "reconciliation_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReconciliationReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_code", unique = true, nullable = false)
    private String reportCode;

    /** 'SCHEDULER' for automated runs, or username for manual triggers. */
    @Column(name = "triggered_by", nullable = false)
    private String triggeredBy;

    /** RUNNING / COMPLETED / FAILED / IMS_FETCH_FAILED */
    @Column(nullable = false)
    private String status = "RUNNING";

    @Column(name = "total_products_checked")
    private int totalProductsChecked = 0;

    @Column(name = "total_mismatches")
    private int totalMismatches = 0;

    /**
     * CONTRACT_PENDING: Timestamp from IMS inventory snapshot response.
     * Null when IMS is unavailable.
     */
    @Column(name = "ims_snapshot_timestamp")
    private LocalDateTime imsSnapshotTimestamp;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
