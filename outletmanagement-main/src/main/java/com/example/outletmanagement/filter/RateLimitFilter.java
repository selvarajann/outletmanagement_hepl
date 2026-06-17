package com.example.outletmanagement.filter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Filter Order 4 — runs after JWT (Order 2) and Role (Order 3) filters.
 * <p>
 * Implements per-IP rate limiting using the <strong>Bucket4j token bucket algorithm</strong>
 * backed by a <strong>Caffeine</strong> bounded in-memory cache.
 * <p>
 * Why not an interceptor?  Rate limiting must block <em>before</em> the DispatcherServlet
 * incurs handler mapping, session resolution, and argument resolution overhead. A Servlet
 * Filter short-circuits the entire MVC pipeline on rejection.
 * <p>
 * Thread safety: Caffeine's {@link Cache} is fully concurrent. Each bucket itself uses
 * Compare-And-Swap internally (Bucket4j guarantee) — no external locking needed.
 * <p>
 * Migration path: swap the Caffeine backend for a Redis-backed ProxyManager to achieve
 * distributed rate limiting across multiple application nodes.
 */
@Component
@Order(4)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    @Value("${app.rate-limit.max-requests:100}")
    private long maxRequests;

    @Value("${app.rate-limit.refill-seconds:60}")
    private long refillSeconds;

    /**
     * Caffeine cache: one {@link Bucket} per client IP.
     * <ul>
     *   <li>Maximum 10 000 entries — prevents unbounded memory growth under IP-spoofing attacks.</li>
     *   <li>Entries expire 10 minutes after last write — stale IPs are automatically evicted.</li>
     * </ul>
     */
    private final Cache<String, Bucket> bucketCache = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofMinutes(10))
            .build();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Auth endpoints are exempt — we never want to rate-limit the login/register flow
        if (path.startsWith("/api/v1/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        Bucket bucket = bucketCache.get(clientIp, ip -> createBucket());

        if (bucket.tryConsume(1)) {
            // Token consumed successfully — request is allowed
            filterChain.doFilter(request, response);
        } else {
            // Bucket exhausted — return HTTP 429 Too Many Requests
            log.warn("[RateLimit] IP {} exceeded {} req/{} sec limit on path: {}",
                    clientIp, maxRequests, refillSeconds, path);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Retry-After", String.valueOf(refillSeconds));

            String correlationId = (String) request.getAttribute(CorrelationIdFilter.ATTR_CORRELATION_ID);
            String body = String.format(
                    "{\"status\":429,\"error\":\"Too Many Requests\"," +
                    "\"message\":\"Rate limit exceeded. Retry after %d seconds.\",\"correlationId\":\"%s\"}",
                    refillSeconds, correlationId != null ? correlationId : "unknown");

            response.getWriter().write(body);
        }
    }

    /**
     * Creates a new token bucket for an IP.
     * Refills {@code maxRequests} tokens every {@code refillSeconds} seconds (greedy refill).
     */
    private Bucket createBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(maxRequests)
                .refillGreedy(maxRequests, Duration.ofSeconds(refillSeconds))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Extracts the real client IP, honouring X-Forwarded-For (reverse proxy / load balancer).
     */
    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
