package com.example.outletmanagement.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailTemplateService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    /** Full email HTML page with branded header + footer wrapped around body content. */
    public String baseLayout(String title, String bodyContent) {
        return "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'/>" +
               "<meta name='viewport' content='width=device-width,initial-scale=1'/>" +
               "<title>" + esc(title) + "</title>" +
               "<style>" +
               "body { margin:0; padding:0; background:#f0f2f5; font-family: 'Segoe UI', Arial, sans-serif; }" +
               "table { border-collapse: collapse; }" +
               ".main-container { width:100%; max-width:620px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05); }" +
               ".header { background-color:#0f3460; background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%); padding:32px 40px; text-align:center; }" +
               ".header-sub { font-size:12px; letter-spacing:3px; text-transform:uppercase; color:#e94560; font-weight:700; margin-bottom:8px; }" +
               ".header-title { font-size:22px; font-weight:800; color:#ffffff; }" +
               ".body-content { padding:36px 40px; color:#1a1a2e; font-size:15px; line-height:1.7; }" +
               ".footer { background:#f8f9ff; border-top:1px solid #e3e6f0; padding:20px 40px; text-align:center; font-size:12px; color:#9ca3af; line-height:1.8; }" +
               "</style>" +
               "</head><body>" +
               "<table width='100%' cellpadding='0' cellspacing='0' border='0'><tr><td align='center' style='padding:32px 16px'>" +
               "<div class='main-container'>" +
               "<div class='header'>" +
               "<div class='header-sub'>⚡ OUTLET MANAGEMENT SYSTEM</div>" +
               "<div class='header-title'>" + esc(title) + "</div>" +
               "</div>" +
               "<div class='body-content'>" +
               bodyContent +
               "<p style='font-size:13px; color:#9ca3af; margin-top:24px'>📅 Generated at: " + now() + "</p>" +
               "</div>" +
               "<div class='footer'>" +
               "<strong style='color:#6b7280'>Outlet Management System</strong><br/>" +
               "This is an automated report.<br/>" +
               "© 2025 Outlet Management. All rights reserved." +
               "</div>" +
               "</div>" +
               "</td></tr></table></body></html>";
    }

    /** Renders a bordered info-card table with label/value rows. */
    public String infoCard(String[][] rows) {
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
    public String alert(String type, String message) {
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
    public String badge(String text, String type) {
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
    public String now() {
        return LocalDateTime.now().format(FMT);
    }

    /** Basic HTML escaping — prevents XSS in dynamic values. */
    public String esc(String val) {
        if (val == null) return "";
        return val.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                  .replace("\"", "&quot;").replace("'", "&#39;");
    }

    /** Prominent download button for inline email viewing. */
    public String downloadButton(String url) {
        return "<div style='text-align:center; margin-top:30px; margin-bottom:10px;'>" +
               "<a href='" + url + "' style='display:inline-block; padding:14px 28px; background:#3b82f6; color:#ffffff; font-weight:600; text-decoration:none; border-radius:6px; font-size:15px; box-shadow:0 2px 4px rgba(0,0,0,0.1);'>Download PDF Report</a>" +
               "</div>";
    }

    /** Daily Sales Report HTML generator */
    public String dailySalesReport(java.util.List<com.example.outletmanagement.model.entity.SaleTransaction> sales, java.time.LocalDate date) {
        java.math.BigDecimal totalRevenue = java.math.BigDecimal.ZERO;
        int totalItems = 0;
        int totalTransactions = sales.size();

        for (com.example.outletmanagement.model.entity.SaleTransaction sale : sales) {
            totalRevenue = totalRevenue.add(sale.getTotalAmount());
            if (sale.getItems() != null) {
                totalItems += sale.getItems().stream().mapToInt(com.example.outletmanagement.model.entity.SaleTransactionItem::getQuantityDeducted).sum();
            }
        }

        StringBuilder content = new StringBuilder();
        content.append("<h2 style='color:#1e3a8a; font-size:20px; border-bottom:2px solid #e2e8f0; padding-bottom:10px; margin-bottom:20px'>Daily Sales Report for ")
               .append(date.format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy")))
               .append("</h2>");

        content.append(infoCard(new String[][]{
            {"Total Transactions", String.valueOf(totalTransactions)},
            {"Total Items Sold", String.valueOf(totalItems)},
            {"Total Revenue", "$" + totalRevenue.toPlainString()}
        }));

        if (sales.isEmpty()) {
            content.append(alert("warning", "No sales recorded for this date."));
            return baseLayout("Daily Sales Report", content.toString());
        }

        content.append("<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-top:20px; font-size:13px; text-align:left; border-collapse:collapse; border:1px solid #e2e8f0'>");
        content.append("<thead style='background:#f8fafc; color:#475569'>");
        content.append("<tr>");
        content.append("<th style='padding:12px; border-bottom:1px solid #e2e8f0'>Reference No</th>");
        content.append("<th style='padding:12px; border-bottom:1px solid #e2e8f0'>Outlet</th>");
        content.append("<th style='padding:12px; border-bottom:1px solid #e2e8f0'>Sold By</th>");
        content.append("<th style='padding:12px; border-bottom:1px solid #e2e8f0; text-align:right'>Amount</th>");
        content.append("</tr>");
        content.append("</thead>");
        content.append("<tbody>");

        for (com.example.outletmanagement.model.entity.SaleTransaction sale : sales) {
            String outletName = sale.getOutlet() != null ? sale.getOutlet().getOutletName() : "Unknown";
            content.append("<tr>");
            content.append("<td style='padding:12px; border-bottom:1px solid #e2e8f0'>").append(sale.getReferenceNo()).append("</td>");
            content.append("<td style='padding:12px; border-bottom:1px solid #e2e8f0'>").append(outletName).append("</td>");
            content.append("<td style='padding:12px; border-bottom:1px solid #e2e8f0'>").append(sale.getSoldBy()).append("</td>");
            content.append("<td style='padding:12px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:bold; color:#0f172a'>$").append(sale.getTotalAmount().toPlainString()).append("</td>");
            content.append("</tr>");
        }

        content.append("</tbody>");
        content.append("</table>");

        return baseLayout("Daily Sales Report", content.toString());
    }
}
