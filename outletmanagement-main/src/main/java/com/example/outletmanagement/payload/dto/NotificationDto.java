package com.example.outletmanagement.payload.dto;

import java.time.LocalDateTime;

import com.example.outletmanagement.model.entity.Notification;
import com.example.outletmanagement.model.enums.NotificationType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class NotificationDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationResponse {
        private Long id;
        private NotificationType type;
        private String title;
        private String message;
        private boolean read;
        private LocalDateTime createdAt;

        public static NotificationResponse fromEntity(Notification entity) {
            return NotificationResponse.builder()
                    .id(entity.getId())
                    .type(entity.getType())
                    .title(entity.getTitle())
                    .message(entity.getMessage())
                    .read(entity.isRead())
                    .createdAt(entity.getCreatedAt())
                    .build();
        }
    }
}
