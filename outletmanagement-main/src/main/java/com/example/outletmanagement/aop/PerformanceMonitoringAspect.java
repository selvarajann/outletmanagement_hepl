package com.example.outletmanagement.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * AOP Aspect — wraps all {@code @Service}-annotated beans.
 * <p>
 * Measures the execution duration of every public service method and:
 * <ul>
 *   <li>Logs at {@code DEBUG} if duration ≤ threshold.</li>
 *   <li>Logs at {@code WARN} if duration > threshold — flags a potential bottleneck.</li>
 * </ul>
 * <p>
 * Why AOP instead of the Interceptor? An interceptor measures total HTTP round-trip time
 * (already covered by {@link com.example.outletmanagement.filter.RequestLoggingFilter}).
 * An {@code @Around} advice drills into the <em>service layer</em>, pinpointing which
 * specific method is slow — far more useful for identifying DB or business logic bottlenecks.
 * <p>
 * Configuration:
 * <pre>
 * app.performance.slow-service-threshold-ms=500
 * </pre>
 * <p>
 * Log output example:
 * <pre>
 * [correlationId=abc-123] PERF DivisionServiceImpl.getAllDivisions() completed in 312ms
 * [correlationId=abc-123] PERF SLOW ProductServiceImpl.importProducts() completed in 1823ms [threshold=500ms]
 * </pre>
 */
@Aspect
@Component
public class PerformanceMonitoringAspect {

    private static final Logger log = LoggerFactory.getLogger(PerformanceMonitoringAspect.class);

    @Value("${app.performance.slow-service-threshold-ms:500}")
    private long slowThresholdMs;

    /**
     * Pointcut: applies to all public methods in all classes annotated with
     * {@code @org.springframework.stereotype.Service}.
     */
    @Around("@within(org.springframework.stereotype.Service)")
    public Object measureServiceMethodDuration(ProceedingJoinPoint joinPoint) throws Throwable {

        String className  = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        long start = System.currentTimeMillis();
        try {
            return joinPoint.proceed();
        } finally {
            long durationMs = System.currentTimeMillis() - start;
            String correlationId = MDC.get("correlationId");
            String prefix = correlationId != null ? "[" + correlationId + "] " : "";

            if (durationMs > slowThresholdMs) {
                log.warn("{}PERF SLOW {}.{}() completed in {}ms [threshold={}ms]",
                        prefix, className, methodName, durationMs, slowThresholdMs);
            } else {
                log.debug("{}PERF {}.{}() completed in {}ms",
                        prefix, className, methodName, durationMs);
            }
        }
    }
}
