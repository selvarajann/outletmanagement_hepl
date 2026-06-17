package com.example.outletmanagement.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a controller method for audit logging.
 * <p>
 * When present, {@link com.example.outletmanagement.interceptor.AuditInterceptor}
 * will capture the action and write an {@code AuditLog} entry asynchronously.
 *
 * <pre>
 * {@code
 * @PostMapping
 * @AuditAction(action = "CREATE_PRODUCT", entity = "Product", captureBody = true)
 * public ResponseEntity<?> createProduct(@RequestBody ProductRequest req) { ... }
 * }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditAction {

    /** Short, uppercase action descriptor, e.g. "CREATE_PRODUCT", "DELETE_DIVISION". */
    String action();

    /** Domain entity name, e.g. "Product", "Division", "StockOrder". */
    String entity();

    /**
     * When {@code true}, the {@code AuditInterceptor} will include the (cached) request
     * body in the audit record. Opt-in only — keep {@code false} for sensitive endpoints.
     */
    boolean captureBody() default false;
}
