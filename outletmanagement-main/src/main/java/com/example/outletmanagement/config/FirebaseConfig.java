package com.example.outletmanagement.config;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.service-account-json:}")
    private String serviceAccountJson;

    @Bean
    public FirebaseApp firebaseApp() {
        try {

            // Firebase is optional when no service-account JSON is configured
            if (serviceAccountJson == null || serviceAccountJson.isBlank()) {
                log.warn("Firebase service account JSON not configured. Firebase features will be disabled.");
                return null;
            }

            java.io.InputStream inputStream;
            if (serviceAccountJson.startsWith("classpath:")) {
                String path = serviceAccountJson.substring(10);
                inputStream = getClass().getClassLoader().getResourceAsStream(path);
                if (inputStream == null) {
                    log.warn("Firebase config file not found in classpath: {}", path);
                    return null;
                }
            } else if (serviceAccountJson.startsWith("{")) {
                // It's a raw JSON string from an environment variable
                inputStream = new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8));
            } else {
                log.warn("Invalid Firebase configuration format. Must be JSON string or classpath:...");
                return null;
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(inputStream))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp app = FirebaseApp.initializeApp(options);
                log.info("Firebase initialized successfully");
                return app;
            }

            return FirebaseApp.getInstance();

        } catch (IOException e) {
            log.error("Failed to initialize Firebase", e);
            return null;
        }
    }
}