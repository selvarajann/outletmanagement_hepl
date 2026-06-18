package com.example.outletmanagement.specification;

import com.example.outletmanagement.model.entity.AuditLog;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class AuditLogSpecification {

    public static Specification<AuditLog> filterBy(String entity, String businessKey, String username, LocalDateTime from, LocalDateTime to) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(entity)) {
                predicates.add(cb.equal(root.get("entity"), entity));
            }

            if (StringUtils.hasText(businessKey)) {
                predicates.add(cb.equal(root.get("businessKey"), businessKey));
            }

            if (StringUtils.hasText(username)) {
                predicates.add(cb.equal(root.get("username"), username));
            }

            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }

            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
