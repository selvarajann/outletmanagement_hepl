package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.StockOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface StockOrderRepository extends JpaRepository<StockOrder, Long>, JpaSpecificationExecutor<StockOrder> {
    boolean existsByOrderCode(String orderCode);
    Optional<StockOrder> findByOrderCode(String orderCode);
    boolean existsByOutlet_Id(Long outletId);

    // Fetch outlet and items+product in one query — eliminates N+1 in mapToResponse
    @Query("SELECT DISTINCT o FROM StockOrder o JOIN FETCH o.outlet JOIN FETCH o.items i JOIN FETCH i.product WHERE o.id = :id")
    Optional<StockOrder> findByIdWithDetails(@Param("id") Long id);

    // Batch-fetch items+product for a set of order IDs — used after page query
    @Query("SELECT DISTINCT o FROM StockOrder o JOIN FETCH o.outlet JOIN FETCH o.items i JOIN FETCH i.product WHERE o.id IN :ids")
    List<StockOrder> findByIdsWithDetails(@Param("ids") Set<Long> ids);

    // Check existence for multiple outlet IDs in one query
    @Query("SELECT DISTINCT o.outlet.id FROM StockOrder o WHERE o.outlet.id IN :outletIds")
    List<Long> findOutletIdsWithOrders(@Param("outletIds") List<Long> outletIds);
}
