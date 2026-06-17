package com.example.outletmanagement.exception;

/**
 * Thrown when a client exceeds the rate limit enforced by {@link com.example.outletmanagement.filter.RateLimitFilter}.
 * <p>
 * The {@link com.example.outletmanagement.exception.GlobalExceptionHandler} maps this to HTTP 429
 * with a {@code Retry-After} response header.
 * <p>
 * Note: In the current architecture, the {@code RateLimitFilter} returns HTTP 429 directly
 * (writing to the response before the MVC layer is reached). This exception class exists as
 * a complementary mechanism for service-layer code that may also enforce rate limits programmatically.
 */
public class RateLimitExceededException extends RuntimeException {

    private final long retryAfterSeconds;

    public RateLimitExceededException(long retryAfterSeconds) {
        super("Rate limit exceeded. Retry after " + retryAfterSeconds + " seconds.");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public RateLimitExceededException(String message, long retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
