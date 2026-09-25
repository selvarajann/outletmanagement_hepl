package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.FcmToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FcmTokenRepository extends JpaRepository<FcmToken, Long> {
    List<FcmToken> findByUsername(String username);
    Optional<FcmToken> findByToken(String token);
    void deleteByToken(String token);
}
