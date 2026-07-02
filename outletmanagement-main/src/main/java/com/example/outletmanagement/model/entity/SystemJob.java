package com.example.outletmanagement.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String jobName;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private String cronExpression;

    @Column(nullable = false)
    private String status; // ACTIVE, DISABLED

    private LocalDateTime lastExecution;

    private LocalDateTime nextScheduled;

    @Column(nullable = false, unique = true)
    private String taskKey; // Identifier to map to a Java Runnable (e.g. "DAILY_SALES_REPORT")

}
