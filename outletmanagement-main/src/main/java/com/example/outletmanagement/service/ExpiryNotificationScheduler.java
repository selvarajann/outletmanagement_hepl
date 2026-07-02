package com.example.outletmanagement.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Collections;
import java.io.ByteArrayOutputStream;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.outletmanagement.model.entity.BatchItem;
import com.example.outletmanagement.model.enums.NotificationType;
import com.example.outletmanagement.payload.dto.EmailAttachment;
import com.example.outletmanagement.repository.BatchItemRepository;
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
 * Scheduled job for expiry notification.
 * Runs daily at 08:00 AM.
 * Detects stock expiring within 30 days.
 */
@Component
@RequiredArgsConstructor
public class ExpiryNotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(ExpiryNotificationScheduler.class);

    @Value("${app.admin.email:admin@outletmanagement.com}")
    private String adminEmail;

    @Value("${app.report.dir:uploads/reports}")
    private String reportDir;

    private final BatchItemRepository batchItemRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final SystemReportService systemReportService;
    private final EmailTemplateService emailTemplateService;
    private final PdfGeneratorService pdfGeneratorService;

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void notifyExpiringStock() {
        LocalDate threshold = LocalDate.now().plusDays(30);
        log.info("[ExpiryScheduler] Finding items expiring before {}", threshold);

        try {
            List<BatchItem> expiringItems = batchItemRepository.findExpiringBefore(threshold);

            if (!expiringItems.isEmpty()) {
                String subject = "⚠️ Stock Expiry Warning Report";
                String bodyContent = "<p>Hello <strong>Administrator</strong>,</p>" +
                    "<p>The following stock batches are nearing their expiry date.</p>" +
                    emailTemplateService.infoCard(new String[][]{
                        {"📦 Expiring Items", String.valueOf(expiringItems.size())},
                        {"📅 Report Date",    emailTemplateService.now()}
                    }) +
                    emailTemplateService.alert("warning", "Review the attached XLSX report for detailed batch information.");
                    
                String pdfHtml = emailTemplateService.baseLayout(subject, bodyContent);

                List<EmailAttachment> attachments = new ArrayList<>();

                // PDF Snapshot
                String pdfUrl = "";
                try {
                    byte[] pdfBytes = pdfGeneratorService.generatePdfFromHtml(pdfHtml);
                    String pdfName = UUID.randomUUID().toString() + "_expiry_snapshot.pdf";
                    Path pdfPath = Paths.get(reportDir, pdfName);
                    Files.createDirectories(pdfPath.getParent());
                    Files.write(pdfPath, pdfBytes);
                    pdfUrl = "/uploads/reports/" + pdfName;
                    systemReportService.saveReport("EXPIRY", "expiry_snapshot.pdf", pdfUrl);
                    attachments.add(EmailAttachment.builder()
                            .fileName("expiry_snapshot.pdf")
                            .contentType("application/pdf")
                            .content(pdfBytes)
                            .filePath(pdfPath.toAbsolutePath().toString())
                            .build());
                } catch (Exception e) {
                    log.error("[ExpiryScheduler] Failed to generate PDF snapshot", e);
                }

                // Add button to Email HTML
                String emailHtml;
                if (!pdfUrl.isEmpty()) {
                    String fullUrl = "http://localhost:8080" + pdfUrl;
                    emailHtml = emailTemplateService.baseLayout(subject, bodyContent + emailTemplateService.downloadButton(fullUrl));
                } else {
                    emailHtml = pdfHtml;
                }

                // XLSX
                byte[] xlsxData = createXlsxReport(expiringItems);
                String originalFileName = "expiring_stock_report_" + LocalDate.now().toString() + ".xlsx";
                String savedFileName = UUID.randomUUID().toString() + "_" + originalFileName;
                Path reportPath = Paths.get(reportDir, savedFileName);
                Files.createDirectories(reportPath.getParent());
                Files.write(reportPath, xlsxData);
                
                String fileUrl = "/uploads/reports/" + savedFileName;
                systemReportService.saveReport("EXPIRY", originalFileName, fileUrl);
                
                attachments.add(EmailAttachment.builder()
                        .fileName(originalFileName)
                        .contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        .content(xlsxData)
                        .filePath(reportPath.toAbsolutePath().toString())
                        .build());

                emailService.sendEmailWithAttachments(adminEmail, subject, emailHtml, attachments);

                // Notify Outlet Managers
                notificationService.sendToRole(
                        "OUTLET_MANAGER",
                        NotificationType.WARNING,
                        "Stock Expiry Alert",
                        expiringItems.size() + " batch items are expiring within 30 days. Check your inventory."
                );

                log.info("[ExpiryScheduler] Sent expiry alerts for {} items", expiringItems.size());
            } else {
                log.info("[ExpiryScheduler] No expiring items found within 30 days.");
            }
        } catch (Exception e) {
            log.error("[ExpiryScheduler] Failed to process expiring stock: {}", e.getMessage(), e);
        }
    }

    private byte[] createXlsxReport(List<BatchItem> items) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Expiring Stock");
            
            Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("Batch Code");
            headerRow.createCell(1).setCellValue("Product Name");
            headerRow.createCell(2).setCellValue("Outlet");
            headerRow.createCell(3).setCellValue("Remaining Qty");
            headerRow.createCell(4).setCellValue("Expiry Date");

            int rowIdx = 1;
            for (BatchItem item : items) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(item.getImsBatchCode());
                row.createCell(1).setCellValue(item.getProduct() != null ? item.getProduct().getName() : "N/A");
                row.createCell(2).setCellValue(item.getBatch() != null && item.getBatch().getOutlet() != null ? item.getBatch().getOutlet().getOutletName() : "N/A");
                row.createCell(3).setCellValue(item.getRemainingQuantity() != null ? item.getRemainingQuantity() : 0);
                row.createCell(4).setCellValue(item.getExpiryDate() != null ? item.getExpiryDate().toString() : "N/A");
            }

            workbook.write(baos);
            return baos.toByteArray();
        }
    }
}
