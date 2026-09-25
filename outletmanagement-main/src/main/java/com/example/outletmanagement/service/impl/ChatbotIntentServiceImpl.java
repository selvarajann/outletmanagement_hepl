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
            String trimmedMsg = userMessage != null ? userMessage.trim() : "";
            String msgLower = trimmedMsg.toLowerCase();

            // 1. FAST LOCAL RULE ENGINE (0ms latency for all standard commands)
            
            // --- GREETINGS & HELP COMMANDS ---
            if (msgLower.matches("^(hi|hai|hello|hey|hie|hola|namaste|good morning|good afternoon|good evening|help|commands|menu|what can you do|who are you|what do you do|options)(\\s*|!|\\?|\\.)*$")) {
                return ChatResponseDto.builder()
                        .conversationId(conversationId)
                        .type("GREETING")
                        .reply("Hello! 👋 I am your OMS AI Assistant. Here is a complete list of features and commands I can perform for you:\n\n" +
                               "📋 **Creation Forms**:\n" +
                               "• Create Stock Order\n" +
                               "• Create Product\n" +
                               "• Create Outlet\n" +
                               "• Create Batch\n" +
                               "• Create Return\n" +
                               "• Create User\n\n" +
                               "📊 **Live Data & Analytics**:\n" +
                               "• Dashboard Summary\n" +
                               "• Low Stock Alerts\n" +
                               "• Expiring Batches\n" +
                               "• Pending Orders\n" +
                               "• View Products\n" +
                               "• Stock Summary\n\n" +
                               "🚀 **Quick Navigation**:\n" +
                               "• Go to Outlets | Go to Products | Go to Batches\n" +
                               "• Go to Stock Orders | Go to Shipments | Go to Returns\n" +
                               "• Go to POS | Go to Users | Audit Logs | System Jobs\n\n" +
                               "Click any button below or ask me a question!")
                        .suggestions(java.util.List.of(
                            "Create a Stock Order",
                            "Dashboard Summary",
                            "Low Stock Alerts",
                            "Expiring Batches",
                            "View Products",
                            "Go to Outlets",
                            "Go to POS",
                            "Audit Logs"
                        ))
                        .build();
            }

            // --- OPEN MODAL / CREATION COMMANDS ---
            if (msgLower.contains("create stock order") || msgLower.contains("new stock order") || msgLower.contains("add stock order")) {
                return createModalResponse(conversationId, "OPEN_MODAL", "CREATE_STOCK_ORDER", "/stock-orders?action=create", "Sure! Opening the Stock Order creation form for you.");
            }
            if (msgLower.contains("create product") || msgLower.contains("new product") || msgLower.contains("add product")) {
                return createModalResponse(conversationId, "OPEN_MODAL", "CREATE_PRODUCT", "/products?action=create", "Sure! Opening the Product creation form for you.");
            }
            if (msgLower.contains("create outlet") || msgLower.contains("new outlet") || msgLower.contains("add outlet")) {
                return createModalResponse(conversationId, "OPEN_MODAL", "CREATE_OUTLET", "/outlets?action=create", "Sure! Opening the Outlet creation form for you.");
            }
            if (msgLower.contains("create batch") || msgLower.contains("new batch") || msgLower.contains("add batch")) {
                return createModalResponse(conversationId, "OPEN_MODAL", "CREATE_BATCH", "/batches?action=create", "Sure! Opening the Batch creation form for you.");
            }
            if (msgLower.contains("create return") || msgLower.contains("create stock return") || msgLower.contains("new return")) {
                return createModalResponse(conversationId, "OPEN_MODAL", "CREATE_STOCK_RETURN", "/stock-returns?action=create", "Sure! Opening the Stock Return creation form for you.");
            }
            if (msgLower.contains("create user") || msgLower.contains("new user") || msgLower.contains("add user")) {
                return createModalResponse(conversationId, "OPEN_MODAL", "CREATE_USER", "/users?action=create", "Sure! Opening the User creation form for you.");
            }

            // --- PAGE NAVIGATION COMMANDS ---
            if (msgLower.contains("dashboard") || msgLower.contains("analytics")) {
                return createNavResponse(conversationId, "/analytics", "Navigating to Analytics Dashboard for you.");
            }
            if (msgLower.contains("go to products") || msgLower.equals("products") || msgLower.contains("product catalog")) {
                return createNavResponse(conversationId, "/products", "Navigating to Products Catalog for you.");
            }
            if (msgLower.contains("go to outlets") || msgLower.equals("outlets") || msgLower.contains("outlet list")) {
                return createNavResponse(conversationId, "/outlets", "Navigating to Outlets Management for you.");
            }
            if (msgLower.contains("go to batches") || msgLower.equals("batches") || msgLower.contains("batch list")) {
                return createNavResponse(conversationId, "/batches", "Navigating to Batch Management for you.");
            }
            if (msgLower.contains("go to stock orders") || msgLower.contains("go to orders") || msgLower.equals("orders") || msgLower.equals("stock orders")) {
                return createNavResponse(conversationId, "/stock-orders", "Navigating to Stock Orders for you.");
            }
            if (msgLower.contains("shipments") || msgLower.contains("shipment list")) {
                return createNavResponse(conversationId, "/shipments", "Navigating to Shipments for you.");
            }
            if (msgLower.contains("stock returns") || msgLower.contains("returns list")) {
                return createNavResponse(conversationId, "/stock-returns", "Navigating to Stock Returns for you.");
            }
            if (msgLower.contains("reconciliation") || msgLower.contains("reconcile")) {
                return createNavResponse(conversationId, "/inventory/reconciliation", "Navigating to Inventory Reconciliation for you.");
            }
            if (msgLower.contains("pos") || msgLower.contains("point of sale") || msgLower.contains("sales")) {
                return createNavResponse(conversationId, "/pos", "Navigating to POS Sales terminal for you.");
            }
            if (msgLower.contains("warehouse") || msgLower.contains("warehouse products")) {
                return createNavResponse(conversationId, "/warehouse-products", "Navigating to Warehouse Products for you.");
            }
            if (msgLower.contains("users") || msgLower.contains("user management")) {
                return createNavResponse(conversationId, "/users", "Navigating to User Management for you.");
            }
            if (msgLower.contains("audit log") || msgLower.contains("audit logs")) {
                return createNavResponse(conversationId, "/admin/audit-logs", "Navigating to Audit Logs for you.");
            }
            if (msgLower.contains("system job") || msgLower.contains("system jobs") || msgLower.contains("cron jobs")) {
                return createNavResponse(conversationId, "/system/jobs", "Navigating to System Jobs for you.");
            }
            if (msgLower.contains("dead letter") || msgLower.contains("dead letters")) {
                return createNavResponse(conversationId, "/system/dead-letters", "Navigating to Dead Letter Queue Manager for you.");
            }
            if (msgLower.contains("ims orders") || msgLower.contains("ims portal")) {
                return createNavResponse(conversationId, "/ims-orders", "Navigating to IMS Orders for you.");
            }

            // --- LIVE DATA QUERY COMMANDS ---
            if (msgLower.contains("dashboard summary") || msgLower.contains("system stats") || msgLower.contains("system health")) {
                String reply = fetchContextData("GET_DASHBOARD_STATS");
                return createDataResponse(conversationId, reply, java.util.List.of("Low Stock Alerts", "Expiring Batches", "Pending Orders"));
            }
            if (msgLower.contains("low stock") || msgLower.contains("low stock alert") || msgLower.contains("check low stock")) {
                String reply = fetchContextData("GET_LOW_STOCK");
                return createDataResponse(conversationId, reply, java.util.List.of("Expiring Batches", "Check Stock Summary", "Create a Stock Order"));
            }
            if (msgLower.contains("expiring") || msgLower.contains("expiring batch") || msgLower.contains("expiring soon")) {
                String reply = fetchContextData("GET_EXPIRING_BATCHES");
                return createDataResponse(conversationId, reply, java.util.List.of("Low Stock Alerts", "Check Stock Summary", "Go to Batches"));
            }
            if (msgLower.contains("pending order") || msgLower.contains("pending stock order")) {
                String reply = fetchContextData("GET_PENDING_ORDERS");
                return createDataResponse(conversationId, reply, java.util.List.of("Create a Stock Order", "Go to Stock Orders", "Dashboard Summary"));
            }
            if (msgLower.contains("stock summary") || msgLower.contains("outlet stock")) {
                String reply = fetchContextData("GET_OUTLET_STOCK");
                return createDataResponse(conversationId, reply, java.util.List.of("Low Stock Alerts", "View Products", "Go to Outlets"));
            }
            if (msgLower.contains("view products") || msgLower.contains("show products") || msgLower.contains("available products")) {
                String reply = fetchContextData("GET_PRODUCTS");
                return createDataResponse(conversationId, reply, java.util.List.of("Create Product", "Low Stock Alerts", "Go to Products"));
            }

            // 2. FALLBACK TO SARVAM AI FOR NATURAL LANGUAGE QUERIES
            String intentJsonStr = sarvamAiService.analyzeIntent(userMessage);
            JsonNode intentJson = objectMapper.readTree(intentJsonStr);
            String type = intentJson.has("type") ? intentJson.get("type").asText() : "GENERAL";

            if ("GREETING".equals(type)) {
                return ChatResponseDto.builder()
                        .conversationId(conversationId)
                        .type("GREETING")
                        .reply("Hello! 👋 How can I assist you with Outlet Management today?")
                        .suggestions(java.util.List.of("Create a Stock Order", "View Products", "Check Stock Summary", "Low Stock Alerts"))
                        .build();
            }

            if ("NAVIGATION".equals(type) || "OPEN_MODAL".equals(type)) {
                String modalName = intentJson.has("modal") ? intentJson.get("modal").asText() : "";
                String pagePath = intentJson.has("page") ? intentJson.get("page").asText() : "";
                return ChatResponseDto.builder()
                        .conversationId(conversationId)
                        .type(type)
                        .metadata(intentJson.toString())
                        .reply(!modalName.isEmpty() ? "Opening " + modalName + " for you." : "Navigating to " + pagePath + " for you.")
                        .build();
            }

            if ("INTENT".equals(type) && intentJson.has("intent")) {
                String intent = intentJson.get("intent").asText();
                String dataStr = fetchContextData(intent);
                return ChatResponseDto.builder()
                        .conversationId(conversationId)
                        .type("DATA")
                        .reply(dataStr)
                        .suggestions(java.util.List.of("Dashboard Summary", "Low Stock Alerts", "Create a Stock Order"))
                        .build();
            }

            return ChatResponseDto.builder()
                    .conversationId(conversationId)
                    .type("GENERAL")
                    .build();

        } catch (Exception e) {
            log.error("Failed to process intent", e);
            return ChatResponseDto.builder()
                    .conversationId(conversationId)
                    .type("GENERAL")
                    .reply("I am here to help you manage your outlet system! Type 'help' to see all available commands.")
                    .suggestions(java.util.List.of("Create a Stock Order", "Dashboard Summary", "View Products"))
                    .build();
        }
    }

    private ChatResponseDto createNavResponse(Long conversationId, String page, String reply) {
        String jsonMeta = String.format("{\"type\":\"NAVIGATION\",\"page\":\"%s\"}", page);
        return ChatResponseDto.builder()
                .conversationId(conversationId)
                .type("NAVIGATION")
                .metadata(jsonMeta)
                .reply(reply)
                .suggestions(java.util.List.of("Create a Stock Order", "Dashboard Summary", "Check Stock Summary"))
                .build();
    }

    private ChatResponseDto createModalResponse(Long conversationId, String type, String modal, String page, String reply) {
        String jsonMeta = String.format("{\"type\":\"%s\",\"modal\":\"%s\",\"page\":\"%s\"}", type, modal, page);
        return ChatResponseDto.builder()
                .conversationId(conversationId)
                .type(type)
                .metadata(jsonMeta)
                .reply(reply)
                .suggestions(java.util.List.of("Dashboard Summary", "View Products", "Low Stock Alerts"))
                .build();
    }

    private ChatResponseDto createDataResponse(Long conversationId, String reply, java.util.List<String> suggestions) {
        return ChatResponseDto.builder()
                .conversationId(conversationId)
                .type("DATA")
                .reply(reply != null && !reply.isBlank() ? reply : "No specific data found.")
                .suggestions(suggestions)
                .build();
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
