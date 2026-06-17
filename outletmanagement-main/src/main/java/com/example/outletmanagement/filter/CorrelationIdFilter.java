package com.example.outletmanagement.filter;

import java.io.IOException;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Filter Order 0 — runs FIRST before any other filter.
 * <p>
 * Responsibilities:
 * <ol>
 *   <li>Read client-supplied {@code X-Correlation-ID} header, or generate a UUID.</li>
 *   <li>Store the correlation ID in {@link MDC} as {@code correlationId} so all
 *       downstream log lines automatically carry it.</li>
 *   <li>Store the ID as a request attribute so interceptors and services can read it.</li>
 *   <li>Echo the ID back in the response header {@code X-Correlation-ID}.</li>
 *   <li>Always call {@link MDC#clear()} in a {@code finally} block to prevent
 *       thread-pool leaks (Tomcat reuses threads; stale MDC bleeds into future requests).</li>
 * </ol>
 */
@Component
@Order(0)
public class CorrelationIdFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(CorrelationIdFilter.class);

    /** Request attribute key — readable by interceptors and AOP aspects. */
    public static final String ATTR_CORRELATION_ID = "X-Correlation-ID";

    /** MDC key — automatically included in log output via logback pattern. */
    public static final String MDC_KEY = "correlationId";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Accept client-supplied correlation ID or generate a fresh one
        String correlationId = request.getHeader(ATTR_CORRELATION_ID);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }

        // Propagate into MDC and as a request attribute
        MDC.put(MDC_KEY, correlationId);
        request.setAttribute(ATTR_CORRELATION_ID, correlationId);

        // Echo correlation ID back to the client
        response.setHeader(ATTR_CORRELATION_ID, correlationId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            // CRITICAL: clear MDC so the thread-pool thread doesn't carry this
            // correlation ID into the next unrelated request.
            MDC.clear();
            log.trace("[{}] MDC cleared after request completion", correlationId);
        }
    }
}
