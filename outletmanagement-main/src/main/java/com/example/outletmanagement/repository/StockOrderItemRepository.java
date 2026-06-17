package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.StockOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockOrderItemRepository extends JpaRepository<StockOrderItem, Long> {
    void deleteByOrder_Id(Long orderId);
    List<StockOrderItem> findByOrder_Id(Long orderId);
}
