package com.example.outletmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.outletmanagement.model.entity.Location;

public interface LocationRepository extends JpaRepository<Location, Long> {

    boolean existsByName(String name);
}