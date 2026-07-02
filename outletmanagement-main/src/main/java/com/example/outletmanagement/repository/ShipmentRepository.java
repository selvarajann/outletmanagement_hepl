package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.Shipment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long>, JpaSpecificationExecutor<Shipment> {
    Optional<Shipment> findByShipmentCode(String shipmentCode);
    Optional<Shipment> findByImsReferenceCode(String imsReferenceCode);

    // Phase 12: Retry scheduler query
    @Query("SELECT s FROM Shipment s WHERE s.imsReceiptSyncStatus = :status AND s.imsReceiptRetryCount < :maxRetries")
    List<Shipment> findByImsReceiptSyncStatusAndImsReceiptRetryCountLessThan(
            @Param("status") String status,
            @Param("maxRetries") int maxRetries,
            Pageable pageable);

    List<Shipment> findByImsReceiptSyncStatus(String status);
}
