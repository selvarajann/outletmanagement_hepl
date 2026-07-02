package com.example.outletmanagement.filter;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.example.outletmanagement.util.JwtUtil;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RoleAuthorizationFilter implements Filter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();

        // Extract username from JWT and store as request attribute for AuditInterceptor
        String authHeader = httpRequest.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                String username = jwtUtil.extractUsername(token);
                if (username != null) {
                    // Set attribute so AuditInterceptor can read the authenticated username
                    httpRequest.setAttribute("authenticatedUsername", username);
                    
                    String impersonatedBy = jwtUtil.extractImpersonatedBy(token);
                    if (impersonatedBy != null) {
                        httpRequest.setAttribute("impersonatedBy", impersonatedBy);
                    }
                }
            } catch (Exception ignored) {
                // Token parse failure is handled by JwtAuthenticationFilter upstream
            }
        }

        // Restrict user management, audit log, and impersonation endpoints to SUPER_ADMIN only
        if (path.startsWith("/api/v1/users") || path.startsWith("/api/v1/audit-logs") || path.startsWith("/api/v1/admin/impersonate")) {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    String role = jwtUtil.extractRole(token);
                    if (!"SUPER_ADMIN".equals(role)) {
                        httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        httpResponse.getWriter().write("{\"success\":false,\"message\":\"Access Denied: Requires SUPER_ADMIN role\"}");
                        return;
                    }

                    if (jwtUtil.isImpersonationToken(token) && 
                        (path.startsWith("/api/v1/users") || path.startsWith("/api/v1/admin/impersonate"))) {
                        httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        httpResponse.getWriter().write("{\"success\":false,\"message\":\"Access Denied: Action not allowed during impersonation\"}");
                        return;
                    }
                } catch (Exception e) {
                    httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    httpResponse.getWriter().write("{\"success\":false,\"message\":\"Invalid Token\"}");
                    return;
                }
            } else {
                httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                httpResponse.getWriter().write("{\"success\":false,\"message\":\"Missing Token\"}");
                return;
            }
        }

        // Restrict warehouse products to INVENTORY_MANAGER only
        if (path.startsWith("/api/v1/warehouse-products")) {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    String role = jwtUtil.extractRole(token);
                    if (!"INVENTORY_MANAGER".equals(role)) {
                        httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        httpResponse.getWriter().write("{\"success\":false,\"message\":\"Access Denied: Requires INVENTORY_MANAGER role\"}");
                        return;
                    }
                } catch (Exception e) {
                    httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    httpResponse.getWriter().write("{\"success\":false,\"message\":\"Invalid Token\"}");
                    return;
                }
            } else {
                httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                httpResponse.getWriter().write("{\"success\":false,\"message\":\"Missing Token\"}");
                return;
            }
        }
        
        chain.doFilter(request, response);
    }
}
