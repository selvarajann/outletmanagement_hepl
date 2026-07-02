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
           "  AND bi.isQuarantined = false " +
           "ORDER BY bi.expiryDate ASC NULLS LAST")
    List<BatchItem> findAvailableByOutletAndProductFEFO(
            @Param("outletId") Long outletId,
            @Param("productId") Long productId);

    @Query("SELECT bi FROM BatchItem bi WHERE bi.product.id = :productId AND bi.imsBatchCode = :batchCode AND bi.remainingQuantity > 0")
    List<BatchItem> findActiveItemsByProductAndBatchCode(
            @Param("productId") Long productId,
            @Param("batchCode") String batchCode);

    org.springframework.data.domain.Page<BatchItem> findByIsQuarantinedTrue(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT bi FROM BatchItem bi " +
           "JOIN FETCH bi.batch b " +
           "JOIN FETCH bi.product p " +
           "WHERE bi.expiryDate IS NOT NULL " +
           "  AND bi.expiryDate <= :threshold " +
           "  AND bi.remainingQuantity > 0 " +
           "  AND b.status = 'RECEIVED' " +
           "ORDER BY bi.expiryDate ASC")
    List<BatchItem> findExpiringBefore(@Param("threshold") java.time.LocalDate threshold);
}
