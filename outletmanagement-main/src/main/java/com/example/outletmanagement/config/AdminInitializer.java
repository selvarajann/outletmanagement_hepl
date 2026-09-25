package com.example.outletmanagement.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.outletmanagement.model.entity.Role;
import com.example.outletmanagement.model.entity.User;
import com.example.outletmanagement.repository.UserRepository;

@Component
public class AdminInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        String username = "admin";
        String email = "admin@example.com";
        String password = "password123";

        if (!userRepository.existsByUsername(username)) {
            log.info("Creating default demo admin user...");
            User admin = new User();
            admin.setUsername(username);
            admin.setEmail(email);
            admin.setPassword(passwordEncoder.encode(password));
            admin.setRole(Role.SUPER_ADMIN);
            admin.setActive(true);
            userRepository.save(admin);
            log.info("Default demo admin user created successfully.");
        } else {
            log.info("Demo admin user already exists. Overwriting password to ensure it matches Demo Login button.");
            User admin = userRepository.findByUsername(username).get();
            admin.setPassword(passwordEncoder.encode(password));
            userRepository.save(admin);
        }
    }
}
