package com.example.outletmanagement.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.outletmanagement.model.entity.Notification;
import com.example.outletmanagement.model.enums.NotificationType;
import com.example.outletmanagement.payload.dto.NotificationDto.NotificationResponse;
import com.example.outletmanagement.repository.NotificationRepository;
import com.example.outletmanagement.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public void sendToUser(String username, NotificationType type, String title, String message) {
        log.info("Sending notification to user {}: {}", username, title);
        
        // 1. Save to database
        Notification notification = Notification.builder()
                .type(type)
                .title(title)
                .message(message)
                .targetUsername(username)
                .read(false)
                .build();
        
        Notification saved = notificationRepository.save(notification);
        
        // 2. Broadcast via WebSocket
        NotificationResponse response = NotificationResponse.fromEntity(saved);
        messagingTemplate.convertAndSendToUser(
                username, 
                "/queue/notifications", 
                response
        );
    }

    @Override
    @Transactional
    public void sendToRole(String role, NotificationType type, String title, String message) {
        log.info("Sending notification to role {}: {}", role, title);
        
        // 1. Save to database
        Notification notification = Notification.builder()
                .type(type)
                .title(title)
                .message(message)
                .targetRole(role)
                .read(false)
                .build();
        
        Notification saved = notificationRepository.save(notification);
        
        // 2. Broadcast via WebSocket
        NotificationResponse response = NotificationResponse.fromEntity(saved);
        messagingTemplate.convertAndSend(
                "/topic/role/" + role, 
                response
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotificationsForUser(String username, String role, Pageable pageable) {
        return notificationRepository.findForUserAndRole(username, role, pageable)
                .map(NotificationResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCountForUser(String username, String role) {
        return notificationRepository.countUnreadForUserAndRole(username, role);
    }

    @Override
    @Transactional
    public void markAllReadForUser(String username, String role) {
        notificationRepository.markAllReadForUserAndRole(username, role);
    }

    @Override
    @Transactional
    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void markSingleRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }
}
