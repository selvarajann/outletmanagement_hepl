package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long>, JpaSpecificationExecutor<Batch> {
    boolean existsByBatchCode(String batchCode);
    Optional<Batch> findByBatchCode(String batchCode);
}
