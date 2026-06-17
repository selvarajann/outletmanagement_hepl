-- Migration script to create tables for OMS-IMS Integration
-- V2__add_oms_ims_integration_tables.sql

-- 1. Create Webhook Audit Table
CREATE TABLE IF NOT EXISTS webhook_audits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    webhook_id VARCHAR(255) NOT NULL UNIQUE,
    source VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    payload TEXT,
    status VARCHAR(255) NOT NULL,
    error_message TEXT,
    created_at DATETIME,
    updated_at DATETIME
);

-- 2. Create Shipments Table
CREATE TABLE IF NOT EXISTS shipments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_code VARCHAR(255) NOT NULL UNIQUE,
    ims_reference_code VARCHAR(255) NOT NULL,
    order_id BIGINT NOT NULL,
    outlet_id BIGINT NOT NULL,
    status VARCHAR(255) NOT NULL,
    dispatch_date DATE,
    received_date DATE,
    notes TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES stock_orders(id),
    FOREIGN KEY (outlet_id) REFERENCES outlets(id)
);

-- 3. Create Shipment Items Table
CREATE TABLE IF NOT EXISTS shipment_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity_dispatched INT NOT NULL,
    quantity_received INT,
    mfg_date DATE,
    expiry_date DATE,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 4. Create Stock Returns Table
CREATE TABLE IF NOT EXISTS stock_returns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    return_code VARCHAR(255) NOT NULL UNIQUE,
    batch_id BIGINT NOT NULL,
    outlet_id BIGINT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    ims_ack_code VARCHAR(255),
    notes TEXT,
    created_by VARCHAR(255),
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (batch_id) REFERENCES batches(id),
    FOREIGN KEY (outlet_id) REFERENCES outlets(id)
);

-- 5. Create Stock Return Items Table
CREATE TABLE IF NOT EXISTS stock_return_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    return_id BIGINT NOT NULL,
    batch_item_id BIGINT NOT NULL,
    quantity_returned INT NOT NULL,
    defect_description TEXT,
    FOREIGN KEY (return_id) REFERENCES stock_returns(id),
    FOREIGN KEY (batch_item_id) REFERENCES batch_items(id)
);
