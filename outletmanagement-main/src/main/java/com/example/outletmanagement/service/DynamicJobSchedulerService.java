package com.example.outletmanagement.service;

import com.example.outletmanagement.model.entity.BatchItem;
import com.example.outletmanagement.model.entity.SystemJob;
import com.example.outletmanagement.repository.BatchItemRepository;
import com.example.outletmanagement.repository.SystemJobRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ScheduledFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class DynamicJobSchedulerService {

    private final TaskScheduler taskScheduler;
    private final SystemJobRepository systemJobRepository;
    private final DailySalesReportService dailySalesReportService;
    private final BatchItemRepository batchItemRepository;

    private final Map<String, ScheduledFuture<?>> scheduledTasks = new HashMap<>();

    @PostConstruct
    public void initializeJobs() {
        log.info("Initializing dynamic cron jobs...");
        ensureDefaultJobsExist();
        
        List<SystemJob> jobs = systemJobRepository.findAll();
        for (SystemJob job : jobs) {
            if ("ACTIVE".equalsIgnoreCase(job.getStatus())) {
                scheduleJob(job);
            }
        }
    }

    private void ensureDefaultJobsExist() {
        if (systemJobRepository.count() == 0) {
            systemJobRepository.save(SystemJob.builder()
                .jobName("Daily Sales Summary Report")
                .description("Compiles today's completed sales transactions and generates a summary report. Dispatches the HTML report via email with an identical PDF attachment.")
                .cronExpression("59 22 * * *")
                .status("ACTIVE")
                .taskKey("DAILY_SALES_REPORT")
                .build());

            systemJobRepository.save(SystemJob.builder()
                .jobName("Remove Expired Items from Quarantine")
                .description("Automatically scans and safely removes quarantined items that have officially passed their expiry date.")
                .cronExpression("0 0 * * *")
                .status("ACTIVE")
                .taskKey("REMOVE_EXPIRED_QUARANTINE")
                .build());
        }
    }

    public void scheduleJob(SystemJob job) {
        cancelJob(job.getTaskKey());

        Runnable task = getRunnableForTaskKey(job.getTaskKey(), job.getId());
        if (task != null) {
            try {
                CronTrigger cronTrigger = new CronTrigger(job.getCronExpression());
                ScheduledFuture<?> future = taskScheduler.schedule(task, cronTrigger);
                scheduledTasks.put(job.getTaskKey(), future);
                log.info("Scheduled job [{}] with cron [{}]", job.getJobName(), job.getCronExpression());
            } catch (IllegalArgumentException e) {
                log.error("Invalid cron expression for job [{}]: {}", job.getJobName(), job.getCronExpression());
                // Handle invalid cron appropriately (e.g., set status to DISABLED)
            }
        }
    }

    public void cancelJob(String taskKey) {
        ScheduledFuture<?> future = scheduledTasks.get(taskKey);
        if (future != null) {
            future.cancel(false);
            scheduledTasks.remove(taskKey);
            log.info("Cancelled running job schedule for taskKey [{}]", taskKey);
        }
    }

    public void executeManualRun(String taskKey) {
        log.info("Manual execution triggered for taskKey [{}]", taskKey);
        Runnable task = getRunnableForTaskKey(taskKey, null); // Pass null ID for manual run to not update lastExecution automatically if not desired, or fetch it.
        if (task != null) {
            // Run asynchronously so we don't block the HTTP request thread
            new Thread(() -> {
                try {
                    task.run();
                } catch (Exception e) {
                    log.error("Error during manual execution of taskKey [{}]", taskKey, e);
                }
            }).start();
        } else {
            throw new IllegalArgumentException("Unknown taskKey: " + taskKey);
        }
    }

    private Runnable getRunnableForTaskKey(String taskKey, Long jobId) {
        return () -> {
            log.info("Executing logic for taskKey [{}]", taskKey);
            try {
                switch (taskKey) {
                    case "DAILY_SALES_REPORT":
                        dailySalesReportService.sendDailySalesReport("admin@outletmanagement.com");
                        break;
                    case "REMOVE_EXPIRED_QUARANTINE":
                        executeRemoveExpiredQuarantine();
                        break;
                    default:
                        log.warn("No executable logic found for taskKey [{}]", taskKey);
                }
                
                // Update last execution time
                if (jobId != null) {
                    updateLastExecution(jobId);
                }
            } catch (Exception e) {
                log.error("Job execution failed for taskKey [{}]", taskKey, e);
            }
        };
    }

    @Transactional
    protected void executeRemoveExpiredQuarantine() {
        log.info("Running job: Remove Expired Quarantine Items");
        // We will fetch items directly for this simple implementation
        // In a real app, you might page through results
        List<BatchItem> expiredItems = batchItemRepository.findExpiringBefore(LocalDate.now());
        int count = 0;
        for (BatchItem item : expiredItems) {
            if (item.isQuarantined()) {
                item.setRemainingQuantity(0);
                batchItemRepository.save(item);
                count++;
            }
        }
        log.info("Successfully removed {} expired quarantined items", count);
    }

    @Transactional
    protected void updateLastExecution(Long jobId) {
        systemJobRepository.findById(jobId).ifPresent(job -> {
            job.setLastExecution(LocalDateTime.now());
            systemJobRepository.save(job);
        });
    }
}
