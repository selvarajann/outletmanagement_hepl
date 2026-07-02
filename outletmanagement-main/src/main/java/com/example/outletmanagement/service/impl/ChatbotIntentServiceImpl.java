package com.example.outletmanagement.service.impl;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.example.outletmanagement.payload.dto.ChatbotDto.ChatResponseDto;
import com.example.outletmanagement.service.BatchService;
import com.example.outletmanagement.service.ChatbotIntentService;
import com.example.outletmanagement.service.DashboardService;
import com.example.outletmanagement.service.ProductService;
import com.example.outletmanagement.service.SarvamAiService;
import com.example.outletmanagement.service.StockOrderService;
import com.example.outletmanagement.service.StockService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotIntentServiceImpl implements ChatbotIntentService {

    private final SarvamAiService sarvamAiService;
    private final ProductService productService;
    private final StockService stockService;
    private final StockOrderService stockOrderService;
    private final BatchService batchService;
    private final DashboardService dashboardService;
    private final ObjectMapper objectMapper;

    @Override
    public ChatResponseDto processIntent(String userId, Long conversationId, String userMessage) {
        try {
            // 1. Analyze Intent
            String intentJsonStr = sarvamAiService.analyzeIntent(userMessage);
            JsonNode intentJson = objectMapper.readTree(intentJsonStr);
            String type = intentJson.has("type") ? intentJson.get("type").asText() : "GENERAL";

            ChatResponseDto response = ChatResponseDto.builder()
                    .conversationId(conversationId)
                    .build();
            
            // Handle Unknown / Suggestions
            if ("UNKNOWN".equals(type)) {
                response.setType("SUGGESTIONS");
                response.setReply("I'm not sure I understood that. Were you looking to do one of the following?");
                response.setSuggestions(java.util.List.of(
                    "View Products",
                    "Check Stock Summary",
                    "Create a Stock Order"
                ));
                return response;
            }

            // 2. Direct Navigation / Modals (Bypass 2nd LLM call)
            if ("NAVIGATION".equals(type) || "OPEN_MODAL".equals(type)) {
                response.setType(type);
                response.setMetadata(intentJson.toString());
                response.setReply("Sure, I am opening that for you.");
                return response;
            }

            // 3. Data Intents
            String contextData = "";
            if ("INTENT".equals(type) && intentJson.has("intent")) {
                String intent = intentJson.get("intent").asText();
                contextData = fetchContextData(intent);
            }

            // 4. If we have context data, pass it back via a custom ChatResponseDto type so ConversationService can use it
            response.setType("DATA");
            response.setMetadata(contextData);
            return response;

        } catch (Exception e) {
            log.error("Failed to process intent", e);
            return ChatResponseDto.builder()
                    .conversationId(conversationId)
                    .type("GENERAL")
                    .metadata("")
                    .build();
        }
    }

    private String fetchContextData(String intent) {
        try {
            switch (intent) {
                case "GET_PRODUCTS":
                    var products = productService.getAllProducts(null, null, null, null, null, null, PageRequest.of(0, 10));
                    return "Available Products: " + products.getContent().stream()
                            .map(p -> p.getName() + " (Code: " + p.getProductCode() + ", Price: " + p.getSellingPrice() + ")")
                            .reduce((a, b) -> a + ", " + b).orElse("No products found.");
                
                case "GET_PENDING_ORDERS":
                    var orders = stockOrderService.getAllOrders(null, null, "PENDING", null, null, PageRequest.of(0, 10));
                    return "Pending Stock Orders: " + orders.getContent().stream()
                            .map(o -> o.getOrderCode() + " (Outlet: " + o.getOutletName() + ")")
                            .reduce((a, b) -> a + ", " + b).orElse("No pending orders.");
                
                case "GET_BATCHES":
                    var batches = batchService.getAllBatches(null, null, null, null, null, PageRequest.of(0, 10));
                    return "Recent Batches: " + batches.getContent().stream()
                            .map(b -> b.getBatchCode() + " (Status: " + b.getStatus() + ")")
                            .reduce((a, b) -> a + ", " + b).orElse("No batches found.");
                
                case "GET_OUTLET_STOCK":
                    var stocks = stockService.getStockSummary();
                    return "Stock Summary: " + stocks.stream()
                            .limit(10)
                            .map(s -> s.getOutletName() + " has " + s.getTotalProductsInStock() + " total products.")
                            .reduce((a, b) -> a + " | " + b).orElse("No stock data found.");

                case "GET_DASHBOARD_STATS":
                    var summary = dashboardService.getSummary();
                    return String.format("System Dashboard Summary: Total Stock: %d, Low Stock Alerts: %d, Expiring (30d): %d, Pending Orders: %d, Sync Failures: %d",
                            summary.getTotalActiveStock(), summary.getLowStockAlerts(), summary.getExpiringWithin30Days(), summary.getPendingStockOrders(), summary.getSyncFailures());

                case "GET_LOW_STOCK":
                    var lowStockItems = dashboardService.getLowStockItems();
                    return "Low Stock Items: " + lowStockItems.stream()
                            .limit(10)
                            .map(i -> i.getProductName() + " at " + i.getOutletName() + " (Quantity: " + i.getCurrentQuantity() + ", Threshold: " + i.getThreshold() + ")")
                            .reduce((a, b) -> a + " | " + b).orElse("No low stock items found.");

                case "GET_EXPIRING_BATCHES":
                    var expiringItems = dashboardService.getExpiringItems(30);
                    return "Batches Expiring in Next 30 Days: " + expiringItems.stream()
                            .limit(10)
                            .map(i -> i.getProductName() + " expires on " + i.getExpiryDate() + " (Quantity: " + i.getRemainingQuantity() + ", Days left: " + i.getDaysUntilExpiry() + ")")
                            .reduce((a, b) -> a + " | " + b).orElse("No batches expiring soon.");

                default:
                    return "";
            }
        } catch (Exception e) {
            log.warn("Failed to fetch context for intent: {}", intent, e);
            return "";
        }
    }
}
