package com.example.outletmanagement.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.example.outletmanagement.model.entity.ChatMessage;
import com.example.outletmanagement.payload.dto.sarvam.SarvamRequestDto;
import com.example.outletmanagement.payload.dto.sarvam.SarvamRequestDto.SarvamMessage;
import com.example.outletmanagement.payload.dto.sarvam.SarvamResponseDto;
import com.example.outletmanagement.service.SarvamAiService;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SarvamAiServiceImpl implements SarvamAiService {

    private final WebClient webClient;
    private final String apiKey;
    private final String systemPrompt;

    public SarvamAiServiceImpl(
            @Value("${sarvam.ai.base-url}") String baseUrl,
            @Value("${sarvam.ai.api-key}") String apiKey,
            @Value("${chatbot.system-prompt}") String systemPrompt) {
        this.webClient = WebClient.builder().baseUrl(baseUrl).build();
        this.apiKey = apiKey;
        this.systemPrompt = systemPrompt;
    }

    @Override
    public String getChatCompletion(List<ChatMessage> conversationHistory, String newUserMessage, String context) {
        
        List<SarvamMessage> messages = new ArrayList<>();
        
        // 1. Add System Prompt with optional context
        String finalSystemPrompt = systemPrompt;
        if (context != null && !context.isBlank()) {
            finalSystemPrompt += "\n\nCRITICAL CONTEXT FROM DATABASE: " + context + "\nAnswer the user's question STRICTLY using this context. Do not invent information.";
        }

        messages.add(SarvamMessage.builder()
                .role("system")
                .content(finalSystemPrompt)
                .build());

        // 2. Add Conversation History
        if (conversationHistory != null) {
            messages.addAll(conversationHistory.stream()
                    .map(msg -> SarvamMessage.builder()
                            .role(msg.getRole().name().toLowerCase())
                            .content(msg.getContent())
                            .build())
                    .collect(Collectors.toList()));
        }

        // 3. Add New User Message
        messages.add(SarvamMessage.builder()
                .role("user")
                .content(newUserMessage)
                .build());

        // 4. Build Request Payload
        SarvamRequestDto requestPayload = SarvamRequestDto.builder()
                .model("sarvam-105b") // or sarvam-30b based on requirements
                .messages(messages)
                .temperature(0.7)
                .max_tokens(1000)
                .top_p(0.9)
                .build();

        try {
            // 5. Execute API Call securely
            // 5. Execute API Call securely and capture raw string for debugging
            String rawResponse = webClient.post()
                    .header("api-subscription-key", apiKey)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestPayload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(); // Blocking because we're calling this synchronously in Tomcat threads
                    
            log.info("Raw response from Sarvam AI: {}", rawResponse);
            
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            SarvamResponseDto response = mapper.readValue(rawResponse, SarvamResponseDto.class);

            if (response != null && response.getChoices() != null && !response.getChoices().isEmpty()) {
                String content = response.getChoices().get(0).getMessage().getContent();
                if (content == null || content.isEmpty()) {
                    return "Sorry for inconvenience, try a different way.";
                }
                return content;
            }
            throw new RuntimeException("Empty response from Sarvam AI");
            
        } catch (Exception ex) {
            log.error("Failed to fetch chat completion from Sarvam AI", ex);
            throw new RuntimeException("Sarvam AI Service is currently unavailable: " + ex.getMessage());
        }
    }

    @Override
    public String analyzeIntent(String message) {
        List<SarvamMessage> messages = new ArrayList<>();
        messages.add(SarvamMessage.builder()
                .role("system")
                .content("You are a strict JSON-only Intent Analyzer for the Outlet Management System. Classify the user message into one of these intents: GET_PRODUCTS, GET_OUTLET_STOCK, GET_PENDING_ORDERS, GET_BATCHES, GET_DASHBOARD_STATS, GET_LOW_STOCK, GET_EXPIRING_BATCHES, NAVIGATION, OPEN_MODAL, GENERAL, UNKNOWN.\n" +
                         "CRITICAL RULES:\n" +
                         "1. If the user asks to go, navigate, or open a page (e.g. 'go to products', 'open orders page'), return exactly: {\"type\": \"NAVIGATION\", \"page\": \"/path\"} (Paths: /products, /outlets, /batches, /stock-orders).\n" +
                         "2. If the user explicitly expresses intent to CREATE, ADD, or INITIATE a new entity (e.g., 'I want to create a stock order', 'add new product'), you MUST classify this as OPEN_MODAL and return exactly: {\"type\": \"OPEN_MODAL\", \"modal\": \"CREATE_STOCK_ORDER\"} (or relevant modal name).\n" +
                         "3. If the user asks for data (e.g., 'what products are there', 'show low stock items', 'dashboard summary'), return exactly: {\"type\": \"INTENT\", \"intent\": \"THE_INTENT_NAME\"} (e.g., GET_DASHBOARD_STATS, GET_LOW_STOCK, GET_EXPIRING_BATCHES, GET_PRODUCTS).\n" +
                         "4. If the user types something extremely short, ambiguous, or just asks for help (e.g., 'hi', 'help', 'what can you do', 'asdf'), return exactly: {\"type\": \"UNKNOWN\"}.\n" +
                         "5. If none match but it is a valid domain question, return {\"type\": \"GENERAL\"}.\n" +
                         "DO NOT output any reasoning, markdown, or text. ONLY output the raw JSON object.")
                .build());

        messages.add(SarvamMessage.builder()
                .role("user")
                .content(message)
                .build());

        SarvamRequestDto requestPayload = SarvamRequestDto.builder()
                .model("sarvam-105b")
                .messages(messages)
                .temperature(0.1) // Low temperature for deterministic output
                .max_tokens(1500)
                .top_p(0.9)
                .build();

        try {
            String rawResponse = webClient.post()
                    .header("api-subscription-key", apiKey)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestPayload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            log.info("Raw Intent response from Sarvam AI: {}", rawResponse);
            
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            SarvamResponseDto response = mapper.readValue(rawResponse, SarvamResponseDto.class);

            if (response != null && response.getChoices() != null && !response.getChoices().isEmpty()) {
                String content = response.getChoices().get(0).getMessage().getContent();
                if (content != null) {
                    // Clean up markdown block if Sarvam returned it wrapped in ```json ... ```
                    if (content.startsWith("```json")) {
                        content = content.substring(7);
                    }
                    if (content.startsWith("```")) {
                        content = content.substring(3);
                    }
                    if (content.endsWith("```")) {
                        content = content.substring(0, content.length() - 3);
                    }
                    return content.trim();
                }
            }
            return "{\"type\":\"GENERAL\"}";
            
        } catch (Exception ex) {
            log.error("Failed to analyze intent using Sarvam AI", ex);
            return "{\"type\":\"GENERAL\"}"; // Fallback to general on failure
        }
    }
}
