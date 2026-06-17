package com.example.outletmanagement.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "stock_return_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockReturnItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "return_id", nullable = false)
    private StockReturn stockReturn;

    @ManyToOne
    @JoinColumn(name = "batch_item_id", nullable = false)
    private BatchItem batchItem;

    @Column(nullable = false)
    private Integer quantityReturned;

    @Column(columnDefinition = "TEXT")
    private String defectDescription;
}
