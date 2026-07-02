package com.example.outletmanagement.controller;

import com.example.outletmanagement.model.entity.EmailQueue;
import com.example.outletmanagement.repository.EmailQueueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/emails/queue")
@RequiredArgsConstructor
public class EmailQueueController {

    private final EmailQueueRepository repository;

    @GetMapping
    public ResponseEntity<Page<EmailQueue>> getQueue(Pageable pageable) {
        return ResponseEntity.ok(repository.findAllByOrderByCreatedAtDesc(pageable));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("pending", repository.countByStatus("PENDING"));
        stats.put("sent", repository.countByStatus("SENT"));
        stats.put("failed", repository.countByStatus("FAILED"));
        return ResponseEntity.ok(stats);
    }
}
