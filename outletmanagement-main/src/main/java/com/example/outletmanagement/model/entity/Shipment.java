package com.example.outletmanagement.model.entity;

import com.example.outletmanagement.model.enums.ShipmentStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "shipments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String shipmentCode;

    @Column(nullable = false)
    private String imsReferenceCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private StockOrder order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outlet_id", nullable = false)
    private Outlet outlet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipmentStatus status;

    private LocalDate dispatchDate;
    
    private LocalDate receivedDate;

    // ─── IMS Receipt Sync Tracking ─────────────────────────────────────────────
    /** CONTRACT_PENDING: Status of outbound IMS receipt push. Values: PENDING / SUCCESS / FAILED / DEAD_LETTER */
    @Column(name = "ims_receipt_sync_status")
    private String imsReceiptSyncStatus = "PENDING";

    @Column(name = "ims_receipt_sync_at")
    private LocalDateTime imsReceiptSyncAt;

    /** CONTRACT_PENDING: Reference code returned by IMS to confirm receipt acknowledgement. */
    @Column(name = "ims_receipt_reference_code")
    private String imsReceiptReferenceCode;

    @Column(name = "ims_receipt_retry_count")
    private Integer imsReceiptRetryCount = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ShipmentItem> items;
}
