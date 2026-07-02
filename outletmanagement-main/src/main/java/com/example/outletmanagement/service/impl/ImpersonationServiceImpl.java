package com.example.outletmanagement.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;


import com.example.outletmanagement.model.entity.ImpersonationSession;
import com.example.outletmanagement.model.entity.User;
import com.example.outletmanagement.model.entity.Role;
import com.example.outletmanagement.payload.dto.ImpersonationDto.ImpersonationResponse;
import com.example.outletmanagement.payload.dto.ImpersonationDto.ImpersonationSessionDto;
import com.example.outletmanagement.repository.ImpersonationSessionRepository;
import com.example.outletmanagement.repository.UserRepository;
import com.example.outletmanagement.service.ImpersonationService;
import com.example.outletmanagement.util.JwtUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ImpersonationServiceImpl implements ImpersonationService {

    private final ImpersonationSessionRepository impersonationSessionRepository;
    private final UserRepository userRepository;

    private final JwtUtil jwtUtil;

    @Value("${app.impersonation.token-ttl-minutes:30}")
    private long impersonationTokenTtlMinutes;

    @Override
    public ImpersonationResponse startImpersonation(String adminUsername, Long targetUserId, String ipAddress) {
        // Prevent starting a new session if one is already active for this admin
        impersonationSessionRepository.findByAdminUsernameAndActiveTrue(adminUsername).ifPresent(session -> {
            throw new IllegalStateException("Admin is already impersonating a user. End current session first.");
        });

        com.example.outletmanagement.model.entity.User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + targetUserId));

        if (!targetUser.isActive()) {
            throw new IllegalStateException("Cannot impersonate an inactive user.");
        }

        if (Role.SUPER_ADMIN.equals(targetUser.getRole())) {
            throw new IllegalStateException("Cannot impersonate a SUPER_ADMIN.");
        }

        String targetUsername = targetUser.getUsername();
        String targetRole = targetUser.getRole().name();

        String token = jwtUtil.generateImpersonationToken(adminUsername, targetUsername, targetRole);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(impersonationTokenTtlMinutes);

        ImpersonationSession session = ImpersonationSession.builder()
                .adminUsername(adminUsername)
                .targetUsername(targetUsername)
                .targetRole(targetRole)
                .startedAt(now)
                .ipAddress(ipAddress)
                .sessionToken("HASH-" + token.hashCode()) // simple hash to track which token
                .active(true)
                .build();

        session = impersonationSessionRepository.save(session);

        return ImpersonationResponse.builder()
                .impersonationToken(token)
                .targetUsername(targetUsername)
                .targetRole(targetRole)
                .expiresAt(expiresAt)
                .sessionId(session.getId())
                .build();
    }

    @Override
    public void endImpersonation(String adminUsername) {
        ImpersonationSession session = impersonationSessionRepository.findByAdminUsernameAndActiveTrue(adminUsername)
                .orElseThrow(() -> new IllegalStateException("No active impersonation session found for admin: " + adminUsername));

        session.setActive(false);
        session.setEndedAt(LocalDateTime.now());
        session.setEndReason("MANUAL_EXIT");

        impersonationSessionRepository.save(session);
    }

    @Override
    public List<ImpersonationSessionDto> getActiveSessions() {
        return impersonationSessionRepository.findByActiveTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ImpersonationSessionDto> getSessionHistory(String targetUsername) {
        List<ImpersonationSession> sessions;
        if (targetUsername != null && !targetUsername.isEmpty()) {
            sessions = impersonationSessionRepository.findAllByTargetUsername(targetUsername);
        } else {
            sessions = impersonationSessionRepository.findAllByOrderByStartedAtDesc();
        }
        return sessions.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public ImpersonationSessionDto getMyActiveSession(String adminUsername) {
        Optional<ImpersonationSession> session = impersonationSessionRepository.findByAdminUsernameAndActiveTrue(adminUsername);
        return session.map(this::mapToDto).orElse(null);
    }

    private ImpersonationSessionDto mapToDto(ImpersonationSession session) {
        return ImpersonationSessionDto.builder()
                .id(session.getId())
                .adminUsername(session.getAdminUsername())
                .targetUsername(session.getTargetUsername())
                .targetRole(session.getTargetRole())
                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .endReason(session.getEndReason())
                .ipAddress(session.getIpAddress())
                .active(session.isActive())
                .build();
    }
}
