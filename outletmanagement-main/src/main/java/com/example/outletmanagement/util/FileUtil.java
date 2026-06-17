package com.example.outletmanagement.util;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.web.multipart.MultipartFile;

public class FileUtil {

    /**
     * Parses a CSV or Excel file into a list of string arrays.
     * Includes the header row (index 0).
     */
    public static List<String[]> parseFile(MultipartFile file, int expectedColumns) throws Exception {
        String filename = file.getOriginalFilename();
        if (filename != null && (filename.endsWith(".xlsx") || filename.endsWith(".xls"))) {
            return parseExcel(file, expectedColumns);
        } else {
            return parseCsv(file);
        }
    }

    private static List<String[]> parseCsv(MultipartFile file) throws Exception {
        List<String[]> data = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;
                String[] cols = line.split(",", -1);
                data.add(cols);
            }
        }
        return data;
    }

    private static List<String[]> parseExcel(MultipartFile file, int expectedColumns) throws Exception {
        List<String[]> data = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            for (Row row : sheet) {
                // Determine length based on either the actual cell count or expected columns
                int colsToRead = Math.max((int) row.getLastCellNum(), expectedColumns);
                String[] rowData = new String[colsToRead];
                boolean isEmptyRow = true;
                for (int i = 0; i < colsToRead; i++) {
                    Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    String val = cell == null ? "" : formatter.formatCellValue(cell).trim();
                    rowData[i] = val;
                    if (!val.isEmpty()) isEmptyRow = false;
                }
                if (!isEmptyRow) {
                    data.add(rowData);
                }
            }
        }
        return data;
    }
}
