package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.ImsMasterBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ImsMasterBatchRepository extends JpaRepository<ImsMasterBatch, Long> {
    Optional<ImsMasterBatch> findByBatchCodeAndProduct_Id(String batchCode, Long productId);
}
