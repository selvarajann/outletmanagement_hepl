package com.example.outletmanagement.service;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.outletmanagement.repository.AuditLogRepository;

import lombok.RequiredArgsConstructor;

/**
 * Scheduled cleanup job for the {@code audit_log} table.
 * <p>
 * Runs nightly at 02:00 AM and deletes all audit records older than
 * {@code app.audit.retain-days} days (default: 90).
 * <p>
 * Without a retention policy the audit table would grow unboundedly, eventually
 * causing disk pressure and degrading query performance despite the indexes.
 * <p>
 * The {@link Scheduled} cron expression {@code "0 0 2 * * *"} means:
 * second=0, minute=0, hour=2, any-day, any-month, any-weekday.
 */
@Component
@RequiredArgsConstructor
public class AuditCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(AuditCleanupScheduler.class);

    @Value("${app.audit.retain-days:90}")
    private int retainDays;

    private final AuditLogRepository auditLogRepository;

    /**
     * Deletes audit records older than the configured retention period.
     * Runs daily at 02:00 AM.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void purgeExpiredAuditLogs() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(retainDays);
        log.info("[AuditCleanup] Purging audit records older than {} ({} days)", threshold, retainDays);

        try {
            long deleted = auditLogRepository.deleteByCreatedAtBefore(threshold);
            log.info("[AuditCleanup] Purged {} expired audit record(s)", deleted);
        } catch (Exception e) {
            log.error("[AuditCleanup] Failed to purge audit records: {}", e.getMessage(), e);
        }
    }
}
