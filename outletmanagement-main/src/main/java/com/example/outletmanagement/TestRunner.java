package com.example.outletmanagement;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.example.outletmanagement.service.ChatbotIntentService;
import com.example.outletmanagement.payload.dto.ChatbotDto.ChatResponseDto;

@Component
@RequiredArgsConstructor
public class TestRunner implements CommandLineRunner {

    private final ChatbotIntentService chatbotIntentService;
    private static final Logger log = LoggerFactory.getLogger(TestRunner.class);

    @Override
    public void run(String... args) throws Exception {
        log.info(">>>> [TEST RUNNER] Starting Chatbot Intent Tests...");
        
        String[] testCases = {
            "Navigate to products",
            "What products are available?",
            "Show me pending stock orders",
            "I want to create a stock order",
            "Show batches",
            "What is the stock summary?",
            "Give me a summary of the system",
            "Which items are running low on stock?",
            "Are there any batches expiring soon?"
        };

        for (String testCase : testCases) {
            log.info(">>>> [TEST] Executing: {}", testCase);
            try {
                ChatResponseDto result = chatbotIntentService.processIntent("superadmin", 999L, testCase);
                log.info(">>>> [RESULT] Type: {}, Metadata: {}", result.getType(), result.getMetadata());
            } catch (Exception e) {
                log.error(">>>> [ERROR] Failed to process intent for: {}", testCase, e);
            }
        }
        log.info(">>>> [TEST RUNNER] Chatbot Intent Tests Completed.");
    }
}
