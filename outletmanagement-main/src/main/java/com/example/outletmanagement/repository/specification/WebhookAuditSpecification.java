package com.example.outletmanagement.repository.specification;

import com.example.outletmanagement.model.entity.WebhookAudit;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public class WebhookAuditSpecification {

    public static Specification<WebhookAudit> hasKeyword(String keyword) {
        return (root, query, builder) -> {
            if (!StringUtils.hasText(keyword)) return null;
            String likePattern = "%" + keyword.toLowerCase() + "%";
            return builder.or(
                    builder.like(builder.lower(root.get("webhookId")), likePattern),
                    builder.like(builder.lower(root.get("eventType")), likePattern),
                    builder.like(builder.lower(root.get("source")), likePattern)
            );
        };
    }

    public static Specification<WebhookAudit> hasStatus(String status) {
        return (root, query, builder) -> {
            if (!StringUtils.hasText(status)) return null;
            return builder.equal(root.get("status"), status);
        };
    }
}
