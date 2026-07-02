package com.example.outletmanagement.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.outletmanagement.model.entity.ChatConversation;
import com.example.outletmanagement.model.entity.ChatMessage;
import com.example.outletmanagement.model.enums.ChatRole;
import com.example.outletmanagement.payload.dto.ChatbotDto.ChatRequestDto;
import com.example.outletmanagement.payload.dto.ChatbotDto.ChatResponseDto;
import com.example.outletmanagement.payload.dto.ChatbotDto.ConversationDto;
import com.example.outletmanagement.payload.dto.ChatbotDto.MessageDto;
import com.example.outletmanagement.repository.ChatConversationRepository;
import com.example.outletmanagement.repository.ChatMessageRepository;
import com.example.outletmanagement.service.ChatbotIntentService;
import com.example.outletmanagement.service.ConversationService;
import com.example.outletmanagement.service.SarvamAiService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConversationServiceImpl implements ConversationService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final SarvamAiService sarvamAiService;
    private final ChatbotIntentService chatbotIntentService;

    @Override
    @Transactional
    public ChatResponseDto processChatMessage(String userId, ChatRequestDto request) {
        ChatConversation conversation;
        List<ChatMessage> history = null;

        // 1. Load or Create Conversation
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findByIdAndUserId(request.getConversationId(), userId)
                    .orElseThrow(() -> new RuntimeException("Conversation not found or access denied"));
            history = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        } else {
            // Generate title from first message (first 30 chars)
            String title = request.getMessage().length() > 30 
                    ? request.getMessage().substring(0, 30) + "..." 
                    : request.getMessage();
            
            conversation = ChatConversation.builder()
                    .userId(userId)
                    .title(title)
                    .status("ACTIVE")
                    .build();
            conversation = conversationRepository.save(conversation);
        }

        // 2. Save User Message
        ChatMessage userMessage = ChatMessage.builder()
                .conversation(conversation)
                .role(ChatRole.USER)
                .content(request.getMessage())
                .build();
        messageRepository.save(userMessage);

        // 3. Analyze Intent
        ChatResponseDto intentResponse = chatbotIntentService.processIntent(userId, conversation.getId(), request.getMessage());
        
        String aiResponseText;
        if ("NAVIGATION".equals(intentResponse.getType()) || "OPEN_MODAL".equals(intentResponse.getType()) || "SUGGESTIONS".equals(intentResponse.getType())) {
            aiResponseText = intentResponse.getReply();
        } else {
            // 4. Call AI Service with context
            String context = intentResponse.getMetadata();
            aiResponseText = sarvamAiService.getChatCompletion(history, request.getMessage(), context);
            
            if ("Sorry for inconvenience, try a different way.".equals(aiResponseText)) {
                intentResponse.setSuggestions(java.util.List.of("View Products", "Check Stock Summary", "Create a Stock Order"));
            }
        }

        // 5. Save AI Response
        ChatMessage aiMessage = ChatMessage.builder()
                .conversation(conversation)
                .role(ChatRole.ASSISTANT)
                .content(aiResponseText)
                .build();
        messageRepository.save(aiMessage);
        
        // Update conversation timestamp
        conversationRepository.save(conversation);

        // 6. Return Response
        return ChatResponseDto.builder()
                .conversationId(conversation.getId())
                .reply(aiResponseText)
                .type(intentResponse.getType())
                .metadata(intentResponse.getMetadata())
                .suggestions(intentResponse.getSuggestions())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationDto> getUserConversations(String userId) {
        return conversationRepository.findAllByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(c -> ConversationDto.builder()
                        .id(c.getId())
                        .title(c.getTitle())
                        .status(c.getStatus())
                        .updatedAt(c.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationDto getConversation(Long id, String userId) {
        ChatConversation conversation = conversationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Conversation not found or access denied"));
        
        List<MessageDto> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(id).stream()
                .map(m -> MessageDto.builder()
                        .id(m.getId())
                        .role(m.getRole())
                        .content(m.getContent())
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ConversationDto.builder()
                .id(conversation.getId())
                .title(conversation.getTitle())
                .status(conversation.getStatus())
                .updatedAt(conversation.getUpdatedAt())
                .messages(messages)
                .build();
    }

    @Override
    @Transactional
    public void deleteConversation(Long id, String userId) {
        ChatConversation conversation = conversationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Conversation not found or access denied"));
        
        // CascadeType.ALL handles deleting messages automatically
        conversationRepository.delete(conversation);
    }
}
