package com.example.outletmanagement.service;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.outletmanagement.model.entity.Shipment;
import com.example.outletmanagement.model.entity.StockOrder;
import com.example.outletmanagement.model.entity.StockReturn;
import com.example.outletmanagement.payload.dto.EmailAttachment;
import com.example.outletmanagement.repository.ShipmentRepository;
import com.example.outletmanagement.repository.StockOrderRepository;
import com.example.outletmanagement.repository.StockReturnRepository;
import com.example.outletmanagement.service.SystemReportService;
import com.example.outletmanagement.service.EmailTemplateService;
import com.example.outletmanagement.service.PdfGeneratorService;
import java.util.ArrayList;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

/**
 * Scheduled job for dead letter alerts.
 * Runs daily at 07:00 AM.
 * Scans all repositories for items stuck in "DEAD_LETTER" status.
 */
@Component
@RequiredArgsConstructor
public class DeadLetterAlertScheduler {

    private static final Logger log = LoggerFactory.getLogger(DeadLetterAlertScheduler.class);

    @Value("${app.admin.email:admin@outletmanagement.com}")
    private String adminEmail;

    @Value("${app.report.dir:uploads/reports}")
    private String reportDir;

    private final StockOrderRepository stockOrderRepository;
    private final StockReturnRepository stockReturnRepository;
    private final ShipmentRepository shipmentRepository;
    private final EmailService emailService;
    private final SystemReportService systemReportService;
    private final EmailTemplateService emailTemplateService;
    private final PdfGeneratorService pdfGeneratorService;

    @Scheduled(cron = "0 0 7 * * *")
    @Transactional
    public void alertOnDeadLetters() {
        log.info("[DeadLetterScheduler] Scanning for DEAD_LETTER statuses...");

        List<StockOrder> deadOrders = stockOrderRepository.findByImsPushStatus("DEAD_LETTER");
        List<StockReturn> deadReturns = stockReturnRepository.findByImsPushStatus("DEAD_LETTER");
        List<Shipment> deadShipments = shipmentRepository.findByImsReceiptSyncStatus("DEAD_LETTER");

        int totalDeadLetters = deadOrders.size() + deadReturns.size() + deadShipments.size();

        if (totalDeadLetters > 0) {
            String subject = "🚨 Action Required: Dead Letter Queue Alert";
            String bodyContent = "<p>Hello <strong>Administrator</strong>,</p>" +
                "<p>The Dead Letter integration queue requires your attention.</p>" +
                emailTemplateService.infoCard(new String[][]{
                    {"⚠️ Failed Events", String.valueOf(totalDeadLetters)},
                    {"🕐 Detected At",   emailTemplateService.now()}
                }) +
                emailTemplateService.alert("danger", "Failed webhooks and integration payloads have been attached as a CSV file. " +
                                "Please review and trigger manual retries if necessary.");
                                
            String pdfHtml = emailTemplateService.baseLayout(subject, bodyContent);

            List<EmailAttachment> attachments = new ArrayList<>();

            // PDF Snapshot
            String pdfUrl = "";
            try {
                byte[] pdfBytes = pdfGeneratorService.generatePdfFromHtml(pdfHtml);
                String pdfName = UUID.randomUUID().toString() + "_dead_letter_snapshot.pdf";
                Path pdfPath = Paths.get(reportDir, pdfName);
                Files.createDirectories(pdfPath.getParent());
                Files.write(pdfPath, pdfBytes);
                pdfUrl = "/uploads/reports/" + pdfName;
                systemReportService.saveReport("DEAD_LETTER", "dead_letter_snapshot.pdf", pdfUrl);
                attachments.add(EmailAttachment.builder()
                        .fileName("dead_letter_snapshot.pdf")
                        .contentType("application/pdf")
                        .content(pdfBytes)
                        .filePath(pdfPath.toAbsolutePath().toString())
                        .build());
            } catch (Exception e) {
                log.error("[DeadLetterScheduler] Failed to generate PDF snapshot", e);
            }

            // Add button to Email HTML
            String emailHtml;
            if (!pdfUrl.isEmpty()) {
                String fullUrl = "http://localhost:8080" + pdfUrl;
                emailHtml = emailTemplateService.baseLayout(subject, bodyContent + emailTemplateService.downloadButton(fullUrl));
            } else {
                emailHtml = pdfHtml;
            }

            // CSV
            byte[] csvData = createCsvReport(deadOrders, deadReturns, deadShipments);
            String originalFileName = "dead_letter_report_" + LocalDate.now().toString() + ".csv";
            String savedFileName = UUID.randomUUID().toString() + "_" + originalFileName;
            Path reportPath = Paths.get(reportDir, savedFileName);
            
            try {
                Files.createDirectories(reportPath.getParent());
                Files.write(reportPath, csvData);
                systemReportService.saveReport("DEAD_LETTER", originalFileName, "/uploads/reports/" + savedFileName);
                attachments.add(EmailAttachment.builder()
                        .fileName(originalFileName)
                        .contentType("text/csv")
                        .content(csvData)
                        .filePath(reportPath.toAbsolutePath().toString())
                        .build());
            } catch (Exception e) {
                log.error("[DeadLetterScheduler] Failed to write CSV to disk", e);
            }
            
            emailService.sendEmailWithAttachments(adminEmail, subject, emailHtml, attachments);
            log.info("[DeadLetterScheduler] Sent alert for {} dead letters", totalDeadLetters);
        } else {
            log.info("[DeadLetterScheduler] No dead letters found.");
        }
    }

    private byte[] createCsvReport(List<StockOrder> deadOrders, List<StockReturn> deadReturns, List<Shipment> deadShipments) {
        StringBuilder csv = new StringBuilder();
        csv.append("EntityType,EntityCode,Status,Error\n");

        for (StockOrder order : deadOrders) {
            csv.append("StockOrder,")
               .append(escapeCsv(order.getOrderCode())).append(",")
               .append(escapeCsv(order.getImsPushStatus())).append(",")
               .append(escapeCsv("Push to IMS failed max retries")).append("\n");
        }

        for (StockReturn ret : deadReturns) {
            csv.append("StockReturn,")
               .append(escapeCsv(ret.getReturnCode())).append(",")
               .append(escapeCsv(ret.getImsPushStatus())).append(",")
               .append(escapeCsv("Push to IMS failed max retries")).append("\n");
        }

        for (Shipment s : deadShipments) {
            csv.append("Shipment,")
               .append(escapeCsv(s.getShipmentCode())).append(",")
               .append(escapeCsv(s.getImsReceiptSyncStatus())).append(",")
               .append(escapeCsv("Receipt push to IMS failed max retries")).append("\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }
}
