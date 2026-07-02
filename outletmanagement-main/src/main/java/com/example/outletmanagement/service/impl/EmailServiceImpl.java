package com.example.outletmanagement.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.example.outletmanagement.payload.dto.EmailAttachment;
import com.example.outletmanagement.service.EmailService;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.outletmanagement.model.entity.EmailQueue;
import com.example.outletmanagement.repository.EmailQueueRepository;
import java.util.stream.Collectors;

/**
 * EmailServiceImpl — sends transactional HTML emails via Mailtrap SMTP.
 * All methods are @Async (fire-and-forget).
 * HTML is built inline in Java — no external template engine needed.
 */
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    private final JavaMailSender mailSender;
    private final EmailQueueRepository emailQueueRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.mail.from:noreply@outletmanagement.com}")
    private String fromAddress;

    @Value("${app.mail.from-name:Outlet Management System}")
    private String fromName;

    // ════════════════════════════════════════════════════════════════
    //  AUTH / USER
    // ════════════════════════════════════════════════════════════════

    @Override
    public void sendWelcomeEmail(String toEmail, String username, String role) {
        String subject = "Welcome to Outlet Management System 🎉";
        String html = baseLayout(subject,
            "<p>Hi <strong>" + esc(username) + "</strong>,</p>" +
            "<p>Your account has been successfully created. You&apos;re all set!</p>" +
            infoCard(new String[][]{
                {"👤 Username", esc(username)},
                {"🛡️ Role",     badge(esc(role), "purple")}
            }) +
            alert("success",
                "🎯 <strong>Next Steps:</strong> Log in to your dashboard and start managing " +
                "stock orders, outlets, and sales.") +
            alert("warning",
                "🔒 <strong>Security Tip:</strong> Change your password after your first login " +
                "and never share your credentials.")
        );
        send(toEmail, subject, html);
    }

    @Override
    public void sendLoginNotification(String toEmail, String username) {
        String subject = "New Login Detected – Outlet Management 🔐";
        String html = baseLayout(subject,
            "<p>Hi <strong>" + esc(username) + "</strong>,</p>" +
            "<p>A new login was recorded on your account.</p>" +
            infoCard(new String[][]{
                {"👤 Username",   esc(username)},
                {"🕐 Login Time", now()}
            }) +
            alert("warning",
                "⚠️ <strong>Not you?</strong> Contact your administrator and change your " +
                "password immediately.")
        );
        send(toEmail, subject, html);
    }

    @Override
    public void sendNewUserRegisteredAlert(String adminEmail, String username, String userEmail, String role) {
        String subject = "New User Registered: " + username;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>A new user has registered on the Outlet Management System.</p>" +
            infoCard(new String[][]{
                {"👤 Username",      esc(username)},
                {"📧 Email",         esc(userEmail)},
                {"🛡️ Role",          badge(esc(role), "purple")},
                {"📅 Registered At", now()}
            }) +
            alert("info",
                "ℹ️ Review this user&apos;s access permissions in the " +
                "<strong>User Management</strong> panel.")
        );
        send(adminEmail, subject, html);
    }

    @Override
    public void sendPasswordChangedEmail(String toEmail, String username) {
        String subject = "Your Password Has Been Changed";
        String html = baseLayout(subject,
            "<p>Hi <strong>" + esc(username) + "</strong>,</p>" +
            "<p>Your Outlet Management account password was recently changed.</p>" +
            infoCard(new String[][]{
                {"👤 Username",  esc(username)},
                {"🕐 Changed At", now()}
            }) +
            alert("danger",
                "⚠️ <strong>Didn't change your password?</strong> Contact your " +
                "administrator immediately — your account may be compromised.")
        );
        send(toEmail, subject, html);
    }

    // ════════════════════════════════════════════════════════════════
    //  USER MANAGEMENT
    // ════════════════════════════════════════════════════════════════

    @Override
    public void sendUserCreatedEmail(String toEmail, String username, String role, String rawPassword) {
        String subject = "Your Outlet Management Account Has Been Created";
        String html = baseLayout(subject,
            "<p>Hi <strong>" + esc(username) + "</strong>,</p>" +
            "<p>An administrator has created an account for you.</p>" +
            infoCard(new String[][]{
                {"👤 Username",         esc(username)},
                {"🛡️ Role",             badge(esc(role), "purple")},
                {"🔑 Temporary Password", "<code style='background:#f1f5f9;padding:2px 8px;" +
                                          "border-radius:4px;font-family:monospace'>" +
                                          esc(rawPassword) + "</code>"}
            }) +
            alert("warning",
                "🔒 Please log in and change your password immediately.")
        );
        send(toEmail, subject, html);
    }

    @Override
    public void sendUserUpdatedEmail(String toEmail, String username, String newRole, boolean isActive) {
        String subject = "Your Account Has Been Updated";
        String html = baseLayout(subject,
            "<p>Hi <strong>" + esc(username) + "</strong>,</p>" +
            "<p>Your account details have been updated by an administrator.</p>" +
            infoCard(new String[][]{
                {"👤 Username", esc(username)},
                {"🛡️ New Role", badge(esc(newRole), "purple")},
                {"✅ Status",   badge(isActive ? "ACTIVE" : "INACTIVE",
                                     isActive ? "success" : "danger")}
            }) +
            alert("info",
                "ℹ️ If these changes are unexpected, contact your system administrator.")
        );
        send(toEmail, subject, html);
    }

    @Override
    public void sendUserDeactivatedEmail(String toEmail, String username) {
        String subject = "Your Account Has Been Deactivated";
        String html = baseLayout(subject,
            "<p>Hi <strong>" + esc(username) + "</strong>,</p>" +
            "<p>Your Outlet Management account has been <strong>deactivated</strong>.</p>" +
            infoCard(new String[][]{
                {"👤 Username",      esc(username)},
                {"🔴 Status",        badge("DEACTIVATED", "danger")},
                {"📅 Deactivated At", now()}
            }) +
            alert("warning",
                "⚠️ If this was done in error, please contact your system administrator.")
        );
        send(toEmail, subject, html);
    }

    // ════════════════════════════════════════════════════════════════
    //  OUTLET
    // ════════════════════════════════════════════════════════════════

    @Override
    public void sendOutletCreatedEmail(String adminEmail, String outletName, String outletCode,
                                       String ownerName, String location) {
        String subject = "New Outlet Created: " + outletName;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>A new outlet has been successfully registered in the system.</p>" +
            infoCard(new String[][]{
                {"🏪 Outlet Name",  esc(outletName)},
                {"🏷️ Outlet Code",  badge(esc(outletCode), "info")},
                {"👤 Owner",        esc(ownerName)},
                {"📍 Location",     esc(location)},
                {"📅 Created At",   now()}
            }) +
            alert("success", "✅ The outlet is now live and ready for stock and sales operations.")
        );
        send(adminEmail, subject, html);
    }

    @Override
    public void sendOutletUpdatedEmail(String adminEmail, String outletName, String outletCode) {
        String subject = "Outlet Updated: " + outletName;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>Outlet details have been updated.</p>" +
            infoCard(new String[][]{
                {"🏪 Outlet Name", esc(outletName)},
                {"🏷️ Outlet Code", badge(esc(outletCode), "info")},
                {"📅 Updated At",  now()}
            }) +
            alert("info", "ℹ️ Review the outlet record if these changes were unexpected.")
        );
        send(adminEmail, subject, html);
    }

    @Override
    public void sendOutletDeletedEmail(String adminEmail, String outletName, String outletCode) {
        String subject = "Outlet Deleted: " + outletName;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>An outlet has been <strong>permanently deleted</strong> from the system.</p>" +
            infoCard(new String[][]{
                {"🏪 Outlet Name", esc(outletName)},
                {"🏷️ Outlet Code", badge(esc(outletCode), "danger")},
                {"📅 Deleted At",  now()}
            }) +
            alert("danger",
                "🗑️ This action is irreversible. All associated outlet data has been removed.")
        );
        send(adminEmail, subject, html);
    }

    // ════════════════════════════════════════════════════════════════
    //  STOCK ORDERS
    // ════════════════════════════════════════════════════════════════

    @Override
    public void sendStockOrderCreatedEmail(String adminEmail, Long orderId, String orderCode,
                                           String outletName, String placedBy,
                                           BigDecimal totalAmount, int itemCount) {
        String subject = "New Stock Order Placed: " + orderCode;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>A new stock order has been placed and requires your attention.</p>" +
            infoCard(new String[][]{
                {"📋 Order Code",  badge(esc(orderCode), "info")},
                {"🏪 Outlet",      esc(outletName)},
                {"👤 Placed By",   esc(placedBy)},
                {"📦 Items",       String.valueOf(itemCount)},
                {"💰 Total Amount", "<strong style='color:#0f3460;font-size:18px'>₹" +
                                    (totalAmount != null ? totalAmount.toPlainString() : "0.00") + "</strong>"},
                {"🕐 Ordered At",  now()}
            }) +
            alert("warning",
                "📥 Please review and <strong>approve or reject</strong> this order promptly.")
        );
        send(adminEmail, subject, html);
    }

    @Override
    public void sendStockOrderApprovedEmail(String toEmail, Long orderId, String orderCode, String outletName) {
        String subject = "✅ Stock Order Approved: " + orderCode;
        String html = baseLayout(subject,
            "<p>Great news!</p>" +
            "<p>Your stock order has been <strong style='color:#065f46'>APPROVED</strong>.</p>" +
            infoCard(new String[][]{
                {"📋 Order Code", badge(esc(orderCode), "success")},
                {"🏪 Outlet",     esc(outletName)},
                {"✅ Status",      badge("APPROVED", "success")},
                {"📅 Approved At", now()}
            }) +
            alert("success",
                "🚚 Goods will be dispatched by the Inventory Management System shortly. " +
                "Please ensure your outlet is ready to receive the shipment.")
        );
        send(toEmail, subject, html);
    }

    @Override
    public void sendStockOrderCancelledEmail(String toEmail, Long orderId, String orderCode, String outletName) {
        String subject = "❌ Stock Order Cancelled: " + orderCode;
        String html = baseLayout(subject,
            "<p>Your stock order has been <strong style='color:#991b1b'>CANCELLED</strong>.</p>" +
            infoCard(new String[][]{
                {"📋 Order Code",  badge(esc(orderCode), "danger")},
                {"🏪 Outlet",      esc(outletName)},
                {"❌ Status",       badge("CANCELLED", "danger")},
                {"📅 Cancelled At", now()}
            }) +
            alert("danger",
                "⚠️ If you believe this cancellation was made in error, please place a new " +
                "order or contact your administrator.")
        );
        send(toEmail, subject, html);
    }

    // ════════════════════════════════════════════════════════════════
    //  PRODUCTS
    // ════════════════════════════════════════════════════════════════

    @Override
    public void sendProductCreatedEmail(String adminEmail, String productName, String productCode,
                                        String divisionName, BigDecimal sellingPrice) {
        String subject = "New Product Added: " + productName;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>A new product has been added to the catalog.</p>" +
            infoCard(new String[][]{
                {"📦 Product Name",  esc(productName)},
                {"🏷️ Product Code",  badge(esc(productCode), "info")},
                {"🗂️ Division",      esc(divisionName)},
                {"💰 Selling Price", "₹" + (sellingPrice != null ? sellingPrice.toPlainString() : "0.00")},
                {"📅 Added At",      now()}
            }) +
            alert("success", "✅ The product is now available for outlet assignments and sales.")
        );
        send(adminEmail, subject, html);
    }

    @Override
    public void sendProductDeletedEmail(String adminEmail, String productName, String productCode) {
        String subject = "Product Deleted: " + productName;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>A product has been <strong>removed</strong> from the catalog.</p>" +
            infoCard(new String[][]{
                {"📦 Product Name", esc(productName)},
                {"🏷️ Product Code", badge(esc(productCode), "danger")},
                {"📅 Deleted At",   now()}
            }) +
            alert("danger",
                "🗑️ This product has been permanently deleted and removed from all outlet " +
                "division mappings.")
        );
        send(adminEmail, subject, html);
    }

    // ════════════════════════════════════════════════════════════════
    //  SALES
    // ════════════════════════════════════════════════════════════════

    @Override
    public void sendSaleCompletedEmail(String adminEmail, String referenceNo, String outletName,
                                       BigDecimal totalAmount, String soldBy, int itemCount) {
        String subject = "Sale Completed: " + referenceNo;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>A sale transaction has been successfully completed.</p>" +
            infoCard(new String[][]{
                {"🧾 Reference No",  badge(esc(referenceNo), "success")},
                {"🏪 Outlet",        esc(outletName)},
                {"👤 Sold By",       esc(soldBy)},
                {"📦 Items Sold",    String.valueOf(itemCount)},
                {"💰 Total Amount",  "<strong style='color:#065f46;font-size:20px'>₹" +
                                     (totalAmount != null ? totalAmount.toPlainString() : "0.00") + "</strong>"},
                {"🕐 Sale Time",     now()}
            }) +
            alert("success",
                "✅ Stock has been deducted via FEFO logic. Sale records are now saved.")
        );
        send(adminEmail, subject, html);
    }

    // ════════════════════════════════════════════════════════════════
    //  BATCHES
    // ════════════════════════════════════════════════════════════════

    @Override
    public void sendBatchReceivedEmail(String adminEmail, String batchCode, String outletName,
                                       String productName, int quantity) {
        String subject = "Batch Received: " + batchCode;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>A new inventory batch has been received and recorded.</p>" +
            infoCard(new String[][]{
                {"📦 Batch Code",   badge(esc(batchCode), "info")},
                {"🏪 Outlet",       esc(outletName)},
                {"🛒 Product",      esc(productName)},
                {"🔢 Quantity",     String.valueOf(quantity) + " units"},
                {"📅 Received At",  now()}
            }) +
            alert("success",
                "✅ Stock has been updated. Products are now available for sale via FEFO deduction.")
        );
        send(adminEmail, subject, html);
    }

    @Override
    public void sendProductUpdatedEmail(String adminEmail, String productName, String productCode, BigDecimal newSellingPrice) {
        String subject = "Product Updated: " + productName;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>A product in the catalog has been updated.</p>" +
            infoCard(new String[][]{
                {"📦 Product Name",  esc(productName)},
                {"🏷️ Product Code",  badge(esc(productCode), "info")},
                {"💰 Selling Price", "₹" + (newSellingPrice != null ? newSellingPrice.toPlainString() : "0.00")},
                {"📅 Updated At",    now()}
            }) +
            alert("info", "ℹ️ Review the product details in the Product Catalog if this change was unexpected.")
        );
        send(adminEmail, subject, html);
    }

    @Override
    public void sendDivisionCreatedEmail(String adminEmail, String name) {
        String subject = "New Division Created: " + name;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>A new division has been successfully created.</p>" +
            infoCard(new String[][]{
                {"🗂️ Division Name", esc(name)},
                {"📅 Created At",     now()}
            }) +
            alert("success", "✅ Products can now be assigned to this division.")
        );
        send(adminEmail, subject, html);
    }

    @Override
    public void sendDivisionUpdatedEmail(String adminEmail, String oldName, String newName) {
        String subject = "Division Updated: " + newName;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>A division has been updated.</p>" +
            infoCard(new String[][]{
                {"⏮️ Old Name", esc(oldName)},
                {"⏭️ New Name", esc(newName)},
                {"📅 Updated At", now()}
            })
        );
        send(adminEmail, subject, html);
    }

    @Override
    public void sendDivisionDeletedEmail(String adminEmail, String name) {
        String subject = "Division Deleted: " + name;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>A division has been <strong>deleted</strong> from the system.</p>" +
            infoCard(new String[][]{
                {"🗂️ Division Name", esc(name)},
                {"📅 Deleted At",    now()}
            }) +
            alert("danger", "🗑️ Any products associated with this division have been unassigned.")
        );
        send(adminEmail, subject, html);
    }

    @Override
    public void sendLocationCreatedEmail(String adminEmail, String name) {
        String subject = "New Location Created: " + name;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>A new location has been registered.</p>" +
            infoCard(new String[][]{
                {"📍 Location Name", esc(name)},
                {"📅 Created At",    now()}
            }) +
            alert("success", "✅ Outlets can now be registered under this location.")
        );
        send(adminEmail, subject, html);
    }

    @Override
    public void sendLocationUpdatedEmail(String adminEmail, String oldName, String newName) {
        String subject = "Location Updated: " + newName;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>A location name has been updated.</p>" +
            infoCard(new String[][]{
                {"⏮️ Old Name", esc(oldName)},
                {"⏭️ New Name", esc(newName)},
                {"📅 Updated At", now()}
            })
        );
        send(adminEmail, subject, html);
    }

    @Override
    public void sendLocationDeletedEmail(String adminEmail, String name) {
        String subject = "Location Deleted: " + name;
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>A location has been <strong>deleted</strong>.</p>" +
            infoCard(new String[][]{
                {"📍 Location Name", esc(name)},
                {"📅 Deleted At",    now()}
            }) +
            alert("danger", "🗑️ All outlets associated with this location have been removed.")
        );
        send(adminEmail, subject, html);
    }

    @Override
    public void sendImportCompletedEmail(String adminEmail, String entityType, int imported, int failed, String failedFileUrl) {
        String subject = "Data Import Completed: " + entityType;
        String statusType = (failed == 0) ? "success" : "warning";
        String html = baseLayout(subject,
            "<p>Hello <strong>Administrator</strong>,</p>" +
            "<p>A data import process has completed.</p>" +
            infoCard(new String[][]{
                {"📂 Import Type",   esc(entityType)},
                {"✅ Successfully Imported", String.valueOf(imported) + " records"},
                {"❌ Failed / Skipped",      String.valueOf(failed) + " records"},
                {"📅 Completed At",   now()}
            }) +
            (failed > 0 && failedFileUrl != null ? 
                alert("warning", "⚠️ Some rows failed to import. You can download the failed records error report here:<br/>" +
                      "<a href='" + esc(failedFileUrl) + "' style='color:#78350f;font-weight:bold;text-decoration:underline;'>Download Failed Records Report</a>") :
                alert("success", "✅ Import finished with zero errors."))
        );
        send(adminEmail, subject, html);
    }

    // ════════════════════════════════════════════════════════════════
    //  PRIVATE HELPERS — HTML BUILDERS
    // ════════════════════════════════════════════════════════════════

    /** Full email HTML page with branded header + footer wrapped around body content. */
    private String baseLayout(String title, String bodyContent) {
        return "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'/>" +
               "<meta name='viewport' content='width=device-width,initial-scale=1'/>" +
               "<title>" + esc(title) + "</title></head><body style='" +
               "margin:0;padding:0;background:#f0f2f5;font-family:Segoe UI,Arial,sans-serif;'>" +
               "<table width='100%' cellpadding='0' cellspacing='0' border='0'>" +
               "<tr><td align='center' style='padding:32px 16px'>" +
               "<table width='620' cellpadding='0' cellspacing='0' border='0' style='max-width:620px;width:100%'>" +

               // ── Header ──────────────────────────────────────────
               "<tr><td style='background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);" +
               "border-radius:16px 16px 0 0;padding:32px 40px;text-align:center'>" +
               "<div style='font-size:12px;letter-spacing:3px;text-transform:uppercase;" +
               "color:#e94560;font-weight:700;margin-bottom:8px'>⚡ OUTLET MANAGEMENT SYSTEM</div>" +
               "<div style='font-size:22px;font-weight:800;color:#ffffff'>" + esc(title) + "</div>" +
               "</td></tr>" +

               // ── Body ────────────────────────────────────────────
               "<tr><td style='background:#ffffff;padding:36px 40px;color:#1a1a2e;" +
               "font-size:15px;line-height:1.7'>" +
               bodyContent +
               "<p style='font-size:13px;color:#9ca3af;margin-top:24px'>📅 Generated at: " + now() + "</p>" +
               "</td></tr>" +

               // ── Footer ──────────────────────────────────────────
               "<tr><td style='background:#f8f9ff;border-top:1px solid #e3e6f0;" +
               "border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;" +
               "font-size:12px;color:#9ca3af;line-height:1.8'>" +
               "<strong style='color:#6b7280'>Outlet Management System</strong><br/>" +
               "This is an automated notification — do not reply to this email.<br/>" +
               "© 2025 Outlet Management. All rights reserved." +
               "</td></tr>" +

               "</table></td></tr></table></body></html>";
    }

    /** Renders a bordered info-card table with label/value rows. */
    private String infoCard(String[][] rows) {
        StringBuilder sb = new StringBuilder();
        sb.append("<table width='100%' cellpadding='0' cellspacing='0' border='0' style='" +
                  "background:#f8f9ff;border:1px solid #e3e6f0;border-radius:12px;" +
                  "margin:20px 0;overflow:hidden'>");
        for (String[] row : rows) {
            sb.append("<tr style='border-bottom:1px solid #eaedf5'>")
              .append("<td style='padding:12px 20px;font-size:14px;color:#6b7280;" +
                      "font-weight:600;white-space:nowrap;width:45%'>").append(row[0]).append("</td>")
              .append("<td style='padding:12px 20px;font-size:14px;color:#1a1a2e;" +
                      "font-weight:500;text-align:right'>").append(row[1]).append("</td>")
              .append("</tr>");
        }
        sb.append("</table>");
        return sb.toString();
    }

    /** Renders a coloured alert box. type: success | info | warning | danger */
    private String alert(String type, String message) {
        String bg, border, color;
        switch (type) {
            case "success" -> { bg = "#f0fdf4"; border = "#22c55e"; color = "#14532d"; }
            case "warning" -> { bg = "#fffbeb"; border = "#f59e0b"; color = "#78350f"; }
            case "danger"  -> { bg = "#fff1f2"; border = "#f43f5e"; color = "#881337"; }
            default        -> { bg = "#eff6ff"; border = "#3b82f6"; color = "#1e3a8a"; }
        }
        return "<div style='background:" + bg + ";border-left:4px solid " + border +
               ";border-radius:8px;padding:14px 18px;margin:16px 0;" +
               "font-size:14px;color:" + color + ";line-height:1.6'>" +
               message + "</div>";
    }

    /** Inline badge span — type: success | info | warning | danger | purple */
    private String badge(String text, String type) {
        String bg, color;
        switch (type) {
            case "success" -> { bg = "#d1fae5"; color = "#065f46"; }
            case "warning" -> { bg = "#fef3c7"; color = "#92400e"; }
            case "danger"  -> { bg = "#fee2e2"; color = "#991b1b"; }
            case "purple"  -> { bg = "#ede9fe"; color = "#5b21b6"; }
            default        -> { bg = "#dbeafe"; color = "#1e40af"; }
        }
        return "<span style='display:inline-block;background:" + bg + ";color:" + color +
               ";padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;" +
               "letter-spacing:0.5px;text-transform:uppercase'>" + text + "</span>";
    }

    /** Current timestamp formatted for email display. */
    private String now() {
        return LocalDateTime.now().format(FMT);
    }

    /** Basic HTML escaping — prevents XSS in dynamic values. */
    private String esc(String val) {
        if (val == null) return "";
        return val.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                  .replace("\"", "&quot;").replace("'", "&#39;");
    }

    /** Core send method — wraps MimeMessage creation and Mailtrap delivery. */
    private void send(String to, String subject, String htmlBody) {
        sendEmailWithAttachments(to, subject, htmlBody, null);
    }

    @Override
    public void sendEmailWithAttachments(String toEmail, String subject, String htmlBody, List<EmailAttachment> attachments) {
        try {
            EmailQueue queue = new EmailQueue();
            queue.setToAddress(toEmail);
            queue.setSubject(subject);
            queue.setBodyHtml(htmlBody);
            
            if (attachments != null && !attachments.isEmpty()) {
                List<String> paths = attachments.stream()
                        .map(EmailAttachment::getFilePath)
                        .filter(p -> p != null && !p.isEmpty())
                        .collect(Collectors.toList());
                if (!paths.isEmpty()) {
                    queue.setAttachmentPaths(objectMapper.writeValueAsString(paths));
                }
            }
            
            emailQueueRepository.save(queue);
            log.info("📥 Queued email → to={} | subject={}", toEmail, subject);
        } catch (Exception e) {
            log.error("❌ Failed to queue email → to={} | subject={} | error={}", toEmail, subject, e.getMessage(), e);
        }
    }

}
