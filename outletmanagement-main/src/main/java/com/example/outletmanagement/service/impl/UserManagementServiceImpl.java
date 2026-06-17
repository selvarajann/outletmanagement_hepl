package com.example.outletmanagement.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.outletmanagement.model.entity.Role;
import com.example.outletmanagement.model.entity.User;
import com.example.outletmanagement.payload.dto.UserDto.UserRequest;
import com.example.outletmanagement.payload.dto.UserDto.UserResponse;
import com.example.outletmanagement.repository.UserRepository;
import com.example.outletmanagement.service.EmailService;
import com.example.outletmanagement.service.UserManagementService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponse createUser(UserRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setActive(request.isActive());
        user.setRole(Role.valueOf(request.getRole() != null ? request.getRole() : "SUPER_ADMIN"));
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendUserCreatedEmail(
                savedUser.getEmail(), savedUser.getUsername(),
                savedUser.getRole().name(), request.getPassword()); // raw password before encoding

        return mapToResponse(savedUser);
    }

    @Override
    public UserResponse updateUser(Long id, UserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getRole() != null) {
            user.setRole(Role.valueOf(request.getRole()));
        }
        user.setActive(request.isActive());

        // Update password if provided
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        user.setUpdatedAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendUserUpdatedEmail(
                updatedUser.getEmail(), updatedUser.getUsername(),
                updatedUser.getRole().name(), updatedUser.isActive());

        return mapToResponse(updatedUser);
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        // Soft delete
        user.setActive(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendUserDeactivatedEmail(user.getEmail(), user.getUsername());
    }

    private UserResponse mapToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.isActive(),
                user.getCreatedAt(),
                user.getLastLogin()
        );
    }
}
