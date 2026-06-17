package com.example.outletmanagement.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "batch_items",
       uniqueConstraints = @UniqueConstraint(columnNames = {"batch_id", "product_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "batch_id")
    private Batch batch;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Products product;

    private Integer quantity;

    /** Starts equal to quantity; decremented by sales via FEFO deduction. */
    @Column(nullable = false)
    private Integer remainingQuantity;

    /** Manufacturing date — stored per-batch for traceability. */
    private LocalDate mfgDate;

    /** Expiry date — used as the FEFO sort key for stock deduction. */
    private LocalDate expiryDate;

    private BigDecimal sellingPrice;
    private BigDecimal purchasePrice;
    private BigDecimal mrp;
    private BigDecimal uimPrice;

    @jakarta.persistence.Version
    private Long version;
}
