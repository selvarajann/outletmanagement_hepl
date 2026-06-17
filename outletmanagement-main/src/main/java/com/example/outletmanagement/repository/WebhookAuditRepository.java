package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.WebhookAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WebhookAuditRepository extends JpaRepository<WebhookAudit, Long>, JpaSpecificationExecutor<WebhookAudit> {
    Optional<WebhookAudit> findByWebhookId(String webhookId);
    boolean existsByWebhookId(String webhookId);
}
