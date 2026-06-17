package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.SaleTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface SaleTransactionRepository extends JpaRepository<SaleTransaction, Long> {

    boolean existsByReferenceNo(String referenceNo);

    @Query("SELECT s FROM SaleTransaction s " +
           "JOIN FETCH s.outlet o " +
           "WHERE (:outletId IS NULL OR o.id = :outletId) " +
           "  AND (:from IS NULL OR s.saleTime >= :from) " +
           "  AND (:to IS NULL OR s.saleTime <= :to)")
    Page<SaleTransaction> findWithFilters(
            @Param("outletId") Long outletId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    @Query("SELECT s FROM SaleTransaction s " +
           "JOIN FETCH s.outlet " +
           "JOIN FETCH s.items si " +
           "JOIN FETCH si.product " +
           "JOIN FETCH si.batchItem bi " +
           "JOIN FETCH bi.batch " +
           "WHERE s.id = :id")
    java.util.Optional<SaleTransaction> findByIdWithDetails(@Param("id") Long id);
}
