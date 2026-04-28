package com.example.outletmanagement.service.impl;
import java.time.LocalDateTime;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.outletmanagement.model.entity.Login;
import com.example.outletmanagement.payload.dto.AuthDto.AuthResponse;
import com.example.outletmanagement.payload.dto.AuthDto.LoginRequest;
import com.example.outletmanagement.payload.dto.AuthDto.RegisterRequest;
import com.example.outletmanagement.repository.LoginRepository;
import com.example.outletmanagement.service.AuthService;
import com.example.outletmanagement.util.JwtUtil;

import lombok.Data;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Data
public class AuthServiceImpl implements AuthService {

    private final LoginRepository loginRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public AuthResponse register(RegisterRequest request) {
        
        if (loginRepository.existsByUsername(request.getUsername())) {
            return new AuthResponse(null, null, null, "Username already exists");
        }
        
        if (loginRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse(null, null, null, "Email already exists");
        }

        Login login = new Login();
        login.setUsername(request.getUsername());
        login.setPassword(passwordEncoder.encode(request.getPassword()));
        login.setEmail(request.getEmail());
        login.setActive(true);
        login.setCreatedAt(LocalDateTime.now());

        loginRepository.save(login);

        String token = jwtUtil.generateToken(login.getUsername());

        return new AuthResponse(
            token,
            login.getUsername(),
            login.getEmail(),
            "Registration successful"
        );
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        
        Login login = loginRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));
                System.out.println("User found: " + login.getUsername());
        System.out.println("Password match: " + passwordEncoder.matches(request.getPassword(), login.getPassword()));
        System.out.println("User active: " + login.isActive());

        if (!passwordEncoder.matches(request.getPassword(), login.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        if (!login.isActive()) {
            throw new RuntimeException("Account is inactive");
        }

        login.setLastLogin(LocalDateTime.now());
        loginRepository.save(login);

        String token = jwtUtil.generateToken(login.getUsername());

        return new AuthResponse(
            token,
            login.getUsername(),
            login.getEmail(),
            "Login successful"
        );
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
}