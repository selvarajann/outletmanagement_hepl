package com.example.outletmanagement.specification;

import com.example.outletmanagement.model.entity.Stock;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public class StockSpecification {
    public static Specification<Stock> searchAndFilter(Long outletId, Long productId, String keyword) {
        return (root, query, cb) -> {
            // FIX: explicit joins prevent Hibernate cross-join generation
            Join<Object, Object> outlet = root.join("outlet", JoinType.LEFT);
            Join<Object, Object> product = root.join("product", JoinType.LEFT);

            Predicate p = cb.conjunction();
            if (outletId != null) {
                p = cb.and(p, cb.equal(outlet.get("id"), outletId));
            }
            if (productId != null) {
                p = cb.and(p, cb.equal(product.get("id"), productId));
            }
            if (StringUtils.hasText(keyword)) {
                String search = "%" + keyword.toLowerCase() + "%";
                Predicate productNameMatch = cb.like(cb.lower(product.get("name")), search);
                Predicate productCodeMatch = cb.like(cb.lower(product.get("productCode")), search);
                p = cb.and(p, cb.or(productNameMatch, productCodeMatch));
            }
            return p;
        };
    }
}
