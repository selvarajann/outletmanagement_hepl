package com.example.outletmanagement.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.outletmanagement.model.entity.ChatConversation;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {
    List<ChatConversation> findAllByUserIdOrderByUpdatedAtDesc(String userId);
    Optional<ChatConversation> findByIdAndUserId(Long id, String userId);
}
