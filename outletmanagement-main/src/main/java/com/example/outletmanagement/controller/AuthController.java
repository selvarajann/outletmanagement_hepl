package com.example.outletmanagement.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.outletmanagement.payload.dto.AuthDto.AuthResponse;
import com.example.outletmanagement.payload.dto.AuthDto.LoginRequest;
import com.example.outletmanagement.payload.dto.AuthDto.RegisterRequest;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.AuthService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@RequestBody RegisterRequest request) {

        AuthResponse response = authService.register(request);

        if (response.getToken() == null) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(
                            false,
                            response.getMessage(),
                            null
                    ));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(
                        true,
                        "Registration successful",
                        response
                ));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request) {

        AuthResponse response = authService.login(request);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Login successful",
                        response
                )
        );
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<Boolean>> validateToken(@RequestHeader("Authorization") String token) {

        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(
                            false,
                            "Invalid Authorization header",
                            false
                    ));
        }

        String jwtToken = token.substring(7);

        boolean isValid = authService.validateToken(jwtToken);

        if (isValid) {
            return ResponseEntity.ok(
                    new ApiResponse<>(
                            true,
                            "Token is valid",
                            true
                    )
            );
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(
                        false,
                        "Invalid token",
                        false
                ));
    }
}