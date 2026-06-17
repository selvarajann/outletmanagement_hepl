package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.SaleTransactionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaleTransactionItemRepository extends JpaRepository<SaleTransactionItem, Long> {
    List<SaleTransactionItem> findByTransaction_Id(Long transactionId);
}
