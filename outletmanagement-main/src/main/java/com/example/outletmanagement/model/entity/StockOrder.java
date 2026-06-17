package com.example.outletmanagement.model.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "stock_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String orderCode;

    @ManyToOne
    @JoinColumn(name = "outlet_id")
    private Outlet outlet;

    private LocalDate requestedDate;

    @Column(nullable = false)
    private String status; 

    private String notes;

    private String createdBy;

    /**
     * Tracks the async push status to the Inventory Management System.
     * Values: PENDING / IMS_PUSHED / IMS_PUSH_FAILED
     */
    private String imsPushStatus = "PENDING";

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<StockOrderItem> items;
}
