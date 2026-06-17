package com.example.outletmanagement.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark endpoints that should be idempotent.
 * Requires the client to send an 'Idempotency-Key' HTTP header.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Idempotent {
    // TTL for the idempotency key in seconds (default 24 hours)
    long ttlSeconds() default 86400;
}
