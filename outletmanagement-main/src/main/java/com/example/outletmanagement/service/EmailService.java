package com.example.outletmanagement.service;

import java.math.BigDecimal;

public interface EmailService {
    void sendWelcomeEmail(String toEmail, String username, String role);
    void sendLoginNotification(String toEmail, String username);
    void sendNewUserRegisteredAlert(String adminEmail, String username, String userEmail, String role);
    void sendPasswordChangedEmail(String toEmail, String username);
    void sendUserCreatedEmail(String toEmail, String username, String role, String rawPassword);
    void sendUserUpdatedEmail(String toEmail, String username, String newRole, boolean isActive);
    void sendUserDeactivatedEmail(String toEmail, String username);
    void sendOutletCreatedEmail(String adminEmail, String outletName, String outletCode, String ownerName, String location);
    void sendOutletUpdatedEmail(String adminEmail, String outletName, String outletCode);
    void sendOutletDeletedEmail(String adminEmail, String outletName, String outletCode);
    void sendStockOrderCreatedEmail(String adminEmail, Long orderId, String orderCode, String outletName, String placedBy, BigDecimal totalAmount, int itemCount);
    void sendStockOrderApprovedEmail(String toEmail, Long orderId, String orderCode, String outletName);
    void sendStockOrderCancelledEmail(String toEmail, Long orderId, String orderCode, String outletName);
    void sendProductCreatedEmail(String adminEmail, String productName, String productCode, String divisionName, BigDecimal sellingPrice);
    void sendProductDeletedEmail(String adminEmail, String productName, String productCode);
    void sendSaleCompletedEmail(String adminEmail, String referenceNo, String outletName, BigDecimal totalAmount, String soldBy, int itemCount);
    void sendBatchReceivedEmail(String adminEmail, String batchCode, String outletName, String productName, int quantity);
    void sendProductUpdatedEmail(String adminEmail, String productName, String productCode, BigDecimal newSellingPrice);
    void sendDivisionCreatedEmail(String adminEmail, String name);
    void sendDivisionUpdatedEmail(String adminEmail, String oldName, String newName);
    void sendDivisionDeletedEmail(String adminEmail, String name);
    void sendLocationCreatedEmail(String adminEmail, String name);
    void sendLocationUpdatedEmail(String adminEmail, String oldName, String newName);
    void sendLocationDeletedEmail(String adminEmail, String name);
    void sendImportCompletedEmail(String adminEmail, String entityType, int imported, int failed, String failedFileUrl);
}

