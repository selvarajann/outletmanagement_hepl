package com.example.outletmanagement.payload.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FailedRow {
    private int rowNumber;
    private String[] originalValues;
    private String errorMessage;
}
