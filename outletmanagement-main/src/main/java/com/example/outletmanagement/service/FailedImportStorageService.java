package com.example.outletmanagement.service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class FailedImportStorageService {

    // Simple in-memory cache for temporary failed excel files.
    // In a massive enterprise system, this might be a Redis cache or a shared filesystem (S3).
    // For this scope, since the files are small and downloaded immediately, an in-memory map is highly efficient.
    private final Map<String, byte[]> fileCache = new ConcurrentHashMap<>();

    public String storeFile(byte[] fileData) {
        String fileId = UUID.randomUUID().toString();
        fileCache.put(fileId, fileData);
        return fileId;
    }

    public byte[] getFile(String fileId) {
        // We retrieve and immediately remove to free up memory (download once).
        return fileCache.remove(fileId);
    }
}
