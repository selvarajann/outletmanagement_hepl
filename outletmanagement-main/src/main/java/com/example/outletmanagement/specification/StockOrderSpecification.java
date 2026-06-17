package com.example.outletmanagement.specification;

import com.example.outletmanagement.model.entity.StockOrder;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;

public class StockOrderSpecification {
    public static Specification<StockOrder> searchAndFilter(String keyword, Long outletId, String status, LocalDate fromDate, LocalDate toDate) {
        return (root, query, cb) -> {
            Predicate p = cb.conjunction();

            if (StringUtils.hasText(keyword) || outletId != null) {
                // FIX: explicit join prevents Hibernate cross-join on outlet navigation
                Join<Object, Object> outlet = root.join("outlet", JoinType.LEFT);
                if (StringUtils.hasText(keyword)) {
                    String search = "%" + keyword.toLowerCase() + "%";
                    Predicate codeMatch = cb.like(cb.lower(root.get("orderCode")), search);
                    Predicate outletNameMatch = cb.like(cb.lower(outlet.get("outletName")), search);
                    p = cb.and(p, cb.or(codeMatch, outletNameMatch));
                }
                if (outletId != null) {
                    p = cb.and(p, cb.equal(outlet.get("id"), outletId));
                }
            }

            if (StringUtils.hasText(status)) {
                p = cb.and(p, cb.equal(cb.lower(root.get("status")), status.toLowerCase()));
            }
            if (fromDate != null) {
                p = cb.and(p, cb.greaterThanOrEqualTo(root.get("requestedDate"), fromDate));
            }
            if (toDate != null) {
                p = cb.and(p, cb.lessThanOrEqualTo(root.get("requestedDate"), toDate));
            }
            return p;
        };
    }
}
