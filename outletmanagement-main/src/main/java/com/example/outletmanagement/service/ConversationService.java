package com.example.outletmanagement.service;

import java.util.List;

import com.example.outletmanagement.payload.dto.ChatbotDto.ChatRequestDto;
import com.example.outletmanagement.payload.dto.ChatbotDto.ChatResponseDto;
import com.example.outletmanagement.payload.dto.ChatbotDto.ConversationDto;

public interface ConversationService {
    ChatResponseDto processChatMessage(String userId, ChatRequestDto request);
    List<ConversationDto> getUserConversations(String userId);
    ConversationDto getConversation(Long id, String userId);
    void deleteConversation(Long id, String userId);
}
