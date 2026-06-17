package com.example.outletmanagement.model.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "impersonation_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpersonationSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_username", nullable = false)
    private String adminUsername;

    @Column(name = "target_username", nullable = false)
    private String targetUsername;

    @Column(name = "target_role", nullable = false)
    private String targetRole;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "end_reason")
    private String endReason;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "session_token", length = 500)
    private String sessionToken;

    @Column(nullable = false)
    private boolean active;
}
