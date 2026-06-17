package com.example.outletmanagement.service;
import com.example.outletmanagement.payload.dto.AuthDto.AuthResponse;
import com.example.outletmanagement.payload.dto.AuthDto.LoginRequest;
import com.example.outletmanagement.payload.dto.AuthDto.RegisterRequest; 
public interface AuthService {
AuthResponse register(RegisterRequest request);
AuthResponse login(LoginRequest request);
boolean validateToken(String token);
AuthResponse refresh(String refreshToken);
}
