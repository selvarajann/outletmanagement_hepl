package com.example.outletmanagement.specification;

import com.example.outletmanagement.model.entity.Batch;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import org.springframework.util.StringUtils;

import java.time.LocalDate;

public class BatchSpecification {
    public static Specification<Batch> searchAndFilter(String keyword, Long outletId, String status, LocalDate fromDate, LocalDate toDate) {
        return (root, query, cb) -> {
            Predicate p = cb.conjunction();
            if (StringUtils.hasText(keyword)) {
                String search = "%" + keyword.toLowerCase() + "%";
                Predicate codeMatch = cb.like(cb.lower(root.get("batchCode")), search);
                Predicate outletNameMatch = cb.like(cb.lower(root.get("outlet").get("outletName")), search);
                p = cb.and(p, cb.or(codeMatch, outletNameMatch));
            }
            if (outletId != null) {
                p = cb.and(p, cb.equal(root.get("outlet").get("id"), outletId));
            }
            if (StringUtils.hasText(status)) {
                p = cb.and(p, cb.equal(cb.lower(root.get("status")), status.toLowerCase()));
            }
            if (fromDate != null) {
                p = cb.and(p, cb.greaterThanOrEqualTo(root.get("receivedDate"), fromDate));
            }
            if (toDate != null) {
                p = cb.and(p, cb.lessThanOrEqualTo(root.get("receivedDate"), toDate));
            }
            return p;
        };
    }
}
