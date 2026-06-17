package com.example.outletmanagement.repository;

import java.util.List;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.outletmanagement.model.entity.OutletDivisionProduct;

public interface OutletDivisionProductRepository extends JpaRepository<OutletDivisionProduct, Long> {

    // Fetch division and product in one query — eliminates N+1 in mapToResponse
    @Query("SELECT m FROM OutletDivisionProduct m JOIN FETCH m.division JOIN FETCH m.product p LEFT JOIN FETCH p.division WHERE m.outlet.id = :outletId")
    List<OutletDivisionProduct> findByOutletIdWithDetails(@Param("outletId") Long outletId);

    // Fetch for multiple outlets at once — eliminates N+1 on page queries
    @Query("SELECT m FROM OutletDivisionProduct m JOIN FETCH m.division JOIN FETCH m.product p LEFT JOIN FETCH p.division WHERE m.outlet.id IN :outletIds")
    List<OutletDivisionProduct> findByOutletIdsWithDetails(@Param("outletIds") Set<Long> outletIds);

    List<OutletDivisionProduct> findByOutlet_Id(Long outletId);

    void deleteByOutlet_Id(Long outletId);

    void deleteByDivision_Id(Long divisionId);

    void deleteByProduct_Id(Long productId);

    boolean existsByDivision_Id(Long divisionId);

    boolean existsByProduct_Id(Long productId);
}
