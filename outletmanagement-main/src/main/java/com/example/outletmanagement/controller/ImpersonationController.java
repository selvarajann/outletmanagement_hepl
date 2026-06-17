package com.example.outletmanagement.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.outletmanagement.annotation.AuditAction;
import com.example.outletmanagement.payload.dto.ImpersonationDto.ImpersonationResponse;
import com.example.outletmanagement.payload.dto.ImpersonationDto.ImpersonationSessionDto;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.ImpersonationService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/impersonate")
@RequiredArgsConstructor
public class ImpersonationController {

    private final ImpersonationService impersonationService;

    @PostMapping("/start/{targetUserId}")
    @AuditAction(action = "IMPERSONATION_START", entity = "User")
    public ResponseEntity<ApiResponse<ImpersonationResponse>> startImpersonation(
            @RequestAttribute("authenticatedUsername") String adminUsername,
            @PathVariable Long targetUserId,
            HttpServletRequest request) {
        
        String ipAddress = request.getRemoteAddr();
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            ipAddress = forwardedFor.split(",")[0];
        }

        ImpersonationResponse response = impersonationService.startImpersonation(adminUsername, targetUserId, ipAddress);

        return ResponseEntity.ok(new ApiResponse<>(true, "Impersonation started successfully", response));
    }

    @PostMapping("/end")
    @AuditAction(action = "IMPERSONATION_END", entity = "User")
    public ResponseEntity<ApiResponse<Void>> endImpersonation(
            @RequestAttribute("authenticatedUsername") String adminUsername) {

        impersonationService.endImpersonation(adminUsername);

        return ResponseEntity.ok(new ApiResponse<>(true, "Impersonation ended successfully", null));
    }

    @GetMapping("/sessions/active")
    public ResponseEntity<ApiResponse<List<ImpersonationSessionDto>>> getActiveSessions() {
        List<ImpersonationSessionDto> sessions = impersonationService.getActiveSessions();
        return ResponseEntity.ok(new ApiResponse<>(true, "Active impersonation sessions fetched", sessions));
    }

    @GetMapping("/sessions/history")
    public ResponseEntity<ApiResponse<List<ImpersonationSessionDto>>> getSessionHistory(
            @RequestParam(required = false) String targetUsername) {
        List<ImpersonationSessionDto> history = impersonationService.getSessionHistory(targetUsername);
        return ResponseEntity.ok(new ApiResponse<>(true, "Impersonation history fetched", history));
    }

    @GetMapping("/sessions/me")
    public ResponseEntity<ApiResponse<ImpersonationSessionDto>> getMyActiveSession(
            @RequestAttribute("authenticatedUsername") String adminUsername) {
        ImpersonationSessionDto session = impersonationService.getMyActiveSession(adminUsername);
        return ResponseEntity.ok(new ApiResponse<>(true, "Current impersonation session fetched", session));
    }
}
