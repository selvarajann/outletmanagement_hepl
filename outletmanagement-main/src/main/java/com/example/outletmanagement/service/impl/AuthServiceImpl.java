package com.example.outletmanagement.service.impl;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.outletmanagement.model.entity.Role;
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

import com.example.outletmanagement.payload.dto.AuthDto.ForgotPasswordRequest;
import com.example.outletmanagement.payload.dto.AuthDto.ResetPasswordRequest;
import com.example.outletmanagement.payload.dto.AuthDto.ChangePasswordRequest;
import com.example.outletmanagement.model.entity.PasswordResetToken;
import com.example.outletmanagement.repository.PasswordResetTokenRepository;
import org.springframework.transaction.annotation.Transactional;

import lombok.Data;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Data
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

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
                login.setRole(Role.valueOf(request.getRole()));
            } catch(Exception e) {
                login.setRole(Role.SUPER_ADMIN);
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

    @Override
    @Transactional
    public void processForgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));
        
        passwordResetTokenRepository.findByUser(user).ifPresent(passwordResetTokenRepository::delete);

        String token = java.util.UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(token, user, LocalDateTime.now().plusMinutes(15));
        passwordResetTokenRepository.save(resetToken);

        String resetLink = frontendUrl + "/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
    }

    @Override
    @Transactional
    public void processResetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new RuntimeException("Token has expired");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        passwordResetTokenRepository.delete(resetToken);
    }

    @Override
    @Transactional
    public void changePassword(String tokenHeader, ChangePasswordRequest request) {
        if (tokenHeader == null || !tokenHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid token header");
        }
        String token = tokenHeader.substring(7);
        String username = jwtUtil.extractUsername(token);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Old password does not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        emailService.sendPasswordChangedEmail(user.getEmail(), user.getUsername());
    }
}