CREATE TABLE reconciliation_reports (
    id BIGSERIAL PRIMARY KEY,
    report_code VARCHAR(255) UNIQUE NOT NULL,
    triggered_by VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
    total_products_checked INT DEFAULT 0,
    total_mismatches INT DEFAULT 0,
    ims_snapshot_timestamp TIMESTAMP NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT
);

CREATE TABLE reconciliation_report_items (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL,
    outlet_id BIGINT,
    product_code VARCHAR(255) NOT NULL,
    product_name VARCHAR(255),
    oms_quantity INT NOT NULL DEFAULT 0,
    ims_quantity INT NOT NULL DEFAULT 0,
    difference INT NOT NULL DEFAULT 0,
    mismatch_type VARCHAR(20) NOT NULL DEFAULT 'OMS_ONLY',
    CONSTRAINT fk_recon_report FOREIGN KEY (report_id) REFERENCES reconciliation_reports(id),
    CONSTRAINT fk_recon_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
);

CREATE INDEX idx_recon_report_id ON reconciliation_report_items(report_id);
CREATE INDEX idx_recon_product_code ON reconciliation_report_items(product_code);
CREATE INDEX idx_recon_status ON reconciliation_reports(status);
