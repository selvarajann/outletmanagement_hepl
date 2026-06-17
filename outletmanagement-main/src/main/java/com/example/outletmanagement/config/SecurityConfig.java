package com.example.outletmanagement.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.outletmanagement.filter.CorrelationIdFilter;
import com.example.outletmanagement.filter.JwtAuthenticationFilter;
import com.example.outletmanagement.filter.RateLimitFilter;
import com.example.outletmanagement.filter.RoleAuthorizationFilter;
import com.example.outletmanagement.filter.RequestLoggingFilter;

/**
 * Servlet Filter registration and ordering.
 * <p>
 * Filter execution order:
 * <ol>
 *   <li>Order 0: {@link CorrelationIdFilter}    — sets MDC correlation ID (MUST run first)</li>
 *   <li>Order 1: {@link RequestLoggingFilter}   — wraps in ContentCachingRequestWrapper, logs →/←</li>
 *   <li>Order 2: {@link JwtAuthenticationFilter} — validates Bearer token</li>
 *   <li>Order 3: {@link RoleAuthorizationFilter} — SUPER_ADMIN guard</li>
 *   <li>Order 4: {@link RateLimitFilter}         — per-IP Bucket4j rate limiting</li>
 * </ol>
 */
@Configuration
public class SecurityConfig {

    @Autowired private CorrelationIdFilter correlationIdFilter;
    @Autowired private RequestLoggingFilter requestLoggingFilter;
    @Autowired private JwtAuthenticationFilter jwtAuthenticationFilter;
    @Autowired private RoleAuthorizationFilter roleAuthorizationFilter;
    @Autowired private RateLimitFilter rateLimitFilter;

    /** Order 0 — MUST be first: seeds MDC with correlation ID before all other filters. */
    @Bean
    public FilterRegistrationBean<CorrelationIdFilter> correlationIdFilterBean() {
        FilterRegistrationBean<CorrelationIdFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(correlationIdFilter);
        bean.addUrlPatterns("/*");  // Applies globally — correlation ID needed on every request
        bean.setOrder(0);
        return bean;
    }

    /** Order 1 — Wraps request in ContentCachingRequestWrapper; logs inbound/outbound. */
    @Bean
    public FilterRegistrationBean<RequestLoggingFilter> requestLoggingFilterBean() {
        FilterRegistrationBean<RequestLoggingFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(requestLoggingFilter);
        bean.addUrlPatterns("/*");
        bean.setOrder(1);
        return bean;
    }

    /** Order 2 — JWT token validation (was Order 1). */
    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilter() {
        FilterRegistrationBean<JwtAuthenticationFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(jwtAuthenticationFilter);
        bean.addUrlPatterns("/api/*");
        bean.setOrder(2);
        return bean;
    }

    /** Order 3 — Role-based SUPER_ADMIN guard (was Order 2). */
    @Bean
    public FilterRegistrationBean<RoleAuthorizationFilter> roleFilter() {
        FilterRegistrationBean<RoleAuthorizationFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(roleAuthorizationFilter);
        bean.addUrlPatterns("/api/*");
        bean.setOrder(3);
        return bean;
    }

    /** Order 4 — Per-IP rate limiting via Bucket4j + Caffeine; returns HTTP 429 on breach. */
    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilterBean() {
        FilterRegistrationBean<RateLimitFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(rateLimitFilter);
        bean.addUrlPatterns("/api/*");
        bean.setOrder(4);
        return bean;
    }
}

