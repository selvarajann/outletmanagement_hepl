package com.example.outletmanagement.service;

import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.example.outletmanagement.model.entity.AuditLog;
import com.example.outletmanagement.model.enums.NotificationType;
import com.example.outletmanagement.repository.AuditLogRepository;
import com.example.outletmanagement.service.NotificationService;

import lombok.RequiredArgsConstructor;

/**
 * Service responsible for persisting {@link AuditLog} entries asynchronously.
 * <p>
 * The {@code @Async("auditTaskExecutor")} annotation causes the {@link #saveAsync} method
 * to execute on a dedicated {@code ThreadPoolTaskExecutor} bean named {@code auditTaskExecutor}
 * (defined in {@link com.example.outletmanagement.config.AsyncConfig}) rather than the default
 * Spring async pool, ensuring audit writes never contend with request-handling threads.
 * <p>
 * <strong>Failure handling:</strong> if the DB write fails (e.g. transient connection error),
 * a structured {@code ERROR} log is emitted with the full audit context, ensuring the audit
 * trail is never silently lost — even when persistence is temporarily unavailable.
 * <p>
 * // TODO: Replace {@code auditLogRepository.save()} with a Kafka {@code ProducerRecord} publish
 * //       for guaranteed, at-least-once delivery in a production multi-node deployment.
 */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;
    private final NotificationService notificationService;

    /**
     * Persists one audit log entry asynchronously.
     * Called from {@link com.example.outletmanagement.interceptor.AuditInterceptor#afterCompletion}.
     *
     * @param correlationId correlation ID from the HTTP request
     * @param username      authenticated user or "anonymous"
     * @param action        action label, e.g. "CREATE_PRODUCT"
     * @param entity        domain entity, e.g. "Product"
     * @param httpMethod    HTTP verb
     * @param uri           request URI
     * @param ipAddress     client IP address
     * @param statusCode    HTTP response status code
     * @param requestBody   optional request body (null unless captureBody = true)
     */
    @Async("auditTaskExecutor")
    public CompletableFuture<Void> saveAsync(String correlationId,
                                             String username,
                                             String action,
                                             String entity,
                                             String businessKey,
                                             String httpMethod,
                                             String uri,
                                             String ipAddress,
                                             int statusCode,
                                             String requestBody,
                                             String impersonatedBy) {
        try {
            AuditLog entry = AuditLog.builder()
                    .correlationId(correlationId)
                    .username(username)
                    .action(action)
                    .entity(entity)
                    .businessKey(businessKey)
                    .httpMethod(httpMethod)
                    .uri(uri)
                    .ipAddress(ipAddress)
                    .statusCode(statusCode)
                    .requestBody(requestBody)
                    .impersonatedBy(impersonatedBy)
                    .createdAt(LocalDateTime.now())
                    .build();

            log.info("BUSINESS_KEY_BEFORE_SAVE={}", entry.getBusinessKey());

            AuditLog saved = auditLogRepository.save(entry);
            
            log.info("BUSINESS_KEY_AFTER_SAVE={}", saved.getBusinessKey());

            log.debug("[{}] Audit persisted — action={}, entity={}, key={}, user={}", correlationId, action, entity, businessKey, username);

            // Trigger notification for major SUPER_ADMIN events (e.g. DELETE, IMPORT)
            if (action != null && (action.startsWith("DELETE_") || action.startsWith("IMPORT_"))) {
                String title = action.startsWith("IMPORT_") ? "Bulk Import Action" : "Delete Action";
                String msg = String.format("Audit event: %s performed by %s on %s", action, username, entity);
                
                // Fire and forget (don't block the async thread if STOMP fails)
                try {
                    notificationService.sendToRole("SUPER_ADMIN", NotificationType.AUDIT_ACTION, title, msg);
                } catch (Exception wsEx) {
                    log.warn("Failed to send WebSocket audit notification: {}", wsEx.getMessage());
                }
            }

        } catch (Exception e) {
            // Structured fallback log — audit trail is preserved even if DB is temporarily unavailable.
            // In production, replace this save() call with a Kafka publish for guaranteed delivery.
            log.error("[AUDIT_FALLBACK] DB write failed — correlationId={}, username={}, impersonatedBy={}, action={}, "
                    + "entity={}, method={}, uri={}, ip={}, status={}, error={}",
                    correlationId, username, impersonatedBy, action, entity, httpMethod, uri, ipAddress, statusCode,
                    e.getMessage(), e);
        }

        return CompletableFuture.completedFuture(null);
    }
}
