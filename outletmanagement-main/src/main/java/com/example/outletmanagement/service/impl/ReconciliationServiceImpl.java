package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.model.entity.ReconciliationReport;
import com.example.outletmanagement.model.entity.ReconciliationReportItem;
import com.example.outletmanagement.model.enums.NotificationType;
import com.example.outletmanagement.repository.ReconciliationReportItemRepository;
import com.example.outletmanagement.repository.ReconciliationReportRepository;
import com.example.outletmanagement.service.AuditLogService;
import com.example.outletmanagement.service.NotificationService;
import com.example.outletmanagement.service.ReconciliationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsInventorySnapshotResponseDto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReconciliationServiceImpl implements ReconciliationService {

    private final ReconciliationReportRepository reportRepository;
    private final ReconciliationReportItemRepository reportItemRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final JdbcTemplate jdbcTemplate;
    private final RestTemplate imsRestTemplate;

    @Value("${ims.base-url:http://localhost:8081}")
    private String imsBaseUrl;

    @Value("${ims.api-key:}")
    private String imsApiKey;

    /**
     * CONTRACT_PENDING: IMS inventory snapshot endpoint.
     * Expected response shape: { items: [ { productCode, quantity } ] }
     */
    @Value("${ims.inventory-snapshot-endpoint:/api/inventory-snapshot}")
    private String imsSnapshotEndpoint;

    @Override
    @Transactional
    public ReconciliationReport triggerReconciliation(String triggeredBy) {
        String reportCode = "REC-" + System.currentTimeMillis();
        ReconciliationReport report = new ReconciliationReport();
        report.setReportCode(reportCode);
        report.setTriggeredBy(triggeredBy);
        report.setStatus("RUNNING");
        report.setStartedAt(LocalDateTime.now());
        report = reportRepository.save(report);

        auditLogService.saveAsync(UUID.randomUUID().toString(), triggeredBy,
                "RECONCILIATION_STARTED", "ReconciliationReport", reportCode,
                "POST", "/api/reconciliation/trigger", "CLIENT", 200, null, null);

        try {
            // Step 1: Aggregate OMS stock by product
            List<Map<String, Object>> omsRows = jdbcTemplate.queryForList(
                    "SELECT p.product_code, p.name AS product_name, COALESCE(SUM(bi.remaining_quantity), 0) AS total_qty " +
                    "FROM products p " +
                    "LEFT JOIN batch_items bi ON bi.product_id = p.id AND bi.is_quarantined = false AND bi.remaining_quantity > 0 " +
                    "GROUP BY p.product_code, p.name");

            report.setTotalProductsChecked(omsRows.size());

            // Step 2: Try fetching IMS snapshot (CONTRACT_PENDING)
            Map<String, Integer> imsQuantities = fetchImsSnapshot();
            boolean imsAvailable = !imsQuantities.isEmpty();

            if (!imsAvailable) {
                report.setStatus("IMS_FETCH_FAILED");
                report.setErrorMessage("IMS inventory snapshot not available. OMS-only report generated.");
            }

            // Step 3: Build report items
            List<ReconciliationReportItem> items = new ArrayList<>();
            int mismatches = 0;

            for (Map<String, Object> row : omsRows) {
                String productCode = (String) row.get("product_code");
                String productName = (String) row.get("product_name");
                int omsQty = ((Number) row.get("total_qty")).intValue();
                int imsQty = imsAvailable ? imsQuantities.getOrDefault(productCode, 0) : 0;
                int diff = omsQty - imsQty;

                String mismatchType;
                if (!imsAvailable) {
                    mismatchType = "OMS_ONLY";
                } else if (diff == 0) {
                    mismatchType = "MATCH";
                } else if (diff > 0) {
                    mismatchType = "OMS_SURPLUS";
                    mismatches++;
                } else {
                    mismatchType = "IMS_SURPLUS";
                    mismatches++;
                }

                ReconciliationReportItem item = new ReconciliationReportItem();
                item.setReport(report);
                item.setProductCode(productCode);
                item.setProductName(productName);
                item.setOmsQuantity(omsQty);
                item.setImsQuantity(imsQty);
                item.setDifference(diff);
                item.setMismatchType(mismatchType);
                items.add(item);
            }

            reportItemRepository.saveAll(items);

            report.setTotalMismatches(mismatches);
            if (imsAvailable) {
                report.setStatus("COMPLETED");
            }
            report.setCompletedAt(LocalDateTime.now());
            reportRepository.save(report);

            auditLogService.saveAsync(UUID.randomUUID().toString(), triggeredBy,
                    "RECONCILIATION_COMPLETED", "ReconciliationReport", reportCode,
                    "POST", "/api/reconciliation/trigger", "CLIENT", 200, null, null);

            if (mismatches > 0 && imsAvailable) {
                notificationService.sendToRole("SUPER_ADMIN", NotificationType.RECONCILIATION_MISMATCH,
                        "Inventory Reconciliation Mismatch",
                        mismatches + " product(s) have mismatched quantities. Report: " + reportCode);
            }

            log.info("[Reconciliation] Completed: report={}, products={}, mismatches={}", reportCode, omsRows.size(), mismatches);

        } catch (Exception e) {
            report.setStatus("FAILED");
            report.setErrorMessage(e.getMessage());
            report.setCompletedAt(LocalDateTime.now());
            reportRepository.save(report);

            auditLogService.saveAsync(UUID.randomUUID().toString(), triggeredBy,
                    "RECONCILIATION_FAILED", "ReconciliationReport", reportCode,
                    "POST", "/api/reconciliation/trigger", "CLIENT", 500, null, e.getMessage());

            log.error("[Reconciliation] Failed: report={}, error={}", reportCode, e.getMessage());
        }

        return report;
    }

    /**
     * CONTRACT_PENDING: Fetches inventory snapshot from IMS.
     * 
     * EXPECTED IMS REQUEST:
     * GET /api/inventory-snapshot
     * Headers:
     *   X-Api-Key: {imsApiKey}
     * 
     * EXPECTED IMS RESPONSE:
     * {
     *   "timestamp": "2025-10-15T10:00:00Z",
     *   "items": [
     *     { "productCode": "P-100", "quantity": 500 },
     *     { "productCode": "P-101", "quantity": 120 }
     *   ]
     * }
     * 
     * Returns empty map if IMS is unavailable or contract is not yet confirmed.
     */
    private Map<String, Integer> fetchImsSnapshot() {
        try {
            String endpoint = imsBaseUrl + imsSnapshotEndpoint;
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            if (imsApiKey != null && !imsApiKey.isBlank()) {
                headers.set("X-Api-Key", imsApiKey);
            }
            org.springframework.http.HttpEntity<Void> request = new org.springframework.http.HttpEntity<>(headers);
            
            log.info("[Reconciliation] Attempting IMS snapshot fetch from: {}", endpoint);
            
            ResponseEntity<ImsInventorySnapshotResponseDto> response = imsRestTemplate.exchange(
                    endpoint, org.springframework.http.HttpMethod.GET, request, ImsInventorySnapshotResponseDto.class);
            
            if (response.getBody() != null && response.getBody().getItems() != null) {
                return response.getBody().getItems().stream()
                        .collect(java.util.stream.Collectors.toMap(
                                ImsInventorySnapshotResponseDto.ImsSnapshotItemDto::getProductCode,
                                ImsInventorySnapshotResponseDto.ImsSnapshotItemDto::getQuantity
                        ));
            }
            return java.util.Collections.emptyMap();
        } catch (RestClientException e) {
            log.warn("[Reconciliation] IMS snapshot fetch failed: {}. Proceeding with OMS-only report.", e.getMessage());
            return java.util.Collections.emptyMap();
        }
    }

    @Override
    public Page<ReconciliationReport> getReports(Pageable pageable) {
        return reportRepository.findAllByOrderByStartedAtDesc(pageable);
    }

    @Override
    public ReconciliationReport getReport(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reconciliation report not found: " + id));
    }
}
