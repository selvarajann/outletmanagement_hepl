package com.example.outletmanagement.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import com.example.outletmanagement.service.ReconciliationScheduler;
import com.example.outletmanagement.service.DeadLetterAlertScheduler;
import com.example.outletmanagement.service.ExpiryNotificationScheduler;

@RestController
@RequestMapping("/api/test-scheduler")
@RequiredArgsConstructor
public class TestController {

    private final ReconciliationScheduler reconciliationScheduler;
    private final DeadLetterAlertScheduler deadLetterAlertScheduler;
    private final ExpiryNotificationScheduler expiryNotificationScheduler;

    @GetMapping("/reconciliation")
    public String triggerReconciliation() {
        reconciliationScheduler.runNightlyReconciliation();
        return "Reconciliation Triggered";
    }

    @GetMapping("/dead-letter")
    public String triggerDeadLetter() {
        deadLetterAlertScheduler.alertOnDeadLetters();
        return "Dead Letter Alert Triggered";
    }

    @GetMapping("/expiry")
    public String triggerExpiry() {
        expiryNotificationScheduler.notifyExpiringStock();
        return "Expiry Notification Triggered";
    }
}
