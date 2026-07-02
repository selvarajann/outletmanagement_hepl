package com.example.outletmanagement.payload.dto.WebhookDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Expected response format from IMS for Inventory Snapshot.
 * 
 * Example JSON:
 * {
 *   "timestamp": "2025-10-15T10:00:00Z",
 *   "items": [
 *     { "productCode": "P-100", "quantity": 500 },
 *     { "productCode": "P-101", "quantity": 120 }
 *   ]
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImsInventorySnapshotResponseDto {
    private String timestamp;
    private List<ImsSnapshotItemDto> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImsSnapshotItemDto {
        private String productCode;
        private Integer quantity;
    }
}
