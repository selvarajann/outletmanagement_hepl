package com.example.outletmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.example.outletmanagement.model.entity.Location;
import com.example.outletmanagement.model.entity.Outlet;

public interface OutletRepository extends JpaRepository<Outlet, Long>,JpaSpecificationExecutor<Outlet> {

    boolean existsByOutletCode(String outletCode);

    boolean existsByOutletNameAndLocation(String outletName, Location location);
}