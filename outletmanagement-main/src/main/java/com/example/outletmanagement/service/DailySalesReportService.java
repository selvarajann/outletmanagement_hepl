package com.example.outletmanagement.service;

import com.example.outletmanagement.model.entity.SaleTransaction;
import com.example.outletmanagement.payload.dto.EmailAttachment;
import com.example.outletmanagement.repository.SaleTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailySalesReportService {

    private final SaleTransactionRepository saleTransactionRepository;
    private final EmailTemplateService emailTemplateService;
    private final PdfGeneratorService pdfGeneratorService;
    private final EmailService emailService;

    public byte[] generateDailySalesReportPdf(LocalDate date) throws Exception {
        String html = generateDailySalesReportHtml(date);
        return pdfGeneratorService.generatePdfFromHtml(html);
    }

    public void sendDailySalesReport(String adminEmail) {
        try {
            LocalDate today = LocalDate.now();
            String html = generateDailySalesReportHtml(today);
            byte[] pdfBytes = pdfGeneratorService.generatePdfFromHtml(html);

            EmailAttachment attachment = new EmailAttachment(
                "Daily_Sales_Report_" + today.toString() + ".pdf",
                "application/pdf",
                pdfBytes,
                null
            );

            emailService.sendEmailWithAttachments(
                adminEmail,
                "Daily Sales Report - " + today.toString(),
                html,
                List.of(attachment)
            );
            log.info("Daily sales report sent to {}", adminEmail);
        } catch (Exception e) {
            log.error("Failed to generate and send daily sales report", e);
            throw new RuntimeException("Failed to generate daily sales report", e);
        }
    }

    private String generateDailySalesReportHtml(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);
        
        // Find all sales for the given day
        List<SaleTransaction> sales = saleTransactionRepository.findWithFilters(null, startOfDay, endOfDay, org.springframework.data.domain.Pageable.unpaged()).getContent();
        
        return emailTemplateService.dailySalesReport(sales, date);
    }
}
