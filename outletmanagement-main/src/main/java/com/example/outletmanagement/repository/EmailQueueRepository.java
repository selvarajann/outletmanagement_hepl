package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.EmailQueue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailQueueRepository extends JpaRepository<EmailQueue, Long> {
    List<EmailQueue> findTop20ByStatusOrderByCreatedAtAsc(String status);
    Page<EmailQueue> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByStatus(String status);
}
