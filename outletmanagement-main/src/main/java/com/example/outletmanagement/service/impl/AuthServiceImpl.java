package com.example.outletmanagement.service.impl;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.outletmanagement.model.entity.User;
import com.example.outletmanagement.model.enums.NotificationType;
import com.example.outletmanagement.payload.dto.AuthDto.AuthResponse;
import com.example.outletmanagement.payload.dto.AuthDto.LoginRequest;
import com.example.outletmanagement.payload.dto.AuthDto.RegisterRequest;
import com.example.outletmanagement.repository.UserRepository;
import com.example.outletmanagement.service.AuthService;
import com.example.outletmanagement.service.EmailService;
import com.example.outletmanagement.service.NotificationService;
import com.example.outletmanagement.util.JwtUtil;

import lombok.Data;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Data
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public AuthResponse register(RegisterRequest request) {
        
        if (userRepository.existsByUsername(request.getUsername())) {
            return new AuthResponse(null, null, null, null, "Username already exists");
        }
        
        if (userRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse(null, null, null, null, "Email already exists");
        }

        User login = new User();
        login.setUsername(request.getUsername());
        login.setPassword(passwordEncoder.encode(request.getPassword()));
        login.setEmail(request.getEmail());
        login.setActive(true);
        if (request.getRole() != null) {
            try {
                login.setRole(com.example.outletmanagement.model.entity.Role.valueOf(request.getRole()));
            } catch(Exception e) {
                login.setRole(com.example.outletmanagement.model.entity.Role.SUPER_ADMIN);
            }
        }
        login.setCreatedAt(LocalDateTime.now());

        userRepository.save(login);

        String token = jwtUtil.generateToken(login.getUsername(), login.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(login.getUsername());

        // Notify SUPER_ADMIN via WebSocket
        try {
            String msg = String.format("New user registered: %s (%s) with role %s",
                    login.getUsername(), login.getEmail(), login.getRole().name());
            notificationService.sendToRole("SUPER_ADMIN", NotificationType.NEW_USER_REGISTERED, "New User Registration", msg);
        } catch (Exception e) {
            log.warn("Failed to send WebSocket notification for new user registration: {}", e.getMessage());
        }

        // ── Mailtrap Emails ──────────────────────────────────────────────────
        emailService.sendWelcomeEmail(login.getEmail(), login.getUsername(), login.getRole().name());
        emailService.sendNewUserRegisteredAlert(
                "admin@outletmanagement.com",   // replace with actual admin email
                login.getUsername(), login.getEmail(), login.getRole().name());

        AuthResponse authResponse = new AuthResponse(
            token,
            login.getUsername(),
            login.getEmail(),
            login.getRole().name(),
            "Registration successful"
        );
        authResponse.setRefreshToken(refreshToken);
        return authResponse;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        
        User login = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));
        log.debug("Login attempt for user: {}", login.getUsername());

        if (!passwordEncoder.matches(request.getPassword(), login.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        if (!login.isActive()) {
            throw new RuntimeException("Account is inactive");
        }

        login.setLastLogin(LocalDateTime.now());
        userRepository.save(login);

        String token = jwtUtil.generateToken(login.getUsername(), login.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(login.getUsername());

        // ── Mailtrap Email ───────────────────────────────────────────────────
        emailService.sendLoginNotification(login.getEmail(), login.getUsername());

        AuthResponse authResponse = new AuthResponse(
            token,
            login.getUsername(),
            login.getEmail(),
            login.getRole().name(),
            "Login successful"
        );
        authResponse.setRefreshToken(refreshToken);
        return authResponse;
    }

    @Override
    public boolean validateToken(String token) {
        try {
            String username = jwtUtil.extractUsername(token);
            return jwtUtil.validateToken(token, username);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public AuthResponse refresh(String refreshToken) {
        try {
            String username = jwtUtil.extractUsername(refreshToken);
            if (jwtUtil.validateRefreshToken(refreshToken, username)) {
                User login = userRepository.findByUsername(username)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                
                if (!login.isActive()) {
                    throw new RuntimeException("Account is inactive");
                }

                String newAccessToken = jwtUtil.generateToken(login.getUsername(), login.getRole().name());
                String newRefreshToken = jwtUtil.generateRefreshToken(login.getUsername());
                
                AuthResponse authResponse = new AuthResponse(
                    newAccessToken,
                    login.getUsername(),
                    login.getEmail(),
                    login.getRole().name(),
                    "Token refreshed successfully"
                );
                authResponse.setRefreshToken(newRefreshToken);
                return authResponse;
            }
        } catch (Exception e) {
            // Token invalid or expired
        }
        throw new RuntimeException("Invalid refresh token");
    }
}