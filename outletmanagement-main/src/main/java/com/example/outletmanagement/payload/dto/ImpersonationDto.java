package com.example.outletmanagement.payload.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ImpersonationDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImpersonationResponse {
        private String impersonationToken;
        private String targetUsername;
        private String targetRole;
        private LocalDateTime expiresAt;
        private Long sessionId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImpersonationSessionDto {
        private Long id;
        private String adminUsername;
        private String targetUsername;
        private String targetRole;
        private LocalDateTime startedAt;
        private LocalDateTime endedAt;
        private String endReason;
        private String ipAddress;
        private boolean active;
    }
}
