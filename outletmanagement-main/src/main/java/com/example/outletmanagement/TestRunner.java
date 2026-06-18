package com.example.outletmanagement;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import com.example.outletmanagement.service.ImsWebhookService;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsProductSyncRequestDto;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class TestRunner implements CommandLineRunner {

    private final ImsWebhookService imsWebhookService;
    private static final Logger log = LoggerFactory.getLogger(TestRunner.class);

    @Override
    public void run(String... args) throws Exception {
        log.info(">>>> [TEST RUNNER] Testing IMS Product Sync...");
        
        ImsProductSyncRequestDto request = new ImsProductSyncRequestDto(
            "PRD-TEST-999",
            "Test Product",
            new BigDecimal("10.00"),
            new BigDecimal("20.00"),
            new BigDecimal("15.00"),
            new BigDecimal("8.00"),
            null,
            "http://example.com/img.jpg",
            "ACTIVE"
        );
        
        try {
            var response1 = imsWebhookService.handleProductSync(request);
            log.info(">>>> [TEST RUNNER] Response 1: {}", response1.getProcessingStatus());
            
            var response2 = imsWebhookService.handleProductSync(request);
            log.info(">>>> [TEST RUNNER] Response 2 (Duplicate): {}", response2.getProcessingStatus());
            
            request.setSellingPrice(new BigDecimal("16.00"));
            var response3 = imsWebhookService.handleProductSync(request);
            log.info(">>>> [TEST RUNNER] Response 3 (Update): {}", response3.getProcessingStatus());
            
        } catch (Exception e) {
            log.error(">>>> [TEST RUNNER] handleProductSync failed: ", e);
        }
    }
}
