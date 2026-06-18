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
import com.example.outletmanagement.specification.AuditLogSpecification;
import org.springframework.data.jpa.domain.Specification;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String entity,
            @RequestParam(required = false) String businessKey,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        int safeSize = Math.min(size, 100);
        PageRequest pageable = PageRequest.of(page, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        LocalDateTime effectiveFrom = from != null ? from : LocalDateTime.now().minusDays(30);
        LocalDateTime effectiveTo   = to   != null ? to   : LocalDateTime.now();

        Specification<AuditLog> spec = AuditLogSpecification.filterBy(entity, businessKey, username, effectiveFrom, effectiveTo);
        Page<AuditLog> result = auditLogRepository.findAll(spec, pageable);

        return ResponseEntity.ok(new ApiResponse<>(true, "Audit logs fetched", result));
    }
}
