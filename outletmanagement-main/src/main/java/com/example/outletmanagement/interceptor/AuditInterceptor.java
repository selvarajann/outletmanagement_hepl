package com.example.outletmanagement.interceptor;

import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.util.ContentCachingRequestWrapper;

import com.example.outletmanagement.annotation.AuditAction;
import com.example.outletmanagement.filter.CorrelationIdFilter;
import com.example.outletmanagement.service.AuditLogService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * MVC Interceptor — Order 1 in the interceptor chain.
 * <p>
 * Reads the {@link AuditAction} annotation from the matched handler method and,
 * after the controller has executed, delegates an asynchronous audit write to
 * {@link AuditLogService}.
 * <p>
 * <strong>Body safety:</strong> {@link com.example.outletmanagement.filter.RequestLoggingFilter}
 * wraps the request in a {@link ContentCachingRequestWrapper} before the DispatcherServlet
 * is reached, so reading the body here does NOT consume the stream a second time.
 * <p>
 * <strong>Non-blocking:</strong> the {@code AuditLogService.saveAsync()} call is annotated
 * {@code @Async}, so this interceptor returns immediately and does not add HTTP latency.
 */
@Component
@RequiredArgsConstructor
public class AuditInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(AuditInterceptor.class);

    /** Request attribute key used to store captured body for afterCompletion. */
    private static final String ATTR_AUDIT_META = "audit.meta";

    private final AuditLogService auditLogService;

    /**
     * Pre-handle: only executes if handler is an annotated controller method.
     * Captures context into a request attribute so afterCompletion can read status code.
     */
    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {

        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true; // Not a controller endpoint — pass through
        }

        AuditAction auditAction = handlerMethod.getMethodAnnotation(AuditAction.class);
        if (auditAction == null) {
            return true; // Method not annotated — nothing to audit
        }

        // Stash audit metadata so afterCompletion can access it without re-reading the handler
        AuditMeta meta = new AuditMeta(auditAction.action(), auditAction.entity(), auditAction.captureBody());
        request.setAttribute(ATTR_AUDIT_META, meta);

        return true;
    }

    /**
     * After completion: called after the view is rendered (or response is committed).
     * At this point, the HTTP status code is available.
     */
    @Override
    public void afterCompletion(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler,
                                Exception ex) {

        AuditMeta meta = (AuditMeta) request.getAttribute(ATTR_AUDIT_META);
        if (meta == null) {
            return; // Endpoint was not annotated
        }

        String correlationId = (String) request.getAttribute(CorrelationIdFilter.ATTR_CORRELATION_ID);
        String username = (String) request.getAttribute("authenticatedUsername");
        if (username == null) username = "anonymous";

        // Optionally capture request body from the cached wrapper (safe re-read)
        String requestBody = null;
        if (meta.captureBody()) {
            requestBody = extractCachedBody(request);
        }

        String clientIp = getClientIp(request);
        int statusCode = response.getStatus();

        String impersonatedBy = (String) request.getAttribute("impersonatedBy");

        // Async write — returns immediately; AuditLogService handles retry/fallback
        auditLogService.saveAsync(
                correlationId, username, meta.action(), meta.entity(), null,
                request.getMethod(), request.getRequestURI(), clientIp,
                statusCode, requestBody, impersonatedBy);

        log.debug("[{}] Audit enqueued — action={}, entity={}, user={}, status={}",
                correlationId, meta.action(), meta.entity(), username, statusCode);
    }

    private String extractCachedBody(HttpServletRequest request) {
        try {
            if (request instanceof ContentCachingRequestWrapper wrapper) {
                byte[] buf = wrapper.getContentAsByteArray();
                if (buf.length > 0) {
                    return new String(buf, StandardCharsets.UTF_8);
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract cached request body for audit: {}", e.getMessage());
        }
        return null;
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /** Lightweight value carrier for audit metadata between preHandle and afterCompletion. */
    private record AuditMeta(String action, String entity, boolean captureBody) {}
}
