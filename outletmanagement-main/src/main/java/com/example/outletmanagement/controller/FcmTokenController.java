package com.example.outletmanagement.controller;

import com.example.outletmanagement.model.entity.FcmToken;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.repository.FcmTokenRepository;
import com.example.outletmanagement.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/fcm")
@RequiredArgsConstructor
@Slf4j
public class FcmTokenController {

    private final FcmTokenRepository fcmTokenRepository;
    private final JwtUtil jwtUtil;

    private String extractUsername(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                return jwtUtil.extractUsername(token);
            } catch (Exception e) {
                log.error("Failed to extract username from token", e);
            }
        }
        return "unknown";
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> registerToken(
            @RequestBody TokenRequest tokenRequest,
            HttpServletRequest request) {
        
        String username = extractUsername(request);
        String token = tokenRequest.getToken();
        String deviceInfo = tokenRequest.getDeviceInfo();

        Optional<FcmToken> existingToken = fcmTokenRepository.findByToken(token);
        
        if (existingToken.isPresent()) {
            FcmToken fcmToken = existingToken.get();
            // Update username if it changed for the same token
            if (!fcmToken.getUsername().equals(username)) {
                fcmToken.setUsername(username);
                fcmToken.setDeviceInfo(deviceInfo);
                fcmTokenRepository.save(fcmToken);
            }
        } else {
            FcmToken newToken = FcmToken.builder()
                    .username(username)
                    .token(token)
                    .deviceInfo(deviceInfo)
                    .build();
            fcmTokenRepository.save(newToken);
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "FCM token registered successfully", null));
    }

    @DeleteMapping("/unregister")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> unregisterToken(@RequestParam String token) {
        fcmTokenRepository.deleteByToken(token);
        return ResponseEntity.ok(new ApiResponse<>(true, "FCM token unregistered successfully", null));
    }

    @Data
    public static class TokenRequest {
        private String token;
        private String deviceInfo;
    }
}
