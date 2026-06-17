package com.example.outletmanagement.repository;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.outletmanagement.model.entity.AuditLog;

/**
 * JPA repository for {@link AuditLog} entities.
 * <p>
 * All query methods benefit from the three indexes declared on the {@code audit_log} table
 * ({@code idx_audit_username}, {@code idx_audit_entity}, {@code idx_audit_created}).
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Finds all audit log entries for a given username and entity within a time range.
     * Used by the admin audit log API for filtered, paginated results.
     *
     * @param username  authenticated username
     * @param entity    domain entity name, e.g. "Product"
     * @param from      start of time range (inclusive)
     * @param to        end of time range (inclusive)
     * @param pageable  pagination and sorting
     * @return paginated results
     */
    Page<AuditLog> findByUsernameAndEntityAndCreatedAtBetween(
            String username, String entity,
            LocalDateTime from, LocalDateTime to,
            Pageable pageable);

    /**
     * Finds audit entries for a username across all entities within a time range.
     * Used when the admin filters by user only (no entity filter).
     */
    Page<AuditLog> findByUsernameAndCreatedAtBetween(
            String username,
            LocalDateTime from, LocalDateTime to,
            Pageable pageable);

    /**
     * Finds all audit entries within a time range.
     * Used for time-range-only queries (no username or entity filter).
     */
    Page<AuditLog> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);

    /**
     * Deletes all audit entries older than the given threshold.
     * Called by {@link com.example.outletmanagement.service.AuditCleanupScheduler}
     * during nightly retention cleanup.
     *
     * @param threshold  all records with {@code created_at < threshold} are deleted
     * @return number of records deleted
     */
    long deleteByCreatedAtBefore(LocalDateTime threshold);
}
