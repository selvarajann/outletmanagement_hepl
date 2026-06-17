package com.example.outletmanagement.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.outletmanagement.model.entity.ImpersonationSession;

@Repository
public interface ImpersonationSessionRepository extends JpaRepository<ImpersonationSession, Long> {

    Optional<ImpersonationSession> findByAdminUsernameAndActiveTrue(String adminUsername);

    List<ImpersonationSession> findAllByTargetUsername(String targetUsername);

    List<ImpersonationSession> findAllByOrderByStartedAtDesc();

    List<ImpersonationSession> findByActiveTrue();
}
