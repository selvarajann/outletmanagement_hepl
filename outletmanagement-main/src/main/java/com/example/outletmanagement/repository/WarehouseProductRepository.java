package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.WarehouseProducts;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WarehouseProductRepository extends JpaRepository<WarehouseProducts, Long>, JpaSpecificationExecutor<WarehouseProducts> {
    boolean existsByProductCode(String productCode);
    Optional<WarehouseProducts> findByProductCode(String productCode);
}
