package com.example.outletmanagement.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import lombok.extern.slf4j.Slf4j;

/**
 * Controller for handling incoming STOMP messages from clients.
 * Currently serves as a placeholder if clients need to send messages TO the server
 * over WebSocket. (Our current architecture mostly pushes FROM server to client).
 */
@Controller
@Slf4j
public class NotificationWebSocketController {

    @MessageMapping("/notifications/ping")
    public void handlePing(String message) {
        log.debug("Received STOMP ping: {}", message);
    }
}
