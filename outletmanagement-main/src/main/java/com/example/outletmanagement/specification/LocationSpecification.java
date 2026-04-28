package com.example.outletmanagement.specification;

import org.springframework.data.jpa.domain.Specification;

import com.example.outletmanagement.model.entity.Location;

import jakarta.persistence.criteria.Predicate;

public class LocationSpecification {

    public static Specification<Location> searchAndFilter(String keyword) {
        return (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (keyword != null && !keyword.isBlank()) {
                predicate = cb.and(predicate,
                        cb.like(cb.lower(root.get("name")), "%" + keyword.toLowerCase() + "%"));
            }

            return predicate;
        };
    }
}
