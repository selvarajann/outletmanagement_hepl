package com.example.outletmanagement.service;

import com.example.outletmanagement.integration.InventoryApiClient;
import com.example.outletmanagement.model.entity.Shipment;
import com.example.outletmanagement.model.entity.StockOrder;
import com.example.outletmanagement.model.entity.StockReturn;
import com.example.outletmanagement.model.enums.NotificationType;
import com.example.outletmanagement.repository.ShipmentRepository;
import com.example.outletmanagement.repository.StockOrderRepository;
import com.example.outletmanagement.repository.StockReturnRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Phase 12: Retry scheduler for all failed OMS → IMS pushes.
 * Runs every 15 minutes. Dead-letters at retry count = 5.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ImsSyncRetryScheduler {

    private static final int MAX_RETRIES = 5;

    private final StockOrderRepository stockOrderRepository;
    private final StockReturnRepository stockReturnRepository;
    private final ShipmentRepository shipmentRepository;
    private final InventoryApiClient inventoryApiClient;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Scheduled(fixedDelay = 15 * 60 * 1000) // every 15 minutes
    public void retryFailedImsPushes() {
        log.info("[RetryScheduler] Starting IMS sync retry cycle...");
        retryStockOrders();
        retryStockReturns();
        retryShipmentReceipts();
        log.info("[RetryScheduler] Retry cycle completed.");
    }

    private void retryStockOrders() {
        List<StockOrder> failed = stockOrderRepository.findByImsPushStatusAndImsPushRetryCountLessThan(
                "IMS_PUSH_FAILED", MAX_RETRIES, PageRequest.of(0, 50));
        for (StockOrder order : failed) {
            log.info("[RetryScheduler] Retrying stock order push: orderId={}, attempt={}", order.getId(), order.getImsPushRetryCount() + 1);
            auditLogService.saveAsync(UUID.randomUUID().toString(), "RETRY_SCHEDULER",
                    "SYNC_RETRY_ATTEMPT", "StockOrder", order.getOrderCode(),
                    "POST", "/ims/api/stock-requests", "OMS", 0, null, null);
            order.setImsPushRetryCount(order.getImsPushRetryCount() + 1);
            if (order.getImsPushRetryCount() >= MAX_RETRIES) {
                order.setImsPushStatus("DEAD_LETTER");
                stockOrderRepository.save(order);
                deadLetterAlert("StockOrder", order.getOrderCode());
                auditLogService.saveAsync(UUID.randomUUID().toString(), "RETRY_SCHEDULER",
                        "DEAD_LETTER_CREATED", "StockOrder", order.getOrderCode(),
                        "POST", "/ims/api/stock-requests", "OMS", 0, null, null);
            } else {
                stockOrderRepository.save(order);
                inventoryApiClient.pushStockRequest(order.getId());
            }
        }
    }

    private void retryStockReturns() {
        List<StockReturn> failed = stockReturnRepository.findByImsPushStatusAndImsPushRetryCountLessThan(
                "IMS_PUSH_FAILED", MAX_RETRIES, PageRequest.of(0, 50));
        for (StockReturn ret : failed) {
            log.info("[RetryScheduler] Retrying stock return push: returnId={}, attempt={}", ret.getId(), ret.getImsPushRetryCount() + 1);
            auditLogService.saveAsync(UUID.randomUUID().toString(), "RETRY_SCHEDULER",
                    "SYNC_RETRY_ATTEMPT", "StockReturn", ret.getReturnCode(),
                    "POST", "/ims/api/returns", "OMS", 0, null, null);
            ret.setImsPushRetryCount(ret.getImsPushRetryCount() + 1);
            if (ret.getImsPushRetryCount() >= MAX_RETRIES) {
                ret.setImsPushStatus("DEAD_LETTER");
                stockReturnRepository.save(ret);
                deadLetterAlert("StockReturn", ret.getReturnCode());
                auditLogService.saveAsync(UUID.randomUUID().toString(), "RETRY_SCHEDULER",
                        "DEAD_LETTER_CREATED", "StockReturn", ret.getReturnCode(),
                        "POST", "/ims/api/returns", "OMS", 0, null, null);
            } else {
                stockReturnRepository.save(ret);
                inventoryApiClient.pushStockReturn(ret.getId());
            }
        }
    }

    private void retryShipmentReceipts() {
        List<Shipment> failed = shipmentRepository.findByImsReceiptSyncStatusAndImsReceiptRetryCountLessThan(
                "FAILED", MAX_RETRIES, PageRequest.of(0, 50));
        for (Shipment shipment : failed) {
            log.info("[RetryScheduler] Retrying receipt push: shipmentId={}, attempt={}", shipment.getId(), shipment.getImsReceiptRetryCount() + 1);
            auditLogService.saveAsync(UUID.randomUUID().toString(), "RETRY_SCHEDULER",
                    "SYNC_RETRY_ATTEMPT", "Shipment", shipment.getShipmentCode(),
                    "POST", "/ims/api/receipts", "OMS", 0, null, null);
            shipment.setImsReceiptRetryCount(shipment.getImsReceiptRetryCount() + 1);
            if (shipment.getImsReceiptRetryCount() >= MAX_RETRIES) {
                shipment.setImsReceiptSyncStatus("DEAD_LETTER");
                shipmentRepository.save(shipment);
                deadLetterAlert("Shipment", shipment.getShipmentCode());
                auditLogService.saveAsync(UUID.randomUUID().toString(), "RETRY_SCHEDULER",
                        "DEAD_LETTER_CREATED", "Shipment", shipment.getShipmentCode(),
                        "POST", "/ims/api/receipts", "OMS", 0, null, null);
            } else {
                shipmentRepository.save(shipment);
                inventoryApiClient.pushReceiptToIms(shipment.getId());
            }
        }
    }

    private void deadLetterAlert(String entityType, String entityCode) {
        log.error("[RetryScheduler] DEAD_LETTER: {} {} has exhausted {} retries and will no longer be retried automatically.",
                entityType, entityCode, MAX_RETRIES);
        try {
            notificationService.sendToRole("SUPER_ADMIN", NotificationType.DEAD_LETTER_ALERT,
                    "IMS Sync Dead Letter: " + entityType,
                    entityType + " " + entityCode + " failed all " + MAX_RETRIES + " IMS sync retries. Manual resolution required.");
        } catch (Exception e) {
            log.warn("[RetryScheduler] Could not send dead-letter notification: {}", e.getMessage());
        }
    }
}
