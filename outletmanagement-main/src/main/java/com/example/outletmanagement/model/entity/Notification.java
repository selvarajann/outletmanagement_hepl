package com.example.outletmanagement.model.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.example.outletmanagement.model.enums.NotificationType;

@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notification_user", columnList = "target_username"),
    @Index(name = "idx_notification_role", columnList = "target_role"),
    @Index(name = "idx_notification_read", columnList = "is_read")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    // Optional: target specific username
    @Column(name = "target_username")
    private String targetUsername;

    // Optional: target specific role (e.g. SUPER_ADMIN)
    @Column(name = "target_role")
    private String targetRole;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    /** Phase 13: Deep-link support — frontend uses this to navigate to the related entity. */
    @Column(name = "reference_id")
    private Long referenceId;

    /** Phase 13: Deep-link type, e.g. 'BATCH_ITEM', 'SHIPMENT', 'STOCK_ORDER'. */
    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
