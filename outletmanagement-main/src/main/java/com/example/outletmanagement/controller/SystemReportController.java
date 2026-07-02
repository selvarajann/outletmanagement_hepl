package com.example.outletmanagement.controller;

import com.example.outletmanagement.model.entity.SystemReport;
import com.example.outletmanagement.service.SystemReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class SystemReportController {

    private final SystemReportService service;

    @GetMapping
    public ResponseEntity<Page<SystemReport>> getReports(Pageable pageable) {
        return ResponseEntity.ok(service.getReports(pageable));
    }
}
