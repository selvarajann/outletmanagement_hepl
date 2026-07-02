CREATE TABLE ims_master_batch (
    id BIGSERIAL PRIMARY KEY,
    batch_code VARCHAR(255) NOT NULL,
    product_id BIGINT NOT NULL,
    mfg_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    ims_created_at TIMESTAMP,
    ims_updated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ims_master_batch_prod FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT uq_ims_master_batch_code_prod UNIQUE (batch_code, product_id)
);

CREATE INDEX idx_ims_master_batch_lookup ON ims_master_batch (batch_code, product_id);

ALTER TABLE batch_items 
ADD COLUMN is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN quarantine_reason VARCHAR(255),
ADD COLUMN quarantine_reviewed_by VARCHAR(100),
ADD COLUMN quarantine_reviewed_at TIMESTAMP,
ADD COLUMN ims_batch_code VARCHAR(255);
