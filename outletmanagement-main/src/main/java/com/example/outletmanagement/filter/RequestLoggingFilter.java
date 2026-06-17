package com.example.outletmanagement.filter;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Filter Order 1 — runs immediately after {@link CorrelationIdFilter}.
 * <p>
 * Responsibilities:
 * <ol>
 *   <li>Wrap the raw {@link HttpServletRequest} in a {@link ContentCachingRequestWrapper}
 *       so the request body can be re-read safely downstream (interceptors, AOP)
 *       without consuming the stream.</li>
 *   <li>Wrap the response in a {@link ContentCachingResponseWrapper} to allow
 *       response body logging after the chain executes.</li>
 *   <li>Log an inbound {@code →} line with method, URI, query string, and client IP.</li>
 *   <li>Log an outbound {@code ←} line with HTTP status and elapsed duration in ms.</li>
 * </ol>
 * <p>
 * The correlation ID is available in MDC (set by {@link CorrelationIdFilter}) so every
 * log line in this filter automatically carries it.
 */
@Component
@Order(1)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    /** Request attribute key — stores start timestamp for duration calculation. */
    public static final String ATTR_START_TIME = "req.startTime";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Wrap so downstream code (interceptors, @RequestBody) can read the body
        // Spring 6.x/Boot 4.x ContentCachingRequestWrapper requires an explicit buffer size
        final int BODY_BUFFER_SIZE = 10 * 1024; // 10 KB — sufficient for typical JSON payloads
        ContentCachingRequestWrapper wrappedRequest =
                request instanceof ContentCachingRequestWrapper
                        ? (ContentCachingRequestWrapper) request
                        : new ContentCachingRequestWrapper(request, BODY_BUFFER_SIZE);

        ContentCachingResponseWrapper wrappedResponse =
                response instanceof ContentCachingResponseWrapper
                        ? (ContentCachingResponseWrapper) response
                        : new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();
        wrappedRequest.setAttribute(ATTR_START_TIME, startTime);

        // Inbound log line
        String correlationId = (String) request.getAttribute(CorrelationIdFilter.ATTR_CORRELATION_ID);
        String queryString = request.getQueryString();
        String uri = request.getRequestURI() + (queryString != null ? "?" + queryString : "");
        String clientIp = getClientIp(request);

        log.info("[{}] → {} {} from {}", correlationId, request.getMethod(), uri, clientIp);

        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            // Add elapsed duration header before flushing
            response.setHeader("X-Response-Time", duration + "ms");

            log.info("[{}] ← {} {} in {}ms", correlationId, wrappedResponse.getStatus(), uri, duration);

            // IMPORTANT: copy cached response body back to the real response stream
            wrappedResponse.copyBodyToResponse();
        }
    }

    /**
     * Extracts the real client IP, honouring X-Forwarded-For when present
     * (e.g. behind a load balancer or reverse proxy).
     */
    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // X-Forwarded-For may contain a comma-separated chain; first entry is the original client
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
