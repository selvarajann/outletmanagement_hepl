package com.example.outletmanagement.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.outletmanagement.payload.dto.ChatbotDto.ChatRequestDto;
import com.example.outletmanagement.payload.dto.ChatbotDto.ChatResponseDto;
import com.example.outletmanagement.payload.dto.ChatbotDto.ConversationDto;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.ConversationService;
import com.example.outletmanagement.util.JwtUtil;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
@Slf4j
public class ChatbotController {

    private final ConversationService conversationService;
    private final JwtUtil jwtUtil;

    private String extractUsername(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtil.extractUsername(token);
        }
        throw new RuntimeException("Unauthorized: No valid token found");
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponseDto>> chat(
            @Valid @RequestBody ChatRequestDto request,
            HttpServletRequest httpRequest) {
        
        String username = extractUsername(httpRequest);
        long startTime = System.currentTimeMillis();
        log.info("Chat request received for user: {}, conversationId: {}", username, request.getConversationId());

        try {
            ChatResponseDto response = conversationService.processChatMessage(username, request);
            long duration = System.currentTimeMillis() - startTime;
            log.info("Chat request completed for user: {} in {}ms", username, duration);
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Message processed", response));
        } catch (Exception ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Chat request failed for user: {} after {}ms - Error: {}", username, duration, ex.getMessage());
            throw ex;
        }
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationDto>>> getConversations(HttpServletRequest request) {
        String username = extractUsername(request);
        List<ConversationDto> conversations = conversationService.getUserConversations(username);
        return ResponseEntity.ok(new ApiResponse<>(true, "Conversations fetched", conversations));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<ConversationDto>> getConversation(
            @PathVariable Long id, 
            HttpServletRequest request) {
        String username = extractUsername(request);
        ConversationDto conversation = conversationService.getConversation(id, username);
        return ResponseEntity.ok(new ApiResponse<>(true, "Conversation fetched", conversation));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable Long id, 
            HttpServletRequest request) {
        String username = extractUsername(request);
        conversationService.deleteConversation(id, username);
        return ResponseEntity.ok(new ApiResponse<>(true, "Conversation deleted", null));
    }
}
