package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long>, JpaSpecificationExecutor<Stock> {
    Optional<Stock> findByOutlet_IdAndProduct_Id(Long outletId, Long productId);

    // Fetch outlet, product, and product's division in one query — eliminates N+1 in mapToResponse
    @Query("SELECT s FROM Stock s JOIN FETCH s.outlet JOIN FETCH s.product p LEFT JOIN FETCH p.division WHERE s.outlet.id = :outletId")
    List<Stock> findByOutletIdWithDetails(@Param("outletId") Long outletId);

    // For getStockSummary — fetch all with relations in one query
    @Query("SELECT s FROM Stock s JOIN FETCH s.outlet JOIN FETCH s.product p LEFT JOIN FETCH p.division")
    List<Stock> findAllWithDetails();
}
