package com.example.outletmanagement.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "webhook_audits")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WebhookAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String webhookId; // Used for idempotency

    @Column(nullable = false)
    private String source; // e.g., "IMS"

    @Column(nullable = false)
    private String eventType; // e.g., "DISPATCH"

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(nullable = false)
    private String status; // SUCCESS, FAILED, PROCESSING

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
