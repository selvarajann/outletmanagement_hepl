package com.example.outletmanagement.service;

import java.util.List;

import com.example.outletmanagement.model.entity.ChatMessage;

public interface SarvamAiService {
    String getChatCompletion(List<ChatMessage> conversationHistory, String newUserMessage, String context);
    String analyzeIntent(String message);
}
