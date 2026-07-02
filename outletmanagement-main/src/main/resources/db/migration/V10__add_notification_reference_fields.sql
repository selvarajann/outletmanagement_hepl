ALTER TABLE notifications
    ADD COLUMN reference_id BIGINT,
    ADD COLUMN reference_type VARCHAR(50);

CREATE INDEX idx_notification_ref ON notifications(reference_type, reference_id);
