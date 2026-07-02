package com.example.outletmanagement.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;

@Service
public class PdfGeneratorService {

    /**
     * Converts an HTML string into a PDF byte array.
     * Uses Jsoup to sanitize and convert HTML to strict XHTML required by Flying Saucer.
     */
    public byte[] generatePdfFromHtml(String html) throws Exception {
        // 1. Sanitize HTML for Flying Saucer (strip emojis and fix problematic CSS)
        String safeHtml = html
            // Remove common emoji ranges that break standard PDF fonts
            .replaceAll("[\\x{1F300}-\\x{1F6FF}|\\x{2600}-\\x{26FF}|\\x{2700}-\\x{27BF}|\\x{1F900}-\\x{1F9FF}|\\x{1F1E0}-\\x{1F1FF}]", "")
            // Remove CSS that causes Flying Saucer to render blank pages or incorrectly
            .replace("overflow:hidden;", "")
            .replace("border-radius:16px;", "")
            .replace("border-radius:12px;", "")
            .replace("max-width:620px;", "width:620px;")
            .replace("box-shadow:0 4px 12px rgba(0,0,0,0.05);", "");

        Document doc = Jsoup.parse(safeHtml, "UTF-8");
        doc.outputSettings().syntax(Document.OutputSettings.Syntax.xml);
        String xhtml = doc.html();

        // 2. Render PDF
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            // Set base URL empty so it doesn't fail on relative links
            renderer.setDocumentFromString(xhtml, "");
            renderer.layout();
            renderer.createPDF(os);
            return os.toByteArray();
        }
    }
}
