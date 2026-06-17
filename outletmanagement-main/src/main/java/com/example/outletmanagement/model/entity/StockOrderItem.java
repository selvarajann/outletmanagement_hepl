package com.example.outletmanagement.model.entity;

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

@Entity
@Table(name = "stock_order_items",
       uniqueConstraints = @UniqueConstraint(columnNames = {"order_id", "product_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private StockOrder order;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Products product;

    private Integer quantityRequested;

    private BigDecimal unitPriceAtOrder;
}
