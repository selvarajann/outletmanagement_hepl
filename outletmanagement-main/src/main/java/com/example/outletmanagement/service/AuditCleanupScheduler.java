package com.example.outletmanagement.service;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Collections;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import com.example.outletmanagement.repository.AuditLogRepository;
import com.example.outletmanagement.model.entity.AuditLog;
import com.example.outletmanagement.service.EmailService;
import com.example.outletmanagement.payload.dto.EmailAttachment;
import com.example.outletmanagement.service.SystemReportService;
import com.example.outletmanagement.service.EmailTemplateService;
import com.example.outletmanagement.service.PdfGeneratorService;
import java.util.ArrayList;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

/**
 * Scheduled cleanup job for the {@code audit_log} table.
 * <p>
 * Runs nightly at 02:00 AM and deletes all audit records older than
 * {@code app.audit.retain-days} days (default: 90).
 * <p>
 * Without a retention policy the audit table would grow unboundedly, eventually
 * causing disk pressure and degrading query performance despite the indexes.
 * <p>
 * The {@link Scheduled} cron expression {@code "0 0 2 * * *"} means:
 * second=0, minute=0, hour=2, any-day, any-month, any-weekday.
 */
@Component
@RequiredArgsConstructor
public class AuditCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(AuditCleanupScheduler.class);

    @Value("${app.audit.retain-days:90}")
    private int retainDays;

    @Value("${app.admin.email:admin@outletmanagement.com}")
    private String adminEmail;

    @Value("${app.report.dir:uploads/reports}")
    private String reportDir;

    private final AuditLogRepository auditLogRepository;
    private final EmailService emailService;
    private final SystemReportService systemReportService;
    private final EmailTemplateService emailTemplateService;
    private final PdfGeneratorService pdfGeneratorService;

    /**
     * Deletes audit records older than the configured retention period.
     * Runs weekly on Sunday at 02:00 AM.
     */
    @Scheduled(cron = "0 0 2 * * SUN")
    @Transactional
    public void purgeExpiredAuditLogs() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(retainDays);
        log.info("[AuditCleanup] Purging audit records older than {} ({} days)", threshold, retainDays);

        try {
            List<AuditLog> oldLogs = auditLogRepository.findByCreatedAtBefore(threshold);
            if (!oldLogs.isEmpty()) {
                String range = "Before " + threshold.toLocalDate().toString();
                String subject = "🛡️ Weekly Audit Log Archive (" + range + ")";
                String bodyContent = "<p>Hello <strong>Administrator</strong>,</p>" +
                    "<p>The weekly audit cleanup scheduler has successfully executed.</p>" +
                    emailTemplateService.infoCard(new String[][]{
                        {"📅 Range",       emailTemplateService.esc(range)},
                        {"🕐 Archived At", emailTemplateService.now()}
                    }) +
                    emailTemplateService.alert("success", "Archived system logs are securely attached as a ZIP file.");
                    
                String pdfHtml = emailTemplateService.baseLayout(subject, bodyContent);

                List<EmailAttachment> attachments = new ArrayList<>();

                // PDF Snapshot
                String pdfUrl = "";
                try {
                    byte[] pdfBytes = pdfGeneratorService.generatePdfFromHtml(pdfHtml);
                    String pdfName = UUID.randomUUID().toString() + "_audit_snapshot.pdf";
                    Path pdfPath = Paths.get(reportDir, pdfName);
                    Files.createDirectories(pdfPath.getParent());
                    Files.write(pdfPath, pdfBytes);
                    pdfUrl = "/uploads/reports/" + pdfName;
                    systemReportService.saveReport("AUDIT", "audit_snapshot.pdf", pdfUrl);
                    attachments.add(EmailAttachment.builder()
                            .fileName("audit_snapshot.pdf")
                            .contentType("application/pdf")
                            .content(pdfBytes)
                            .filePath(pdfPath.toAbsolutePath().toString())
                            .build());
                } catch (Exception e) {
                    log.error("[AuditCleanup] Failed to generate PDF snapshot", e);
                }

                // Add button to Email HTML
                String emailHtml;
                if (!pdfUrl.isEmpty()) {
                    String fullUrl = "http://localhost:8080" + pdfUrl;
                    emailHtml = emailTemplateService.baseLayout(subject, bodyContent + emailTemplateService.downloadButton(fullUrl));
                } else {
                    emailHtml = pdfHtml;
                }

                // ZIP Archive
                byte[] zipData = createZipArchive(oldLogs);
                String originalFileName = "audit_archive_" + threshold.toLocalDate().toString() + ".zip";
                String savedFileName = UUID.randomUUID().toString() + "_" + originalFileName;
                Path reportPath = Paths.get(reportDir, savedFileName);
                Files.createDirectories(reportPath.getParent());
                Files.write(reportPath, zipData);
                
                String fileUrl = "/uploads/reports/" + savedFileName;
                systemReportService.saveReport("AUDIT", originalFileName, fileUrl);
                
                attachments.add(EmailAttachment.builder()
                        .fileName(originalFileName)
                        .contentType("application/zip")
                        .content(zipData)
                        .filePath(reportPath.toAbsolutePath().toString())
                        .build());
                        
                emailService.sendEmailWithAttachments(adminEmail, subject, emailHtml, attachments);
            }

            long deleted = auditLogRepository.deleteByCreatedAtBefore(threshold);
            log.info("[AuditCleanup] Purged {} expired audit record(s)", deleted);
        } catch (Exception e) {
            log.error("[AuditCleanup] Failed to purge audit records: {}", e.getMessage(), e);
        }
    }

    private byte[] createZipArchive(List<AuditLog> logs) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            ZipEntry entry = new ZipEntry("audit_logs.csv");
            zos.putNextEntry(entry);
            
            StringBuilder csv = new StringBuilder();
            csv.append("ID,Username,Action,Entity,BusinessKey,CreatedAt\n");
            for (AuditLog log : logs) {
                csv.append(log.getId()).append(",")
                   .append(escapeCsv(log.getUsername())).append(",")
                   .append(escapeCsv(log.getAction())).append(",")
                   .append(escapeCsv(log.getEntity())).append(",")
                   .append(escapeCsv(log.getBusinessKey())).append(",")
                   .append(log.getCreatedAt()).append("\n");
            }
            zos.write(csv.toString().getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }
        return baos.toByteArray();
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }
}
