package com.example.outletmanagement.util;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    private static final String SECRET_KEY = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final long JWT_TOKEN_VALIDITY = 1000 * 60 * 15; // 15 minutes
    private static final long REFRESH_TOKEN_VALIDITY = 1000 * 60 * 60 * 24 * 7; // 7 days

    @Value("${app.impersonation.token-ttl-minutes:30}")
    private long impersonationTokenTtlMinutes;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public String extractImpersonatedBy(String token) {
        return extractClaim(token, claims -> claims.get("impersonated_by", String.class));
    }

    public boolean isImpersonationToken(String token) {
        String type = extractClaim(token, claims -> claims.get("type", String.class));
        return "impersonation".equals(type);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(String username) {
        return generateToken(username, "SUPER_ADMIN"); // default fallback
    }

    public String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("type", "access");
        return createToken(claims, username, JWT_TOKEN_VALIDITY);
    }

    public String generateRefreshToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        return createToken(claims, username, REFRESH_TOKEN_VALIDITY);
    }

    public String generateImpersonationToken(String adminUsername, String targetUsername, String targetRole) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", targetRole);
        claims.put("type", "impersonation");
        claims.put("impersonated_by", adminUsername);
        return createToken(claims, targetUsername, impersonationTokenTtlMinutes * 60 * 1000);
    }

    private String createToken(Map<String, Object> claims, String subject, long validity) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + validity))
                .signWith(getSignKey())
                .compact();
    }

    private SecretKey getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public Boolean validateToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        String type = extractClaim(token, claims -> claims.get("type", String.class));
        // Backward compatibility if type is null (old tokens), otherwise check if access or impersonation
        boolean isValidType = type == null || "access".equals(type) || "impersonation".equals(type);
        return (extractedUsername.equals(username) && !isTokenExpired(token) && isValidType);
    }

    public Boolean validateRefreshToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        String type = extractClaim(token, claims -> claims.get("type", String.class));
        return (extractedUsername.equals(username) && !isTokenExpired(token) && "refresh".equals(type));
    }
}