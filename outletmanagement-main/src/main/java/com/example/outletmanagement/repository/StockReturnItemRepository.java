package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.StockReturnItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockReturnItemRepository extends JpaRepository<StockReturnItem, Long> {
    List<StockReturnItem> findByStockReturnId(Long stockReturnId);
}
