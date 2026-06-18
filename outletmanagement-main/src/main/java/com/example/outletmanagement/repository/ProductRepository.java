package com.example.outletmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.example.outletmanagement.model.entity.Products;
public interface ProductRepository extends JpaRepository<Products, Long>, JpaSpecificationExecutor<Products> {

    boolean existsByName(String name);
    boolean existsByProductCode(String productCode);
    List<Products> findByDivision_Id(Long divisionId);
    java.util.Optional<Products> findByProductCode(String productCode);
}