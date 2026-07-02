package com.example.outletmanagement.service;

import com.example.outletmanagement.model.entity.ReconciliationReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReconciliationService {
    ReconciliationReport triggerReconciliation(String triggeredBy);
    Page<ReconciliationReport> getReports(Pageable pageable);
    ReconciliationReport getReport(Long id);
}
