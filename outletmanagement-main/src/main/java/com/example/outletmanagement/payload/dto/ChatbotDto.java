package com.example.outletmanagement.payload.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.example.outletmanagement.model.enums.ChatRole;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ChatbotDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatRequestDto {
        private Long conversationId; // Null if creating a new conversation
        
        @NotBlank(message = "Message content cannot be blank")
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatResponseDto {
        private Long conversationId;
        private String reply;
        private String type; // "DATA", "NAVIGATION", "OPEN_MODAL", "ACTION_REQUIRED", "SUGGESTIONS"
        private String metadata; // JSON representation of metadata (e.g. page URL)
        private List<String> suggestions; // List of actionable suggestions for the user
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConversationDto {
        private Long id;
        private String title;
        private String status;
        private LocalDateTime updatedAt;
        private List<MessageDto> messages; // Loaded only when explicitly fetched
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageDto {
        private Long id;
        private ChatRole role;
        private String content;
        private LocalDateTime createdAt;
    }
}
