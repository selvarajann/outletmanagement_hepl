package com.example.outletmanagement.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.outletmanagement.payload.dto.NotificationDto.NotificationResponse;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.NotificationService;
import com.example.outletmanagement.util.JwtUtil;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;

    // Helper to extract username and role from the request (set by JwtAuthenticationFilter/RoleAuthorizationFilter)
    private UserDetails extractUserDetails(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                return new UserDetails(jwtUtil.extractUsername(token), jwtUtil.extractRole(token));
            } catch (Exception e) {
                log.error("Failed to extract user details from token", e);
            }
        }
        return new UserDetails("unknown", "unknown");
    }

    private record UserDetails(String username, String role) {}

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {

        UserDetails user = extractUserDetails(request);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<NotificationResponse> notifications = notificationService.getNotificationsForUser(
                user.username(), user.role(), pageable);

        return ResponseEntity.ok(new ApiResponse<>(true, "Notifications fetched successfully", notifications));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(HttpServletRequest request) {
        UserDetails user = extractUserDetails(request);
        long count = notificationService.getUnreadCountForUser(user.username(), user.role());
        return ResponseEntity.ok(new ApiResponse<>(true, "Unread count fetched", count));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<Void>> markAllRead(HttpServletRequest request) {
        UserDetails user = extractUserDetails(request);
        notificationService.markAllReadForUser(user.username(), user.role());
        return ResponseEntity.ok(new ApiResponse<>(true, "All notifications marked as read", null));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markSingleRead(
            @PathVariable Long id) {
        notificationService.markSingleRead(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Notification marked as read", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Notification deleted", null));
    }
}
