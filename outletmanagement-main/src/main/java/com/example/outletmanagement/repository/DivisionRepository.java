package com.example.outletmanagement.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.example.outletmanagement.model.entity.Division;

public interface DivisionRepository extends JpaRepository<Division, Long>, JpaSpecificationExecutor<Division> {

    boolean existsByNameIgnoreCase(String name);

    Optional<Division> findByNameIgnoreCase(String name);
}