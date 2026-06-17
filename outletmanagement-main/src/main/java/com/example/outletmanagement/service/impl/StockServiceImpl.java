package com.example.outletmanagement.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.outletmanagement.exception.InsufficientStockException;
import com.example.outletmanagement.model.entity.BatchItem;
import com.example.outletmanagement.model.entity.Outlet;
import com.example.outletmanagement.model.entity.Products;
import com.example.outletmanagement.model.entity.Stock;
import com.example.outletmanagement.payload.dto.StockDto.StockResponse;
import com.example.outletmanagement.payload.dto.StockDto.StockSummaryResponse;
import com.example.outletmanagement.repository.BatchItemRepository;
import com.example.outletmanagement.repository.StockRepository;
import com.example.outletmanagement.service.StockService;
import com.example.outletmanagement.specification.StockSpecification;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {

    private final StockRepository stockRepository;
    private final BatchItemRepository batchItemRepository;

    @Override
    @Transactional
    public void upsertStock(Outlet outlet, Products product, int quantity, String batchCode) {
        Stock stock = stockRepository.findByOutlet_IdAndProduct_Id(outlet.getId(), product.getId())
                .orElse(new Stock());

        if (stock.getId() == null) {
            stock.setOutlet(outlet);
            stock.setProduct(product);
            stock.setQuantity(quantity);
        } else {
            stock.setQuantity(stock.getQuantity() + quantity);
        }

        stock.setLastBatchCode(batchCode);
        stock.setLastUpdatedAt(LocalDateTime.now());
        stockRepository.save(stock);
    }

    /**
     * FEFO deduction: deducts quantitySold from the earliest-expiry batch items first.
     * <ol>
     *   <li>Loads BatchItems ordered by expiryDate ASC (FEFO query)</li>
     *   <li>Deducts from each batch item in order until the total is satisfied</li>
     *   <li>Decrements Stock.quantity by the total sold</li>
     *   <li>Returns a list of DeductionResult records for audit trail creation by the caller</li>
     * </ol>
     */
    @Override
    @Transactional
    public List<DeductionResult> deductStockFEFO(Outlet outlet, Products product, int quantitySold) {
        List<BatchItem> available = batchItemRepository
                .findAvailableByOutletAndProductFEFO(outlet.getId(), product.getId());

        int totalAvailable = available.stream().mapToInt(BatchItem::getRemainingQuantity).sum();
        if (totalAvailable < quantitySold) {
            throw new InsufficientStockException(product.getId(), product.getName(), quantitySold, totalAvailable);
        }

        List<DeductionResult> results = new ArrayList<>();
        int remaining = quantitySold;

        for (BatchItem item : available) {
            if (remaining <= 0) break;
            int deduct = Math.min(item.getRemainingQuantity(), remaining);
            item.setRemainingQuantity(item.getRemainingQuantity() - deduct);
            batchItemRepository.save(item);
            results.add(new DeductionResult(item, deduct));
            remaining -= deduct;
        }

        // Decrement aggregate stock counter
        Stock stock = stockRepository.findByOutlet_IdAndProduct_Id(outlet.getId(), product.getId())
                .orElseThrow(() -> new RuntimeException("Stock record not found for product: " + product.getId()));
        stock.setQuantity(Math.max(0, stock.getQuantity() - quantitySold));
        stock.setLastUpdatedAt(LocalDateTime.now());
        stockRepository.save(stock);

        return results;
    }

    @Override
    public Page<StockResponse> getAllStock(Long outletId, Long productId, String keyword, Pageable pageable) {
        Specification<Stock> spec = StockSpecification.searchAndFilter(outletId, productId, keyword);
        // FIX: page query runs via spec; mapToResponse accesses lazy relations.
        // The spec now uses explicit joins so no cross-join; relations are accessed per row.
        // For page results, Hibernate batch-fetching (spring.jpa.properties.hibernate.default_batch_fetch_size)
        // handles the remaining lazy loads efficiently. See StockSpecification for explicit join fix.
        return stockRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Override
    public List<StockResponse> getStockByOutlet(Long outletId) {
        // FIX: use fetch-join query — loads outlet+product+division in one SQL query
        return stockRepository.findByOutletIdWithDetails(outletId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<StockSummaryResponse> getStockSummary() {
        // FIX: use fetch-join query — loads all relations in one SQL query instead of lazy N+1
        List<Stock> allStock = stockRepository.findAllWithDetails();
        return allStock.stream()
                .collect(Collectors.groupingBy(s -> s.getOutlet().getId()))
                .entrySet().stream()
                .map(entry -> {
                    Long outletId = entry.getKey();
                    String outletName = entry.getValue().get(0).getOutlet().getOutletName();
                    long totalProducts = entry.getValue().size();
                    long outOfStock = entry.getValue().stream().filter(s -> s.getQuantity() <= 0).count();
                    BigDecimal totalValue = entry.getValue().stream()
                            .map(s -> s.getProduct().getSellingPrice().multiply(BigDecimal.valueOf(s.getQuantity())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new StockSummaryResponse(outletId, outletName, totalProducts, outOfStock, totalValue);
                })
                .collect(Collectors.toList());
    }

    private StockResponse mapToResponse(Stock stock) {
        StockResponse response = new StockResponse();
        response.setId(stock.getId());
        response.setOutletId(stock.getOutlet().getId());
        response.setOutletName(stock.getOutlet().getOutletName());
        response.setProductId(stock.getProduct().getId());
        response.setProductCode(stock.getProduct().getProductCode());
        response.setProductName(stock.getProduct().getName());
        response.setDivisionName(stock.getProduct().getDivision() != null ? stock.getProduct().getDivision().getName() : null);
        response.setQuantity(stock.getQuantity());
        response.setSellingPrice(stock.getProduct().getSellingPrice());
        response.setLastBatchCode(stock.getLastBatchCode());
        response.setLastUpdatedAt(stock.getLastUpdatedAt());
        return response;
    }
}
