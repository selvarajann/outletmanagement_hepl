package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.SystemJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemJobRepository extends JpaRepository<SystemJob, Long> {
    Optional<SystemJob> findByTaskKey(String taskKey);
}
