package com.example.outletmanagement.controller;

import com.example.outletmanagement.model.entity.SystemJob;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.repository.SystemJobRepository;
import com.example.outletmanagement.service.DailySalesReportService;
import com.example.outletmanagement.service.DynamicJobSchedulerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class SystemJobController {

    private final DailySalesReportService dailySalesReportService;
    private final DynamicJobSchedulerService dynamicJobSchedulerService;
    private final SystemJobRepository systemJobRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SystemJob>>> getAllJobs() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Jobs fetched successfully", systemJobRepository.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SystemJob>> createJob(@RequestBody SystemJob job) {
        job.setStatus("ACTIVE");
        SystemJob savedJob = systemJobRepository.save(job);
        dynamicJobSchedulerService.scheduleJob(savedJob);
        return ResponseEntity.ok(new ApiResponse<>(true, "Job created successfully", savedJob));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SystemJob>> updateJob(@PathVariable Long id, @RequestBody SystemJob jobDetails) {
        SystemJob job = systemJobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        job.setJobName(jobDetails.getJobName());
        job.setDescription(jobDetails.getDescription());
        job.setCronExpression(jobDetails.getCronExpression());
        job.setStatus(jobDetails.getStatus());
        job.setTaskKey(jobDetails.getTaskKey());

        SystemJob updatedJob = systemJobRepository.save(job);

        if ("ACTIVE".equalsIgnoreCase(updatedJob.getStatus())) {
            dynamicJobSchedulerService.scheduleJob(updatedJob);
        } else {
            dynamicJobSchedulerService.cancelJob(updatedJob.getTaskKey());
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Job updated successfully", updatedJob));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteJob(@PathVariable Long id) {
        SystemJob job = systemJobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        dynamicJobSchedulerService.cancelJob(job.getTaskKey());
        systemJobRepository.delete(job);

        return ResponseEntity.ok(new ApiResponse<>(true, "Job deleted successfully", null));
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<ApiResponse<String>> runJobManually(@PathVariable Long id) {
        SystemJob job = systemJobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        
        dynamicJobSchedulerService.executeManualRun(job.getTaskKey());
        return ResponseEntity.ok(new ApiResponse<>(true, "Job execution triggered successfully", null));
    }

    // Legacy manual endpoint kept for PDF download specific logic, although we could generalize it
    @GetMapping("/daily-sales-report/download")
    public ResponseEntity<byte[]> downloadDailySalesReportPdf() {
        try {
            byte[] pdfBytes = dailySalesReportService.generateDailySalesReportPdf(LocalDate.now());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "Daily_Sales_Report_" + LocalDate.now() + ".pdf");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
