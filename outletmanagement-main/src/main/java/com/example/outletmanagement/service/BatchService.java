package com.example.outletmanagement.service;

import com.example.outletmanagement.model.entity.StockOrder;
import com.example.outletmanagement.payload.dto.BatchDto.BatchCreateRequest;
import com.example.outletmanagement.payload.dto.BatchDto.BatchItemRequest;
import com.example.outletmanagement.payload.dto.BatchDto.BatchReceiveRequest;
import com.example.outletmanagement.payload.dto.BatchDto.BatchResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;

public interface BatchService {
    /** Internal: creates a batch from a stock order (PENDING_RECEIPT status). */
    void createBatchFromOrder(StockOrder order);

    /** Manual: outlet admin creates a batch record when goods arrive from IMS. */
    BatchResponse createBatch(BatchCreateRequest request, String createdBy);

    Page<BatchResponse> getAllBatches(String keyword, Long outletId, String status, LocalDate fromDate, LocalDate toDate, Pageable pageable);
    BatchResponse getBatchById(Long id);

    /** Records receipt of a batch with mfg/expiry dates; triggers stock update. */
    BatchResponse receiveBatch(Long id, BatchReceiveRequest request, String receivedBy);

    /** @deprecated Kept for backward compatibility; delegates to receiveBatch. */
    @Deprecated
    BatchResponse deliverBatch(Long id);

    BatchResponse cancelBatch(Long id);
    BatchResponse updateBatchItemPrices(Long id, List<BatchItemRequest> items);
}
