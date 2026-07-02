package com.example.outletmanagement.service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.outletmanagement.model.entity.ReconciliationReport;
import com.example.outletmanagement.model.entity.ReconciliationReportItem;
import com.example.outletmanagement.payload.dto.EmailAttachment;
import com.example.outletmanagement.repository.ReconciliationReportItemRepository;
import com.example.outletmanagement.service.EmailService;
import com.example.outletmanagement.service.ReconciliationService;
import com.example.outletmanagement.service.SystemReportService;
import com.example.outletmanagement.service.EmailTemplateService;
import com.example.outletmanagement.service.PdfGeneratorService;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Nightly inventory reconciliation scheduler.
 * Runs daily at 03:00 AM — separate from AuditCleanupScheduler (02:00 AM).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReconciliationScheduler {

    @Value("${app.admin.email:admin@outletmanagement.com}")
    private String adminEmail;

    @Value("${app.report.dir:uploads/reports}")
    private String reportDir;

    private final ReconciliationService reconciliationService;
    private final ReconciliationReportItemRepository itemRepository;
    private final EmailService emailService;
    private final SystemReportService systemReportService;
    private final EmailTemplateService emailTemplateService;
    private final PdfGeneratorService pdfGeneratorService;

    @Scheduled(cron = "0 0 3 * * *")
    public void runNightlyReconciliation() {
        log.info("[ReconciliationScheduler] Starting nightly reconciliation...");
        try {
            ReconciliationReport report = reconciliationService.triggerReconciliation("SCHEDULER");
            List<ReconciliationReportItem> mismatches = itemRepository.findByReport_IdAndMismatchTypeNot(report.getId(), "MATCH");
            
            // Generate HTML for the email
            String reportDate = LocalDate.now().toString();
            String subject = "📊 IMS/OMS Reconciliation Report for " + reportDate;
            String bodyContent = "<p>Hello <strong>Administrator</strong>,</p>" +
                "<p>The daily inventory reconciliation has been completed.</p>" +
                emailTemplateService.infoCard(new String[][]{
                    {"📅 Target Date", emailTemplateService.esc(reportDate)},
                    {"🕐 Executed At", emailTemplateService.now()}
                }) +
                emailTemplateService.alert("info", "The PDF summary and full XLSX mismatch data are attached to this email.");
                
            String pdfHtml = emailTemplateService.baseLayout(subject, bodyContent);

            List<EmailAttachment> attachments = new ArrayList<>();

            // PDF Snapshot
            String pdfUrl = "";
            try {
                byte[] pdfBytes = pdfGeneratorService.generatePdfFromHtml(pdfHtml);
                String pdfName = UUID.randomUUID().toString() + "_reconciliation_summary.pdf";
                Path pdfPath = Paths.get(reportDir, pdfName);
                Files.createDirectories(pdfPath.getParent());
                Files.write(pdfPath, pdfBytes);
                pdfUrl = "/uploads/reports/" + pdfName;
                systemReportService.saveReport("RECONCILIATION", "reconciliation_summary.pdf", pdfUrl);
                attachments.add(EmailAttachment.builder()
                        .fileName("reconciliation_summary_" + report.getReportCode() + ".pdf")
                        .contentType("application/pdf")
                        .content(pdfBytes)
                        .filePath(pdfPath.toAbsolutePath().toString())
                        .build());
            } catch (Exception e) {
                log.error("[ReconciliationScheduler] Failed to generate PDF snapshot", e);
            }

            // Add button to Email HTML
            String emailHtml;
            if (!pdfUrl.isEmpty()) {
                String fullUrl = "http://localhost:8080" + pdfUrl;
                emailHtml = emailTemplateService.baseLayout(subject, bodyContent + emailTemplateService.downloadButton(fullUrl));
            } else {
                emailHtml = pdfHtml;
            }
            
            if (!mismatches.isEmpty()) {
                EmailAttachment xlsxAtt = createXlsxMismatchReport(mismatches, report.getReportCode());
                attachments.add(xlsxAtt);
                saveToDisk(xlsxAtt, "RECONCILIATION");
            }

            emailService.sendEmailWithAttachments(adminEmail, subject, emailHtml, attachments);

        } catch (Exception e) {
            log.error("[ReconciliationScheduler] Unhandled error: {}", e.getMessage(), e);
        }
    }

    private void saveToDisk(EmailAttachment attachment, String type) throws Exception {
        String savedFileName = UUID.randomUUID().toString() + "_" + attachment.getFileName();
        Path reportPath = Paths.get(reportDir, savedFileName);
        Files.createDirectories(reportPath.getParent());
        Files.write(reportPath, attachment.getContent());
        String fileUrl = "/uploads/reports/" + savedFileName;
        systemReportService.saveReport(type, attachment.getFileName(), fileUrl);
        attachment.setFilePath(reportPath.toAbsolutePath().toString());
    }



    private EmailAttachment createXlsxMismatchReport(List<ReconciliationReportItem> mismatches, String reportCode) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Mismatches");
            
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Product Code");
            header.createCell(1).setCellValue("Product Name");
            header.createCell(2).setCellValue("OMS Quantity");
            header.createCell(3).setCellValue("IMS Quantity");
            header.createCell(4).setCellValue("Difference");
            header.createCell(5).setCellValue("Mismatch Type");

            int rowIdx = 1;
            for (ReconciliationReportItem item : mismatches) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(item.getProductCode());
                row.createCell(1).setCellValue(item.getProductName());
                row.createCell(2).setCellValue(item.getOmsQuantity());
                row.createCell(3).setCellValue(item.getImsQuantity());
                row.createCell(4).setCellValue(item.getDifference());
                row.createCell(5).setCellValue(item.getMismatchType());
            }

            workbook.write(baos);
            return EmailAttachment.builder()
                    .fileName("reconciliation_mismatches_" + reportCode + ".xlsx")
                    .contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .content(baos.toByteArray())
                    .build();
        }
    }
}
