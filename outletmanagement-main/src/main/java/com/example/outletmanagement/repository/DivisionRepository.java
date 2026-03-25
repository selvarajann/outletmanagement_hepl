package com.example.outletmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.outletmanagement.model.entity.Division;

public interface DivisionRepository extends JpaRepository<Division, Long> {

    boolean existsByName(String name);
}
