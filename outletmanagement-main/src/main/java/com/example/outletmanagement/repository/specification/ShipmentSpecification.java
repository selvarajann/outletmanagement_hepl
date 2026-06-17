package com.example.outletmanagement.repository.specification;

import com.example.outletmanagement.model.entity.Shipment;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;

public class ShipmentSpecification {

    public static Specification<Shipment> hasKeyword(String keyword) {
        return (root, query, builder) -> {
            if (!StringUtils.hasText(keyword)) return null;
            String likePattern = "%" + keyword.toLowerCase() + "%";
            return builder.or(
                    builder.like(builder.lower(root.get("shipmentCode")), likePattern),
                    builder.like(builder.lower(root.get("imsReferenceCode")), likePattern),
                    builder.like(builder.lower(root.get("notes")), likePattern)
            );
        };
    }

    public static Specification<Shipment> hasOutletId(Long outletId) {
        return (root, query, builder) -> {
            if (outletId == null) return null;
            return builder.equal(root.get("outlet").get("id"), outletId);
        };
    }

    public static Specification<Shipment> hasStatus(String status) {
        return (root, query, builder) -> {
            if (!StringUtils.hasText(status)) return null;
            return builder.equal(root.get("status"), status);
        };
    }

    public static Specification<Shipment> isBetweenDates(LocalDate fromDate, LocalDate toDate) {
        return (root, query, builder) -> {
            if (fromDate != null && toDate != null) {
                return builder.between(root.get("dispatchDate"), fromDate, toDate);
            } else if (fromDate != null) {
                return builder.greaterThanOrEqualTo(root.get("dispatchDate"), fromDate);
            } else if (toDate != null) {
                return builder.lessThanOrEqualTo(root.get("dispatchDate"), toDate);
            }
            return null;
        };
    }
}
