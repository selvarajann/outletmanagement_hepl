package com.example.outletmanagement.controller;

import com.example.outletmanagement.integration.InventoryApiClient;
import com.example.outletmanagement.model.entity.Shipment;
import com.example.outletmanagement.model.entity.StockOrder;
import com.example.outletmanagement.model.entity.StockReturn;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.repository.ShipmentRepository;
import com.example.outletmanagement.repository.StockOrderRepository;
import com.example.outletmanagement.repository.StockReturnRepository;
import com.example.outletmanagement.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Phase 12: Manual retry endpoint for DEAD_LETTER sync records.
 */
@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class ImsSyncController {

    private final StockOrderRepository stockOrderRepository;
    private final StockReturnRepository stockReturnRepository;
    private final ShipmentRepository shipmentRepository;
    private final InventoryApiClient inventoryApiClient;
    private final AuditLogService auditLogService;

    @PostMapping("/retry/stock-order/{orderId}")
    public ResponseEntity<ApiResponse<String>> retryStockOrder(
            @PathVariable Long orderId,
            @RequestHeader(value = "X-User-Name", defaultValue = "ADMIN") String username) {
        StockOrder order = stockOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("StockOrder not found: " + orderId));
        order.setImsPushStatus("IMS_PUSH_FAILED");
        order.setImsPushRetryCount(0);
        stockOrderRepository.save(order);
        inventoryApiClient.pushStockRequest(orderId);
        auditLogService.saveAsync(UUID.randomUUID().toString(), username,
                "SYNC_RETRY_ATTEMPT", "StockOrder", order.getOrderCode(),
                "POST", "/api/sync/retry/stock-order/" + orderId, "CLIENT", 200, null, null);
        return ResponseEntity.ok(new ApiResponse<>(true, "Retry initiated for StockOrder: " + order.getOrderCode(), null));
    }

    @PostMapping("/retry/stock-return/{returnId}")
    public ResponseEntity<ApiResponse<String>> retryStockReturn(
            @PathVariable Long returnId,
            @RequestHeader(value = "X-User-Name", defaultValue = "ADMIN") String username) {
        StockReturn ret = stockReturnRepository.findById(returnId)
                .orElseThrow(() -> new IllegalArgumentException("StockReturn not found: " + returnId));
        ret.setImsPushStatus("IMS_PUSH_FAILED");
        ret.setImsPushRetryCount(0);
        stockReturnRepository.save(ret);
        inventoryApiClient.pushStockReturn(returnId);
        auditLogService.saveAsync(UUID.randomUUID().toString(), username,
                "SYNC_RETRY_ATTEMPT", "StockReturn", ret.getReturnCode(),
                "POST", "/api/sync/retry/stock-return/" + returnId, "CLIENT", 200, null, null);
        return ResponseEntity.ok(new ApiResponse<>(true, "Retry initiated for StockReturn: " + ret.getReturnCode(), null));
    }

    @PostMapping("/retry/shipment-receipt/{shipmentId}")
    public ResponseEntity<ApiResponse<String>> retryShipmentReceipt(
            @PathVariable Long shipmentId,
            @RequestHeader(value = "X-User-Name", defaultValue = "ADMIN") String username) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found: " + shipmentId));
        shipment.setImsReceiptSyncStatus("FAILED");
        shipment.setImsReceiptRetryCount(0);
        shipmentRepository.save(shipment);
        inventoryApiClient.pushReceiptToIms(shipmentId);
        auditLogService.saveAsync(UUID.randomUUID().toString(), username,
                "SYNC_RETRY_ATTEMPT", "Shipment", shipment.getShipmentCode(),
                "POST", "/api/sync/retry/shipment-receipt/" + shipmentId, "CLIENT", 200, null, null);
        return ResponseEntity.ok(new ApiResponse<>(true, "Retry initiated for Shipment: " + shipment.getShipmentCode(), null));
    }

    @GetMapping("/dead-letters")
    public ResponseEntity<ApiResponse<Object>> getDeadLetters() {
        var orders = stockOrderRepository.findAll().stream()
                .filter(o -> "DEAD_LETTER".equals(o.getImsPushStatus())).toList();
        var returns = stockReturnRepository.findAll().stream()
                .filter(r -> "DEAD_LETTER".equals(r.getImsPushStatus())).toList();
        var shipments = shipmentRepository.findAll().stream()
                .filter(s -> "DEAD_LETTER".equals(s.getImsReceiptSyncStatus())).toList();
        return ResponseEntity.ok(new ApiResponse<>(true, "Dead letter records",
                java.util.Map.of("stockOrders", orders, "stockReturns", returns, "shipments", shipments)));
    }
}
