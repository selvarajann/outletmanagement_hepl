package com.example.outletmanagement.interceptor;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import com.example.outletmanagement.filter.CorrelationIdFilter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * MVC Interceptor — Order 2 in the interceptor chain.
 * <p>
 * Implements RFC 8594 API Deprecation signalling.
 * When a request matches a configured deprecated path pattern, this interceptor
 * adds the following standard response headers (non-breaking — never rejects the request):
 * <ul>
 *   <li>{@code Deprecation: true} — signals the endpoint is deprecated</li>
 *   <li>{@code Sunset: <date>} — planned removal date (ISO-8601 format)</li>
 *   <li>{@code Link: </api/v2/...>; rel="successor-version"} — points to replacement</li>
 * </ul>
 * <p>
 * Configuration via {@code application.properties}:
 * <pre>
 * app.api.deprecated-paths=/api/products/old,/api/divisions/legacy
 * app.api.deprecation-sunset-date=2025-12-31
 * </pre>
 */
@Component
public class ApiDeprecationInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(ApiDeprecationInterceptor.class);

    @Value("${app.api.deprecated-paths:}")
    private String deprecatedPathsConfig;

    /** The planned sunset date echoed in the {@code Sunset} header. */
    @Value("${app.api.deprecation-sunset-date:2025-12-31}")
    private String sunsetDate;

    /**
     * postHandle is used (not preHandle) because the response object is fully
     * prepared after the controller executes, making header injection reliable.
     */
    @Override
    public void postHandle(HttpServletRequest request,
                           HttpServletResponse response,
                           Object handler,
                           ModelAndView modelAndView) {

        if (deprecatedPathsConfig == null || deprecatedPathsConfig.isBlank()) {
            return;
        }

        List<String> deprecatedPaths = Arrays.asList(deprecatedPathsConfig.split(","));
        String requestUri = request.getRequestURI();

        boolean isDeprecated = deprecatedPaths.stream()
                .map(String::trim)
                .anyMatch(requestUri::startsWith);

        if (isDeprecated) {
            String correlationId = (String) request.getAttribute(CorrelationIdFilter.ATTR_CORRELATION_ID);

            response.setHeader("Deprecation", "true");
            response.setHeader("Sunset", sunsetDate);
            // Suggest the /api/v2 equivalent path as the successor
            String successorPath = requestUri.replace("/api/", "/api/v2/");
            response.setHeader("Link", "<" + successorPath + ">; rel=\"successor-version\"");

            log.warn("[{}] Deprecated endpoint accessed: {} — Sunset: {}", correlationId, requestUri, sunsetDate);
        }
    }
}
