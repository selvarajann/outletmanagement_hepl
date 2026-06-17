package com.example.outletmanagement.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple memory-based message broker to carry the messages back to the client on destinations prefixed with "/topic" and "/queue".
        config.enableSimpleBroker("/topic", "/queue");
        
        // Designates the prefix for messages that are bound for @MessageMapping-annotated methods in application classes.
        config.setApplicationDestinationPrefixes("/app");
        
        // Used to identify user destinations (e.g. /user/queue/notifications)
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Registers the "/ws" endpoint, enabling SockJS fallback options so that alternate transports can be used if WebSocket is not available.
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Use allowedOriginPatterns for Spring Boot 2.4+ / CORS
                .withSockJS();
    }
}
