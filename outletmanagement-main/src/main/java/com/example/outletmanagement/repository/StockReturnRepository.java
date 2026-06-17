package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.StockReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StockReturnRepository extends JpaRepository<StockReturn, Long>, JpaSpecificationExecutor<StockReturn> {
    Optional<StockReturn> findByReturnCode(String returnCode);
    boolean existsByReturnCode(String returnCode);
}
