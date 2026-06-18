ALTER TABLE audit_log ADD COLUMN business_key VARCHAR(255);
CREATE INDEX idx_audit_business_key ON audit_log(business_key);
