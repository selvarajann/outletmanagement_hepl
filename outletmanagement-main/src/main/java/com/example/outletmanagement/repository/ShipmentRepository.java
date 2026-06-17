package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long>, JpaSpecificationExecutor<Shipment> {
    Optional<Shipment> findByShipmentCode(String shipmentCode);
    Optional<Shipment> findByImsReferenceCode(String imsReferenceCode);
}
