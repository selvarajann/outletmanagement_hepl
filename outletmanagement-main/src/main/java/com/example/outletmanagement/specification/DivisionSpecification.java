package com.example.outletmanagement.specification;

import org.springframework.data.jpa.domain.Specification;

import com.example.outletmanagement.model.entity.Division;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;

public class DivisionSpecification {

    public static Specification<Division> searchAndFilter(String keyword, Boolean hasProducts) {
        return (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (keyword != null && !keyword.isBlank()) {
                predicate = cb.and(predicate,
                        cb.like(cb.lower(root.get("name")), "%" + keyword.toLowerCase() + "%"));
            }

            if (hasProducts != null) {
                Subquery<Long> sub = query.subquery(Long.class);
                var productRoot = sub.from(com.example.outletmanagement.model.entity.Products.class);
                sub.select(cb.count(productRoot))
                   .where(cb.equal(productRoot.get("division"), root));

                if (hasProducts) {
                    predicate = cb.and(predicate, cb.greaterThan(sub, 0L));
                } else {
                    predicate = cb.and(predicate, cb.equal(sub, 0L));
                }
            }

            return predicate;
        };
    }
}
