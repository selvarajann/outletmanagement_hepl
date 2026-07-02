package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.ReconciliationReportItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReconciliationReportItemRepository extends JpaRepository<ReconciliationReportItem, Long> {
    List<ReconciliationReportItem> findByReport_Id(Long reportId);
    List<ReconciliationReportItem> findByReport_IdAndMismatchTypeNot(Long reportId, String mismatchType);
}
