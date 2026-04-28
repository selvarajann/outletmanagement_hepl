package com.example.outletmanagement.specification;

import org.springframework.data.jpa.domain.Specification;

import com.example.outletmanagement.model.entity.Outlet;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;

public class OutletSpecification {

    public static Specification<Outlet> searchAndFilter(
            String keyword,
            Long locationId,
            Long divisionId,
            String outletType) {

        return (root, query, cb) -> {
            query.distinct(true);
            Predicate predicate = cb.conjunction();

            if (keyword != null && !keyword.isBlank()) {
                Predicate byName = cb.like(cb.lower(root.get("outletName")), "%" + keyword.toLowerCase() + "%");
                Predicate byCode = cb.like(cb.lower(root.get("outletCode")), "%" + keyword.toLowerCase() + "%");
                Predicate byOwner = cb.like(cb.lower(root.get("ownerName")), "%" + keyword.toLowerCase() + "%");
                predicate = cb.and(predicate, cb.or(byName, byCode, byOwner));
            }

            if (locationId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("location").get("id"), locationId));
            }

            if (divisionId != null) {
                Join<Object, Object> mappingJoin = root.join("mappings");
                Join<Object, Object> divisionJoin = mappingJoin.join("division");
                predicate = cb.and(predicate, cb.equal(divisionJoin.get("id"), divisionId));
            }

            if (outletType != null && !outletType.isBlank()) {
                predicate = cb.and(predicate, cb.equal(root.get("outletType"), outletType));
            }

            return predicate;
        };
    }
}
