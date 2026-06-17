package com.example.outletmanagement.model.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Persistent audit log entry created for every annotated controller action.
 * <p>
 * Three database indexes are declared to support the expected query patterns:
 * <ul>
 *   <li>{@code idx_audit_username} — {@code WHERE username = ?} (user-level audit queries)</li>
 *   <li>{@code idx_audit_entity}   — {@code WHERE entity = ?} (entity-level audit queries)</li>
 *   <li>{@code idx_audit_created}  — {@code WHERE created_at > ?} (time-range queries and retention cleanup)</li>
 * </ul>
 * Without these indexes a SELECT on a million-row table would full-scan.
 */
@Entity
@Table(
    name = "audit_log",
    indexes = {
        @Index(name = "idx_audit_username", columnList = "username"),
        @Index(name = "idx_audit_entity",   columnList = "entity"),
        @Index(name = "idx_audit_created",  columnList = "created_at")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Correlation ID from the HTTP request — links log lines to audit entries. */
    @Column(name = "correlation_id", length = 36)
    private String correlationId;

    /** Authenticated username; "anonymous" for unauthenticated actions. */
    @Column(name = "username", nullable = false, length = 150)
    private String username;

    /** Short action descriptor from {@code @AuditAction.action()}, e.g. "CREATE_PRODUCT". */
    @Column(name = "action", nullable = false, length = 100)
    private String action;

    /** Domain entity name from {@code @AuditAction.entity()}, e.g. "Product". */
    @Column(name = "entity", nullable = false, length = 100)
    private String entity;

    /** HTTP method — GET, POST, PUT, DELETE, PATCH. */
    @Column(name = "http_method", length = 10)
    private String httpMethod;

    /** Request URI, e.g. "/api/divisions/5". */
    @Column(name = "uri", length = 500)
    private String uri;

    /** Client IP address (first entry in X-Forwarded-For chain). */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /** HTTP response status code returned to the client. */
    @Column(name = "status_code")
    private Integer statusCode;

    /**
     * Optional captured request body (only when {@code @AuditAction.captureBody = true}).
     * Stored as TEXT — avoid capturing bodies for sensitive endpoints (auth, password change).
     */
    @Column(name = "request_body", columnDefinition = "TEXT")
    private String requestBody;

    /** If action was performed during impersonation, the real admin username. */
    @Column(name = "impersonated_by", length = 150)
    private String impersonatedBy;

    /** Timestamp when the audit record was created. */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
