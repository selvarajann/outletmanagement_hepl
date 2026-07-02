package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.ChatbotDto.ChatResponseDto;

public interface ChatbotIntentService {
    ChatResponseDto processIntent(String userId, Long conversationId, String userMessage);
}
