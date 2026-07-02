package com.example.outletmanagement.service;

import com.example.outletmanagement.model.entity.SystemReport;
import com.example.outletmanagement.repository.SystemReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SystemReportService {

    private final SystemReportRepository repository;

    public SystemReport saveReport(String reportType, String fileName, String fileUrl) {
        SystemReport report = new SystemReport(null, reportType, fileName, fileUrl, LocalDateTime.now());
        return repository.save(report);
    }

    public Page<SystemReport> getReports(Pageable pageable) {
        return repository.findAllByOrderByGeneratedAtDesc(pageable);
    }
}
