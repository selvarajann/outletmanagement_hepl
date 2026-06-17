package com.example.outletmanagement.config;

import java.util.concurrent.Executor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Configures the dedicated async thread pool used by {@link com.example.outletmanagement.service.AuditLogService}.
 * <p>
 * Using a named executor ({@code "auditTaskExecutor"}) rather than the default Spring async pool
 * ensures that audit DB writes never contend with or delay other async operations in the application.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Dedicated thread pool for asynchronous audit log writes.
     * <ul>
     *   <li>Core pool: 2 threads — always available for audit writes.</li>
     *   <li>Max pool: 5 threads — burst capacity under heavy load.</li>
     *   <li>Queue capacity: 500 — buffers burst requests without dropping them.</li>
     *   <li>Thread name prefix: {@code audit-} — easily identifiable in thread dumps.</li>
     * </ul>
     */
    @Bean(name = "auditTaskExecutor")
    public Executor auditTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("audit-");
        executor.initialize();
        return executor;
    }

    /**
     * Dedicated thread pool for async IMS (Inventory Management System) pushes.
     * Separate from auditTaskExecutor to avoid contention during high-load batch operations.
     */
    @Bean(name = "imsTaskExecutor")
    public Executor imsTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("ims-push-");
        executor.initialize();
        return executor;
    }

    /**
     * Dedicated thread pool for async Mailtrap email sending.
     * Isolated from audit/IMS threads so slow SMTP never blocks business logic.
     */
    @Bean(name = "emailTaskExecutor")
    public Executor emailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("email-");
        executor.initialize();
        return executor;
    }


    /**
     * RestTemplate configured with timeouts for IMS HTTP calls.
     * Uses application.properties values; falls back to safe defaults.
     */
    @Bean(name = "imsRestTemplate")
    public RestTemplate imsRestTemplate(
            @Value("${ims.connect-timeout-ms:3000}") int connectMs,
            @Value("${ims.read-timeout-ms:5000}") int readMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectMs);
        factory.setReadTimeout(readMs);
        return new RestTemplate(factory);
    }
}
