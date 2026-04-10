package com.example.outletmanagement.specification;

import org.springframework.data.jpa.domain.Specification;
import com.example.outletmanagement.model.entity.Products;
import jakarta.persistence.criteria.Predicate;

public class ProductSpecification {

    public static Specification<Products> searchAndFilter(String keyword, Long divisionId) {
        return (root, query, cb) -> {
            Predicate predicate = cb.conjunction();
            if (keyword != null && !keyword.isEmpty()) {
                predicate = cb.and(predicate,
                        cb.like(cb.lower(root.get("name")), "%" + keyword.toLowerCase() + "%"));
            }
            if (divisionId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("division").get("id"), divisionId));
            }
            return predicate;
        };
    }
}
