package com.example.outletmanagement.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Single source of truth for CORS configuration.
 * The JwtAuthenticationFilter must NOT set any Access-Control-* headers —
 * doing so creates duplicate headers that cause browsers to reject Set-Cookie.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                    "http://localhost:8080",
                    "http://localhost:5173",
                    "http://localhost:3000",
                    "https://70rgsz56-8080.inc1.devtunnels.ms"   // no trailing slash
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD")
                .allowedHeaders("*")
                // exposedHeaders tells the browser it may read these headers cross-origin.
                // Set-Cookie must be listed so the browser stores the HttpOnly refresh token.
                // X-Correlation-ID, X-Response-Time, Deprecation, Sunset, Retry-After are new
                // response headers added by the filter/interceptor layer.
                .exposedHeaders(
                    "Authorization", "Content-Type", "Set-Cookie",
                    "X-Correlation-ID", "X-Response-Time",
                    "Deprecation", "Sunset", "Retry-After"
                )
                .allowCredentials(true)
                .maxAge(3600);
    }
}