package com.example.outletmanagement.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.example.outletmanagement.model.entity.Location;

public interface LocationRepository extends JpaRepository<Location, Long>, JpaSpecificationExecutor<Location> {

    boolean existsByName(String name);

    boolean existsByNameIgnoreCase(String name);

    Optional<Location> findByNameIgnoreCase(String name);
}