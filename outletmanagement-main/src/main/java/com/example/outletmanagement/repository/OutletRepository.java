package com.example.outletmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.outletmanagement.model.entity.Location;
import com.example.outletmanagement.model.entity.Outlet;

import java.util.List;
import java.util.Optional;

public interface OutletRepository extends JpaRepository<Outlet, Long>, JpaSpecificationExecutor<Outlet> {

    boolean existsByOutletCode(String outletCode);

    boolean existsByOutletNameAndLocation(String outletName, Location location);

    List<Outlet> findByLocation_Id(Long locationId);

    // Fetch outlet with location in one query — eliminates lazy-load of location in mapToResponse
    @Query("SELECT o FROM Outlet o JOIN FETCH o.location WHERE o.id = :id")
    Optional<Outlet> findByIdWithLocation(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Outlet o SET o.location = null WHERE o.location.id = :locationId")
    void unlinkLocation(Long locationId);
}