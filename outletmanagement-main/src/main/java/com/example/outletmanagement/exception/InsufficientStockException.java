package com.example.outletmanagement.exception;

/**
 * Thrown when a sale requests more quantity than available in RECEIVED batches.
 * Handled by {@link GlobalExceptionHandler} and returns HTTP 400.
 */
public class InsufficientStockException extends RuntimeException {

    private final Long productId;
    private final int requested;
    private final int available;

    public InsufficientStockException(Long productId, String productName, int requested, int available) {
        super(String.format(
                "Insufficient stock for product '%s' (id=%d): requested %d, available %d",
                productName, productId, requested, available));
        this.productId = productId;
        this.requested = requested;
        this.available = available;
    }

    public Long getProductId() { return productId; }
    public int getRequested()  { return requested; }
    public int getAvailable()  { return available; }
}
