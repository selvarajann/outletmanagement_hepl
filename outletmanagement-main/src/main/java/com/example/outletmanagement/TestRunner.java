package com.example.outletmanagement;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.example.outletmanagement.service.ChatbotIntentService;
import com.example.outletmanagement.payload.dto.ChatbotDto.ChatResponseDto;
import com.example.outletmanagement.model.entity.WarehouseProducts;
import com.example.outletmanagement.repository.WarehouseProductRepository;
import com.example.outletmanagement.model.entity.Division;
import com.example.outletmanagement.repository.DivisionRepository;
import java.math.BigDecimal;
import com.example.outletmanagement.model.enums.ProductStatus;

import org.springframework.context.annotation.Profile;

@Component
@RequiredArgsConstructor
@Profile("!prod") // Do not run in production
public class TestRunner implements CommandLineRunner {

    private final ChatbotIntentService chatbotIntentService;
    private final WarehouseProductRepository warehouseProductRepository;
    private final DivisionRepository divisionRepository;
    private static final Logger log = LoggerFactory.getLogger(TestRunner.class);

    @Override
    public void run(String... args) throws Exception {
        if (warehouseProductRepository.count() == 0) {
            log.info(">>>> [TEST RUNNER] Seeding WarehouseProducts...");
            Division div1 = divisionRepository.findById(1L).orElse(null);
            Division div2 = divisionRepository.findById(2L).orElse(null);
            Division div3 = divisionRepository.findById(3L).orElse(null);

            WarehouseProducts p1 = new WarehouseProducts();
            p1.setProductCode("WH-1001");
            p1.setName("Bulk T-Shirts (Black)");
            p1.setDivision(div1);
            p1.setUimPrice(new BigDecimal("150.00"));
            p1.setMrp(new BigDecimal("500.00"));
            p1.setSellingPrice(new BigDecimal("450.00"));
            p1.setPurchasePrice(new BigDecimal("150.00"));
            p1.setStatus(ProductStatus.ACTIVE);

            WarehouseProducts p2 = new WarehouseProducts();
            p2.setProductCode("WH-1002");
            p2.setName("Premium Denim Jeans");
            p2.setDivision(div2 != null ? div2 : div1);
            p2.setUimPrice(new BigDecimal("600.00"));
            p2.setMrp(new BigDecimal("2500.00"));
            p2.setSellingPrice(new BigDecimal("1800.00"));
            p2.setPurchasePrice(new BigDecimal("600.00"));
            p2.setStatus(ProductStatus.ACTIVE);

            WarehouseProducts p3 = new WarehouseProducts();
            p3.setProductCode("WH-1003");
            p3.setName("Sneakers Classic");
            p3.setDivision(div3 != null ? div3 : div1);
            p3.setUimPrice(new BigDecimal("800.00"));
            p3.setMrp(new BigDecimal("3000.00"));
            p3.setSellingPrice(new BigDecimal("2500.00"));
            p3.setPurchasePrice(new BigDecimal("800.00"));
            p3.setStatus(ProductStatus.ACTIVE);

            warehouseProductRepository.save(p1);
            warehouseProductRepository.save(p2);
            warehouseProductRepository.save(p3);
            log.info(">>>> [TEST RUNNER] Seeded 3 WarehouseProducts.");
        }

        log.info(">>>> [TEST RUNNER] Starting Chatbot Intent Tests...");
        
        String[] testCases = {
            "Navigate to products",
            "What products are available?",
            "Show me pending stock orders",
            "I want to create a stock order",
            "Show batches",
            "What is the stock summary?",
            "Give me a summary of the system",
            "Which items are running low on stock?",
            "Are there any batches expiring soon?"
        };

        for (String testCase : testCases) {
            log.info(">>>> [TEST] Executing: {}", testCase);
            try {
                ChatResponseDto result = chatbotIntentService.processIntent("superadmin", 999L, testCase);
                log.info(">>>> [RESULT] Type: {}, Metadata: {}", result.getType(), result.getMetadata());
            } catch (Exception e) {
                log.error(">>>> [ERROR] Failed to process intent for: {}", testCase, e);
            }
        }
        log.info(">>>> [TEST RUNNER] Chatbot Intent Tests Completed.");
    }
}
