package com.example.outletmanagement.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.outletmanagement.model.entity.AuditLog;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.repository.AuditLogRepository;

import lombok.RequiredArgsConstructor;

/**
 * Admin-only endpoint exposing the audit log for SUPER_ADMIN users.
 * <p>
 * Protected by {@link com.example.outletmanagement.filter.RoleAuthorizationFilter}
 * (extend the path guard to include {@code /api/v1/audit-logs}).
 * <p>
 * All responses are paginated — no unbounded result sets.
 */
@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    private static final DateTimeFormatter DT_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Returns a paginated, filtered view of the audit log.
     *
     * @param username  optional filter by username
     * @param entity    optional filter by entity type (e.g. "Product")
     * @param from      optional start timestamp (ISO-8601, e.g. 2024-01-01T00:00:00)
     * @param to        optional end timestamp (ISO-8601)
     * @param page      zero-based page index
     * @param size      page size (max 100 enforced)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String entity,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        // Cap page size to prevent accidental large result sets
        int safeSize = Math.min(size, 100);
        PageRequest pageable = PageRequest.of(page, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        // Resolve default date range (last 30 days) if not specified
        LocalDateTime effectiveFrom = from != null ? from : LocalDateTime.now().minusDays(30);
        LocalDateTime effectiveTo   = to   != null ? to   : LocalDateTime.now();

        Page<AuditLog> result;

        if (username != null && !username.isBlank() && entity != null && !entity.isBlank()) {
            result = auditLogRepository.findByUsernameAndEntityAndCreatedAtBetween(
                    username, entity, effectiveFrom, effectiveTo, pageable);

        } else if (username != null && !username.isBlank()) {
            result = auditLogRepository.findByUsernameAndCreatedAtBetween(
                    username, effectiveFrom, effectiveTo, pageable);

        } else {
            result = auditLogRepository.findByCreatedAtBetween(
                    effectiveFrom, effectiveTo, pageable);
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Audit logs fetched", result));
    }
}
