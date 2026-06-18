package com.example.outletmanagement.repository.specification;

import com.example.outletmanagement.model.entity.StockReturn;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

public class StockReturnSpecification {

    public static Specification<StockReturn> hasKeyword(String keyword) {
        return (root, query, builder) -> {
            if (!StringUtils.hasText(keyword)) return null;
            String likePattern = "%" + keyword.toLowerCase() + "%";
            return builder.or(
                    builder.like(builder.lower(root.get("returnCode")), likePattern),
                    builder.like(builder.lower(root.get("imsAckCode")), likePattern),
                    builder.like(builder.lower(root.get("reason")), likePattern)
            );
        };
    }

    public static Specification<StockReturn> hasOutletId(Long outletId) {
        return (root, query, builder) -> {
            if (outletId == null) return null;
            return builder.equal(root.get("outlet").get("id"), outletId);
        };
    }

    public static Specification<StockReturn> hasStatus(String status) {
        return (root, query, builder) -> {
            if (!StringUtils.hasText(status)) return null;
            try {
                return builder.equal(root.get("status"), com.example.outletmanagement.model.enums.StockReturnStatus.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                return null;
            }
        };
    }
    
    public static Specification<StockReturn> isBetweenDates(LocalDateTime fromDate, LocalDateTime toDate) {
        return (root, query, builder) -> {
            if (fromDate != null && toDate != null) {
                return builder.between(root.get("createdAt"), fromDate, toDate);
            } else if (fromDate != null) {
                return builder.greaterThanOrEqualTo(root.get("createdAt"), fromDate);
            } else if (toDate != null) {
                return builder.lessThanOrEqualTo(root.get("createdAt"), toDate);
            }
            return null;
        };
    }
}
