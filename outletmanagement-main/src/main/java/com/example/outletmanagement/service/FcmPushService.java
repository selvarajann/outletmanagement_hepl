package com.example.outletmanagement.service;

import com.example.outletmanagement.model.entity.FcmToken;
import com.example.outletmanagement.repository.FcmTokenRepository;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FcmPushService {

    private final FcmTokenRepository fcmTokenRepository;

    public void sendPushToUser(String username, String title, String body) {
        List<FcmToken> tokens = fcmTokenRepository.findByUsername(username);
        
        if (tokens.isEmpty()) {
            log.debug("No FCM tokens found for user: {}", username);
            return;
        }

        List<String> tokenStrings = tokens.stream()
                .map(FcmToken::getToken)
                .collect(Collectors.toList());

        Notification notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build();

        MulticastMessage message = MulticastMessage.builder()
                .addAllTokens(tokenStrings)
                .setNotification(notification)
                .build();

        try {
            FirebaseMessaging.getInstance().sendEachForMulticast(message);
            log.info("Successfully sent FCM push notification to user: {}", username);
        } catch (Exception e) {
            log.error("Error sending FCM push notification to user: {}", username, e);
        }
    }

    public void sendPushToAll(String title, String body) {
        // Find all tokens - in a real app you might want to page this if there are many tokens
        List<String> allTokens = fcmTokenRepository.findAll().stream()
                .map(FcmToken::getToken)
                .collect(Collectors.toList());

        if (allTokens.isEmpty()) {
            return;
        }

        Notification notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build();

        MulticastMessage message = MulticastMessage.builder()
                .addAllTokens(allTokens)
                .setNotification(notification)
                .build();

        try {
            FirebaseMessaging.getInstance().sendEachForMulticast(message);
            log.info("Successfully broadcasted FCM push notification");
        } catch (Exception e) {
            log.error("Error broadcasting FCM push notification", e);
        }
    }
}
