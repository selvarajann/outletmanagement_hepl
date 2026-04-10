package com.example.outletmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.outletmanagement.model.entity.OutletDivisionProduct;

public interface OutletDivisionProductRepository extends JpaRepository<OutletDivisionProduct, Long> {
// @Query("SELECT m FROM OutletDivisionProduct m " +
//        "JOIN FETCH m.division " +
//        "JOIN FETCH m.product " +
//        "WHERE m.outlet.id = :outletId")
List<OutletDivisionProduct> findByOutlet_Id(Long outletId);

    void deleteByOutlet_Id(Long outletId);

    boolean existsByDivision_Id(Long divisionId);

    boolean existsByProduct_Id(Long productId);
}