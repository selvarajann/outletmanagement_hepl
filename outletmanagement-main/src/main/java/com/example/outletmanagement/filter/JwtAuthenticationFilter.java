package com.example.outletmanagement.filter;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.outletmanagement.util.JwtUtil;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        System.out.println("REQUEST URI = " + path);

        // CORS is handled exclusively by CorsConfig — do NOT set headers here.
        // Duplicate headers cause browsers to reject Set-Cookie on cross-origin responses.

        if ("OPTIONS".equalsIgnoreCase(method)) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }
     
        if (path.contains("/api/v1/auth/login") || 
            path.contains("/api/v1/auth/register") ||
            path.contains("/api/v1/auth/validate") ||
            path.contains("/api/v1/auth/refresh") ||
            path.contains("/api/v1/auth/logout") ||
            path.contains("/api/test-scheduler") ||
            path.contains("/api/webhook/ims/dispatch") ||
            path.contains("/swagger-ui") ||
            path.contains("/v3/api-docs") ||
            path.contains("/swagger-resources") ||
            path.contains("/webjars")) {
            if (path.contains("/api/webhook/ims/dispatch")) {
                System.out.println("WEBHOOK EXCLUDED");
            }
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(token);
            } catch (Exception e) {
                log.warn("JWT parse error for path {}: {}", path, e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"status\":401,\"message\":\"Invalid or expired token\",\"data\":null}");
                return;
            }
        }

        if (username != null && jwtUtil.validateToken(token, username)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"status\":401,\"message\":\"Unauthorized - Token required\",\"data\":null}");
        }
    }
}