package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.payload.dto.DashboardDto.DashboardSummaryDto;
import com.example.outletmanagement.payload.dto.DashboardDto.ExpiringItemDto;
import com.example.outletmanagement.payload.dto.DashboardDto.LowStockItemDto;
import com.example.outletmanagement.repository.ReconciliationReportRepository;
import com.example.outletmanagement.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardServiceImpl implements DashboardService {

    private final JdbcTemplate jdbcTemplate;
    private final ReconciliationReportRepository reconciliationReportRepository;

    @Value("${app.stock.low-threshold:10}")
    private int lowStockThreshold;

    @Value("${app.stock.expiry-warning-days:30}")
    private int expiryWarningDays;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary() {
        // Total active, non-quarantined stock
        Long totalStock = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(remaining_quantity), 0) FROM batch_items WHERE is_quarantined = false AND remaining_quantity > 0",
                Long.class);

        // Low stock alerts per outlet/product
        Long lowStock = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM stock WHERE quantity < ? AND quantity >= 0",
                Long.class, lowStockThreshold);

        // Expiring within warning window
        Long expiringSoon = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM batch_items WHERE expiry_date <= ? AND expiry_date >= CURDATE() AND is_quarantined = false AND remaining_quantity > 0",
                Long.class, LocalDate.now().plusDays(expiryWarningDays));

        // Quarantined batch items
        Long quarantined = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM batch_items WHERE is_quarantined = true AND remaining_quantity > 0",
                Long.class);

        // Pending shipments
        Long pendingShipments = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM shipments WHERE status = 'IN_TRANSIT'",
                Long.class);

        // Pending returns
        Long pendingReturns = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM stock_returns WHERE status IN ('PENDING', 'SUBMITTED')",
                Long.class);

        // Pending stock orders
        Long pendingOrders = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM stock_orders WHERE status = 'PENDING'",
                Long.class);

        // IMS sync failures (FAILED or DEAD_LETTER across all entity types)
        Long syncFailed = jdbcTemplate.queryForObject(
                "SELECT (SELECT COUNT(*) FROM stock_orders WHERE ims_push_status IN ('IMS_PUSH_FAILED','DEAD_LETTER')) + " +
                "(SELECT COUNT(*) FROM stock_returns WHERE ims_push_status IN ('IMS_PUSH_FAILED','DEAD_LETTER')) + " +
                "(SELECT COUNT(*) FROM shipments WHERE ims_receipt_sync_status IN ('FAILED','DEAD_LETTER'))",
                Long.class);

        // Dead-letter count
        Long deadLetters = jdbcTemplate.queryForObject(
                "SELECT (SELECT COUNT(*) FROM stock_orders WHERE ims_push_status = 'DEAD_LETTER') + " +
                "(SELECT COUNT(*) FROM stock_returns WHERE ims_push_status = 'DEAD_LETTER') + " +
                "(SELECT COUNT(*) FROM shipments WHERE ims_receipt_sync_status = 'DEAD_LETTER')",
                Long.class);

        // Last reconciliation
        String lastReconStatus = "NONE";
        String lastReconCode = null;
        var lastReport = reconciliationReportRepository.findAllByOrderByStartedAtDesc(PageRequest.of(0, 1));
        if (lastReport.hasContent()) {
            lastReconStatus = lastReport.getContent().get(0).getStatus();
            lastReconCode = lastReport.getContent().get(0).getReportCode();
        }

        return new DashboardSummaryDto(
                totalStock != null ? totalStock : 0,
                lowStock != null ? lowStock : 0,
                expiringSoon != null ? expiringSoon : 0,
                quarantined != null ? quarantined : 0,
                pendingShipments != null ? pendingShipments : 0,
                pendingReturns != null ? pendingReturns : 0,
                pendingOrders != null ? pendingOrders : 0,
                syncFailed != null ? syncFailed : 0,
                deadLetters != null ? deadLetters : 0,
                lastReconStatus,
                lastReconCode
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<LowStockItemDto> getLowStockItems() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT p.product_code, p.name, o.outlet_name, s.quantity " +
                "FROM stock s " +
                "JOIN products p ON s.product_id = p.id " +
                "JOIN outlets o ON s.outlet_id = o.id " +
                "WHERE s.quantity < ? " +
                "ORDER BY s.quantity ASC LIMIT 100",
                lowStockThreshold);

        return rows.stream().map(row -> new LowStockItemDto(
                (String) row.get("product_code"),
                (String) row.get("name"),
                (String) row.get("outlet_name"),
                ((Number) row.get("quantity")).longValue(),
                lowStockThreshold
        )).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpiringItemDto> getExpiringItems(int daysAhead) {
        int window = daysAhead > 0 ? daysAhead : expiryWarningDays;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT bi.id, p.product_code, p.name, bi.expiry_date, bi.remaining_quantity, " +
                "DATEDIFF(bi.expiry_date, CURDATE()) AS days_until_expiry " +
                "FROM batch_items bi " +
                "JOIN products p ON bi.product_id = p.id " +
                "WHERE bi.expiry_date <= ? AND bi.expiry_date >= CURDATE() " +
                "  AND bi.is_quarantined = false AND bi.remaining_quantity > 0 " +
                "ORDER BY bi.expiry_date ASC LIMIT 100",
                LocalDate.now().plusDays(window));

        return rows.stream().map(row -> new ExpiringItemDto(
                ((Number) row.get("id")).longValue(),
                (String) row.get("product_code"),
                (String) row.get("name"),
                ((java.sql.Date) row.get("expiry_date")).toLocalDate(),
                ((Number) row.get("remaining_quantity")).intValue(),
                ((Number) row.get("days_until_expiry")).longValue()
        )).toList();
    }
}
