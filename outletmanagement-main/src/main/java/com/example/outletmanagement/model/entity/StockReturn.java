package com.example.outletmanagement.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.example.outletmanagement.model.enums.StockReturnStatus;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "stock_returns")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockReturn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String returnCode;

    @ManyToOne
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    @ManyToOne
    @JoinColumn(name = "outlet_id", nullable = false)
    private Outlet outlet;

    @Column(nullable = false)
    private String reason; // DEFECTIVE, EXPIRED, WRONG_ITEM, OTHER

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StockReturnStatus status; // PENDING, SUBMITTED, APPROVED, REJECTED, ACKNOWLEDGED, COMPLETED, FAILED

    private String imsAckCode;

    @Column(name = "ims_push_status")
    private String imsPushStatus; // PENDING, SUCCESS, FAILED

    @Column(columnDefinition = "TEXT")
    private String notes;

    private String createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "stockReturn", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<StockReturnItem> items;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
