package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.BatchItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BatchItemRepository extends JpaRepository<BatchItem, Long> {
    Optional<BatchItem> findByBatch_IdAndProduct_Id(Long batchId, Long productId);

    /**
     * FEFO query: loads all BatchItems for a product at an outlet where stock remains,
     * ordered by expiryDate ASC so the earliest-expiry batch is deducted first.
     * Joins Batch to filter only RECEIVED batches and to access outlet info.
     */
    @Query("SELECT bi FROM BatchItem bi " +
           "JOIN FETCH bi.batch b " +
           "JOIN FETCH bi.product p " +
           "WHERE b.outlet.id = :outletId " +
           "  AND p.id = :productId " +
           "  AND b.status = 'RECEIVED' " +
           "  AND bi.remainingQuantity > 0 " +
           "ORDER BY bi.expiryDate ASC NULLS LAST")
    List<BatchItem> findAvailableByOutletAndProductFEFO(
            @Param("outletId") Long outletId,
            @Param("productId") Long productId);
}
