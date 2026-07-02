package com.example.outletmanagement.controller;

import com.example.outletmanagement.annotation.AuditAction;
import com.example.outletmanagement.payload.dto.StockOrderDto.StockOrderRequest;
import com.example.outletmanagement.payload.dto.StockOrderDto.StockOrderResponse;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.StockOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/stock-orders")
@RequiredArgsConstructor
public class StockOrderController {

    private final StockOrderService stockOrderService;

    @PostMapping
    @com.example.outletmanagement.annotation.Idempotent
    @AuditAction(action = "CREATE_STOCK_ORDER", entity = "StockOrder", captureBody = true)
    public ResponseEntity<ApiResponse<StockOrderResponse>> createOrder(@Valid @RequestBody StockOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Order created", stockOrderService.createOrder(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<StockOrderResponse>>> getAllOrders(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long outletId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        
        return ResponseEntity.ok(new ApiResponse<>(true, "All orders fetched", 
                stockOrderService.getAllOrders(keyword, outletId, status, fromDate, toDate, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StockOrderResponse>> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Order fetched", stockOrderService.getOrderById(id)));
    }

    @PutMapping("/{id}")
    @AuditAction(action = "UPDATE_STOCK_ORDER", entity = "StockOrder", captureBody = true)
    public ResponseEntity<ApiResponse<StockOrderResponse>> updateOrder(@PathVariable Long id, @Valid @RequestBody StockOrderRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Order updated", stockOrderService.updateOrder(id, request)));
    }

    @PostMapping("/{id}/request-cancel")
    @AuditAction(action = "REQUEST_CANCEL_STOCK_ORDER", entity = "StockOrder")
    public ResponseEntity<ApiResponse<StockOrderResponse>> requestCancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Order cancellation requested", stockOrderService.requestCancelOrder(id)));
    }

    @DeleteMapping("/{id}")
    @AuditAction(action = "DELETE_STOCK_ORDER", entity = "StockOrder")
    public ResponseEntity<ApiResponse<Void>> deleteOrder(@PathVariable Long id) {
        stockOrderService.deleteOrder(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order deleted", null));
    }

    @PostMapping("/{id}/retry-ims")
    @com.example.outletmanagement.annotation.Idempotent
    @AuditAction(action = "RETRY_IMS_PUSH", entity = "StockOrder")
    public ResponseEntity<ApiResponse<StockOrderResponse>> retryImsPush(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "IMS Push Retried", stockOrderService.retryImsPush(id)));
    }

    @GetMapping("/warehouse-products")
    public ResponseEntity<ApiResponse<com.example.outletmanagement.payload.dto.StockOrderDto.WarehouseProductsResponse>> getWarehouseProducts(
            @RequestParam Long outletId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Warehouse products fetched", 
                stockOrderService.getWarehouseProducts(outletId)));
    }
}
