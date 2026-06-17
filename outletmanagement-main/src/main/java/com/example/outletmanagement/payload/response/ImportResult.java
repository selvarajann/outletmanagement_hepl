package com.example.outletmanagement.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportResult {
    private boolean success;
    private int imported;
    private int failed;
    private int skipped;
    private String failedFileUrl;
}
