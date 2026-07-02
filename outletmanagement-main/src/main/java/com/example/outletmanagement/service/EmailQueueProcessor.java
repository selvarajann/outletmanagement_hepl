package com.example.outletmanagement.service;

import com.example.outletmanagement.model.entity.EmailQueue;
import com.example.outletmanagement.repository.EmailQueueRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.File;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailQueueProcessor {

    private final EmailQueueRepository emailQueueRepository;
    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;

    @Value("${app.mail.from:noreply@outletmanagement.com}")
    private String fromAddress;

    @Value("${app.mail.from-name:Outlet Management System}")
    private String fromName;

    // Runs every 1 minute
    @Scheduled(fixedRate = 60000)
    public void processEmailQueue() {
        List<EmailQueue> pendingEmails = emailQueueRepository.findTop20ByStatusOrderByCreatedAtAsc("PENDING");

        if (pendingEmails.isEmpty()) {
            return;
        }

        log.info("[EmailQueue] Processing {} pending emails...", pendingEmails.size());

        for (EmailQueue email : pendingEmails) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                boolean isMultipart = email.getAttachmentPaths() != null && !email.getAttachmentPaths().isBlank();
                MimeMessageHelper helper = new MimeMessageHelper(message, isMultipart, "UTF-8");

                helper.setFrom(fromAddress, fromName);
                helper.setTo(email.getToAddress());
                helper.setSubject(email.getSubject());
                helper.setText(email.getBodyHtml(), true);

                if (isMultipart) {
                    List<String> paths = objectMapper.readValue(email.getAttachmentPaths(), new TypeReference<List<String>>() {});
                    for (String path : paths) {
                        File file = new File(path);
                        if (file.exists()) {
                            FileSystemResource resource = new FileSystemResource(file);
                            helper.addAttachment(file.getName(), resource);
                        } else {
                            log.warn("[EmailQueue] Attachment file not found: {}", path);
                        }
                    }
                }

                mailSender.send(message);

                email.setStatus("SENT");
                email.setSentAt(LocalDateTime.now());
                log.info("[EmailQueue] Successfully sent email #{} to {}", email.getId(), email.getToAddress());

            } catch (Exception e) {
                log.error("[EmailQueue] Failed to send email #{}: {}", email.getId(), e.getMessage());
                email.setStatus("FAILED");
                email.setErrorReason(e.getMessage());
            } finally {
                emailQueueRepository.save(email);
            }
        }
    }
}
