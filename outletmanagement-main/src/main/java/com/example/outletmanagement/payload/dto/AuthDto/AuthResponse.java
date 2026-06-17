package com.example.outletmanagement.payload.dto.AuthDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String refreshToken;
    
    private String username;
    private String email;
    private String role;
    private String message;

    public AuthResponse(String token, String username, String email, String role, String message) {
        this.token = token;
        this.username = username;
        this.email = email;
        this.role = role;
        this.message = message;
    }
}
