package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.StockReturn;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockReturnRepository extends JpaRepository<StockReturn, Long>, JpaSpecificationExecutor<StockReturn> {
    Optional<StockReturn> findByReturnCode(String returnCode);
    boolean existsByReturnCode(String returnCode);

    @Query("SELECT r FROM StockReturn r WHERE r.imsPushStatus = :status AND r.imsPushRetryCount < :maxRetries")
    List<StockReturn> findByImsPushStatusAndImsPushRetryCountLessThan(
            @Param("status") String status,
            @Param("maxRetries") int maxRetries,
            Pageable pageable);

    List<StockReturn> findByImsPushStatus(String status);
}
