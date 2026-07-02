package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.StockOrderDto.StockOrderRequest;
import com.example.outletmanagement.payload.dto.StockOrderDto.StockOrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;

public interface StockOrderService {
    StockOrderResponse createOrder(StockOrderRequest request);
    Page<StockOrderResponse> getAllOrders(String keyword, Long outletId, String status, LocalDate fromDate, LocalDate toDate, Pageable pageable);
    StockOrderResponse getOrderById(Long id);
    StockOrderResponse updateOrder(Long id, StockOrderRequest request);
    StockOrderResponse requestCancelOrder(Long id);
    void deleteOrder(Long id);
    StockOrderResponse retryImsPush(Long id);
    com.example.outletmanagement.payload.dto.StockOrderDto.WarehouseProductsResponse getWarehouseProducts(Long outletId);
    void syncOrdersFromIms();
}
