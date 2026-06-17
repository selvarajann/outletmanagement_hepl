package com.example.outletmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Application entry point.
 * <p>
 * {@code @EnableAsync}       — activates Spring's async executor, required by {@code AuditLogService}.
 * {@code @EnableScheduling}  — activates cron scheduler, required by {@code AuditCleanupScheduler}.
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
		System.out.println("hi");
	}
}
