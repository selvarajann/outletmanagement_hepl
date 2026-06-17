package com.example.outletmanagement.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.example.outletmanagement.interceptor.ApiDeprecationInterceptor;
import com.example.outletmanagement.interceptor.AuditInterceptor;

/**
 * Spring MVC configuration.
 * <p>
 * Registers:
 * <ul>
 *   <li>Static resource handler for uploaded product images.</li>
 *   <li>MVC Interceptors for audit logging and API deprecation signalling.</li>
 * </ul>
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads/products}")
    private String uploadDir;

    @Autowired private AuditInterceptor auditInterceptor;
    @Autowired private ApiDeprecationInterceptor apiDeprecationInterceptor;
    @Autowired private com.example.outletmanagement.interceptor.IdempotencyInterceptor idempotencyInterceptor;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Derive the parent of the configured upload dir to serve /uploads/**
        String baseDir = uploadDir.contains("/")
                ? uploadDir.substring(0, uploadDir.indexOf("/"))
                : uploadDir;
        String absoluteBase = "file:" + System.getProperty("user.dir").replace("\\", "/") + "/" + baseDir + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(absoluteBase);
    }

    /**
     * Registers MVC interceptors.
     * <p>
     * Interceptor execution order (within MVC, after all Servlet Filters):
     * <ol>
     *   <li>Order 0: {@link AuditInterceptor}          — reads @AuditAction, async audit write</li>
     *   <li>Order 1: IdempotencyInterceptor</li>
     *   <li>Order 2: {@link ApiDeprecationInterceptor}  — adds RFC 8594 deprecation headers</li>
     * </ol>
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(auditInterceptor)
                .addPathPatterns("/api/**")
                .order(0);

        registry.addInterceptor(idempotencyInterceptor)
                .addPathPatterns("/api/**")
                .order(1);

        registry.addInterceptor(apiDeprecationInterceptor)
                .addPathPatterns("/api/**")
                .order(2);
    }
}

