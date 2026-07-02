-- V8: Add IMS receipt sync tracking fields to shipments table
-- and retry count fields to stock_orders and stock_returns for Phase 12
ALTER TABLE shipments
    ADD COLUMN ims_receipt_sync_status VARCHAR(20) DEFAULT 'PENDING',
    ADD COLUMN ims_receipt_sync_at TIMESTAMP NULL,
    ADD COLUMN ims_receipt_reference_code VARCHAR(255),
    ADD COLUMN ims_receipt_retry_count INT DEFAULT 0;

ALTER TABLE stock_orders
    ADD COLUMN ims_push_retry_count INT DEFAULT 0;

ALTER TABLE stock_returns
    ADD COLUMN ims_push_retry_count INT DEFAULT 0;
