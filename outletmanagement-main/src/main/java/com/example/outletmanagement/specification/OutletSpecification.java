package com.example.outletmanagement.specification;

import org.springframework.data.jpa.domain.Specification;

import com.example.outletmanagement.model.entity.Outlet;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;

public class OutletSpecification {

    public static Specification<Outlet> searchAndFilter(
            String keyword,
            Long locationId,
            Long divisionId
    ) {
        return (root, query, cb) -> {

            query.distinct(true);

            Predicate predicate = cb.conjunction();

            
            if (keyword != null && !keyword.isEmpty()) {

                Predicate name = cb.like(
                        cb.lower(root.get("outletName")),
                        "%" + keyword.toLowerCase() + "%"
                );

                Predicate code = cb.like(
                        cb.lower(root.get("outletCode")),
                        "%" + keyword.toLowerCase() + "%"
                );

                predicate = cb.and(predicate, cb.or(name, code));
            }   
            

            if (locationId != null) {
                predicate = cb.and(predicate,
                        cb.equal(root.get("location").get("id"), locationId));
            }

            if (divisionId != null) {
                Join<Object, Object> mappingJoin = root.join("mappings");
                Join<Object, Object> divisionJoin = mappingJoin.join("division");

                predicate = cb.and(predicate,
                        cb.equal(divisionJoin.get("id"), divisionId));
            }

            return predicate;
        };
    }
}