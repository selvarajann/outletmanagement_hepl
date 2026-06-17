package com.example.outletmanagement.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.outletmanagement.model.enums.NotificationType;
import com.example.outletmanagement.payload.dto.NotificationDto.NotificationResponse;

public interface NotificationService {

    /**
     * Sends a notification to a specific user.
     */
    void sendToUser(String username, NotificationType type, String title, String message);

    /**
     * Sends a notification to all users with a specific role.
     */
    void sendToRole(String role, NotificationType type, String title, String message);

    /**
     * Gets paginated notifications for a user based on their username and role.
     */
    Page<NotificationResponse> getNotificationsForUser(String username, String role, Pageable pageable);

    /**
     * Gets the count of unread notifications for a user based on their username and role.
     */
    long getUnreadCountForUser(String username, String role);

    /**
     * Marks all notifications as read for a specific user and their role.
     */
    void markAllReadForUser(String username, String role);

    /**
     * Deletes a specific notification.
     */
    void deleteNotification(Long id);
}
