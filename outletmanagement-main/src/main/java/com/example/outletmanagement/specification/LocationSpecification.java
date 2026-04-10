package com.example.outletmanagement.specification;

import org.springframework.data.jpa.domain.Specification;
import com.example.outletmanagement.model.entity.Location;

public class LocationSpecification {

    public static Specification<Location> searchByName(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isEmpty()) return cb.conjunction();
            return cb.like(cb.lower(root.get("name")), "%" + keyword.toLowerCase() + "%");
        };
    }
}
