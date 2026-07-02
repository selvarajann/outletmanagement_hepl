package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.SystemReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemReportRepository extends JpaRepository<SystemReport, Long> {
    Page<SystemReport> findAllByOrderByGeneratedAtDesc(Pageable pageable);
}
