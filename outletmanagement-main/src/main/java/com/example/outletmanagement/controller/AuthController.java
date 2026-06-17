package com.example.outletmanagement.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;

import com.example.outletmanagement.annotation.AuditAction;
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

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        if (refreshToken != null) {
            ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                    .httpOnly(true)
                    .secure(false)         // set to true in production (HTTPS)
                    .path("/")            // must be "/" so DevTools shows it and browser sends it on all requests
                    .maxAge(7 * 24 * 60 * 60)
                    .sameSite("Lax")
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }
    }

    @PostMapping("/register")
    @AuditAction(action = "REGISTER_USER", entity = "User")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@RequestBody RegisterRequest request, HttpServletResponse httpResponse) {

        AuthResponse response = authService.register(request);
        setRefreshTokenCookie(httpResponse, response.getRefreshToken());

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
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request, HttpServletResponse httpResponse) {

        AuthResponse response = authService.login(request);
        setRefreshTokenCookie(httpResponse, response.getRefreshToken());

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Login successful",
                        response
                )
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse httpResponse) {
        // Clear the HttpOnly refresh token cookie by setting maxAge to 0
        ResponseCookie expiredCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        httpResponse.addHeader(HttpHeaders.SET_COOKIE, expiredCookie.toString());
        return ResponseEntity.ok(new ApiResponse<>(true, "Logged out successfully", null));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@CookieValue(name = "refreshToken", required = false) String refreshToken, HttpServletResponse httpResponse) {
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Refresh token is missing", null));
        }

        try {
            AuthResponse response = authService.refresh(refreshToken);
            setRefreshTokenCookie(httpResponse, response.getRefreshToken());
            return ResponseEntity.ok(new ApiResponse<>(true, "Token refreshed successfully", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Invalid or expired refresh token", null));
        }
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