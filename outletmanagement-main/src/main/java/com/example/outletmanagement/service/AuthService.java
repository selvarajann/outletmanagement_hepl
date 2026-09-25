package com.example.outletmanagement.service;
import com.example.outletmanagement.payload.dto.AuthDto.AuthResponse;
import com.example.outletmanagement.payload.dto.AuthDto.LoginRequest;
import com.example.outletmanagement.payload.dto.AuthDto.RegisterRequest; 
import com.example.outletmanagement.payload.dto.AuthDto.ChangePasswordRequest;
import com.example.outletmanagement.payload.dto.AuthDto.ForgotPasswordRequest;
import com.example.outletmanagement.payload.dto.AuthDto.ResetPasswordRequest;

public interface AuthService {
AuthResponse register(RegisterRequest request);
AuthResponse login(LoginRequest request);
boolean validateToken(String token);
AuthResponse refresh(String refreshToken);
void processForgotPassword(ForgotPasswordRequest request);
void processResetPassword(ResetPasswordRequest request);
void changePassword(String tokenHeader, ChangePasswordRequest request);
}
