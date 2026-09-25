package com.example.outletmanagement.service.impl;

import com.example.outletmanagement.model.entity.*;
import com.example.outletmanagement.payload.dto.ImsPortalDto.*;
import com.example.outletmanagement.payload.dto.WebhookDto.*;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsDispatchWebhookRequestDto.ImsDispatchItemDto;
import com.example.outletmanagement.repository.StockOrderRepository;
import com.example.outletmanagement.repository.StockReturnRepository;
import com.example.outletmanagement.service.ImsPortalService;
import com.example.outletmanagement.service.ImsWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImsPortalServiceImpl implements ImsPortalService {

    private final StockOrderRepository stockOrderRepository;
    private final StockReturnRepository stockReturnRepository;
    private final ImsWebhookService imsWebhookService;

    // ── Orders ───────────────────────────────────────────────────────────────

    @Override
    public Page<ImsPortalOrderResponseDto> getIncomingOrders(String status, Pageable pageable) {
        if (status != null && !status.isBlank()) {
            return stockOrderRepository.findAll(
                (root, query, cb) -> cb.equal(root.get("status"), status), pageable
            ).map(this::mapOrderToDto);
        }
        // Show all orders except CANCELLED/RECEIVED for IM portal
        return stockOrderRepository.findAll(
            (root, query, cb) -> cb.notEqual(root.get("status"), "CANCELLED"),
            pageable
        ).map(this::mapOrderToDto);
    }

    @Override
    public ImsPortalOrderResponseDto getOrderDetail(Long orderId) {
        StockOrder order = stockOrderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        return mapOrderToDto(order);
    }

    @Override
    @Transactional
    public void approveOrder(Long orderId, ImsPortalApproveRequestDto request) {
        StockOrder order = stockOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        if (!"PENDING_IMS".equals(order.getStatus())) {
            throw new IllegalStateException("Only PENDING_IMS orders can be approved. Current status: " + order.getStatus());
        }

        if (!"PAID".equals(order.getPaymentStatus())) {
            throw new IllegalStateException("Order must be PAID before approval. Current payment status: " + order.getPaymentStatus());
        }

        ImsStockOrderStatusRequestDto dto = new ImsStockOrderStatusRequestDto();
        dto.setOrderCode(order.getOrderCode());
        dto.setStatus("APPROVED");
        dto.setRemarks(request != null && request.getNotes() != null ? request.getNotes() : "Approved by Inventory Manager");
        imsWebhookService.handleStockOrderStatus(dto);
        log.info("IMS Portal: Approved order {}", order.getOrderCode());
    }

    @Override
    @Transactional
    public void rejectOrder(Long orderId, ImsPortalRejectRequestDto request) {
        StockOrder order = stockOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        if (!"PENDING_IMS".equals(order.getStatus()) && !"APPROVED".equals(order.getStatus())) {
            throw new IllegalStateException("Cannot reject order in status: " + order.getStatus());
        }

        ImsStockOrderStatusRequestDto dto = new ImsStockOrderStatusRequestDto();
        dto.setOrderCode(order.getOrderCode());
        dto.setStatus("REJECTED");
        dto.setRemarks("Rejected by Inventory Manager: " + request.getReason());
        imsWebhookService.handleStockOrderStatus(dto);
        log.info("IMS Portal: Rejected order {}", order.getOrderCode());
    }

    @Override
    @Transactional
    public void dispatchOrder(Long orderId, ImsPortalDispatchRequestDto request) {
        StockOrder order = stockOrderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        if (!"APPROVED".equals(order.getStatus()) && !"PENDING_IMS".equals(order.getStatus())) {
            throw new IllegalStateException("Only APPROVED or PENDING_IMS orders can be dispatched. Current: " + order.getStatus());
        }

        if (!"PAID".equals(order.getPaymentStatus())) {
            throw new IllegalStateException("Order must be PAID before dispatch. Current payment status: " + order.getPaymentStatus());
        }

        // Build per-item overrides map
        Map<String, ImsPortalDispatchRequestDto.ImsDispatchItemOverride> overrideMap =
            (request.getItemOverrides() != null)
                ? request.getItemOverrides().stream()
                    .collect(Collectors.toMap(
                        ImsPortalDispatchRequestDto.ImsDispatchItemOverride::getProductCode,
                        o -> o, (a, b) -> a))
                : Map.of();

        // Build webhook payload
        ImsDispatchWebhookRequestDto webhookPayload = new ImsDispatchWebhookRequestDto();
        webhookPayload.setImsReferenceCode("IMS-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase());
        webhookPayload.setOrderCode(order.getOrderCode());
        webhookPayload.setNotes("Carrier: " + request.getCarrier() + " | Tracking: " + request.getTrackingNumber());
        webhookPayload.setDispatchDate(LocalDate.now());

        List<ImsDispatchItemDto> items = order.getItems().stream().map(item -> {
            String code = item.getProduct().getProductCode();
            ImsPortalDispatchRequestDto.ImsDispatchItemOverride override = overrideMap.get(code);

            ImsDispatchItemDto dto = new ImsDispatchItemDto();
            dto.setProductCode(code);
            dto.setQuantityDispatched(item.getQuantityRequested());
            dto.setMfgDate(override != null && override.getMfgDate() != null
                ? override.getMfgDate() : LocalDate.now().minusMonths(2));
            dto.setExpiryDate(override != null && override.getExpiryDate() != null
                ? override.getExpiryDate() : LocalDate.now().plusYears(2));
            return dto;
        }).collect(Collectors.toList());

        webhookPayload.setItems(items);

        log.info("IMS Portal: Dispatching order {} via simulated webhook", order.getOrderCode());
        imsWebhookService.handleDispatch(webhookPayload);
    }

    // ── Stock Returns ────────────────────────────────────────────────────────

    @Override
    public Page<ImsPortalReturnResponseDto> getIncomingReturns(String status, Pageable pageable) {
        if (status != null && !status.isBlank()) {
            return stockReturnRepository.findAll(
                (root, query, cb) -> cb.equal(root.get("status").as(String.class), status), pageable
            ).map(this::mapReturnToDto);
        }
        return stockReturnRepository.findAll(pageable).map(this::mapReturnToDto);
    }

    @Override
    public ImsPortalReturnResponseDto getReturnDetail(String returnCode) {
        StockReturn ret = stockReturnRepository.findByReturnCode(returnCode)
                .orElseThrow(() -> new IllegalArgumentException("Return not found: " + returnCode));
        return mapReturnToDto(ret);
    }

    @Override
    @Transactional
    public void acknowledgeReturn(String returnCode, ImsPortalReturnActionDto request) {
        ReturnAckRequestDto dto = new ReturnAckRequestDto();
        dto.setReturnCode(returnCode);
        dto.setImsAckCode(request.getCode() != null ? request.getCode() : "ACK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        dto.setStatus("ACKNOWLEDGED");
        dto.setNotes(request.getNotes());
        imsWebhookService.handleReturnAck(dto);
        log.info("IMS Portal: Acknowledged return {}", returnCode);
    }

    @Override
    @Transactional
    public void pickupReturn(String returnCode, ImsPortalReturnActionDto request) {
        ReturnPickupRequestDto dto = new ReturnPickupRequestDto();
        dto.setReturnCode(returnCode);
        dto.setPickupReferenceCode(request.getCode() != null ? request.getCode() : "PKP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        dto.setNotes(request.getNotes());
        imsWebhookService.handleReturnPickup(dto);
        log.info("IMS Portal: Pickup initiated for return {}", returnCode);
    }

    @Override
    @Transactional
    public void completeReturn(String returnCode, ImsPortalReturnActionDto request) {
        ReturnCompletionRequestDto dto = new ReturnCompletionRequestDto();
        dto.setReturnCode(returnCode);
        dto.setCompletionReferenceCode(request.getCode() != null ? request.getCode() : "CMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        dto.setNotes(request.getNotes());
        imsWebhookService.handleReturnCompletion(dto);
        log.info("IMS Portal: Completed return {}", returnCode);
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private ImsPortalOrderResponseDto mapOrderToDto(StockOrder order) {
        ImsPortalOrderResponseDto dto = new ImsPortalOrderResponseDto();
        dto.setId(order.getId());
        dto.setOrderCode(order.getOrderCode());
        if (order.getOutlet() != null) {
            dto.setOutletId(order.getOutlet().getId());
            dto.setOutletName(order.getOutlet().getOutletName());
            dto.setOutletCode(order.getOutlet().getOutletCode());
        }
        dto.setRequestedDate(order.getRequestedDate());
        dto.setStatus(order.getStatus());
        dto.setImsPushStatus(order.getImsPushStatus());
        dto.setNotes(order.getNotes());
        dto.setCreatedBy(order.getCreatedBy());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setPaymentStatus(order.getPaymentStatus());

        if (order.getItems() != null) {
            List<ImsPortalOrderItemDto> itemDtos = order.getItems().stream().map(item -> {
                ImsPortalOrderItemDto idto = new ImsPortalOrderItemDto();
                idto.setId(item.getId());
                if (item.getProduct() != null) {
                    idto.setProductId(item.getProduct().getId());
                    idto.setProductCode(item.getProduct().getProductCode());
                    idto.setProductName(item.getProduct().getName());
                }
                idto.setQuantityRequested(item.getQuantityRequested());
                idto.setUnitPrice(item.getUnitPriceAtOrder());
                if (item.getUnitPriceAtOrder() != null && item.getQuantityRequested() != null) {
                    idto.setLineTotal(item.getUnitPriceAtOrder().multiply(BigDecimal.valueOf(item.getQuantityRequested())));
                }
                return idto;
            }).collect(Collectors.toList());
            dto.setItems(itemDtos);
            dto.setItemCount(itemDtos.size());
            dto.setTotalAmount(itemDtos.stream()
                .filter(i -> i.getLineTotal() != null)
                .map(ImsPortalOrderItemDto::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        }
        return dto;
    }

    private ImsPortalReturnResponseDto mapReturnToDto(StockReturn ret) {
        ImsPortalReturnResponseDto dto = new ImsPortalReturnResponseDto();
        dto.setId(ret.getId());
        dto.setReturnCode(ret.getReturnCode());
        dto.setStatus(ret.getStatus().name());
        dto.setReason(ret.getReason());
        dto.setNotes(ret.getNotes());
        dto.setCreatedBy(ret.getCreatedBy());
        dto.setImsAckCode(ret.getImsAckCode());
        dto.setPickupReferenceCode(ret.getPickupReferenceCode());
        dto.setCompletionReferenceCode(ret.getCompletionReferenceCode());
        dto.setCreatedAt(ret.getCreatedAt());

        if (ret.getOutlet() != null) {
            dto.setOutletName(ret.getOutlet().getOutletName());
        }
        if (ret.getBatch() != null) {
            dto.setBatchCode(ret.getBatch().getBatchCode());
        }

        if (ret.getItems() != null) {
            List<ImsPortalReturnResponseDto.ImsPortalReturnItemDto> items = ret.getItems().stream().map(item -> {
                ImsPortalReturnResponseDto.ImsPortalReturnItemDto idto = new ImsPortalReturnResponseDto.ImsPortalReturnItemDto();
                idto.setId(item.getId());
                idto.setQuantity(item.getQuantityReturned());
                idto.setNotes(item.getDefectDescription());
                if (item.getBatchItem() != null && item.getBatchItem().getProduct() != null) {
                    idto.setProductCode(item.getBatchItem().getProduct().getProductCode());
                    idto.setProductName(item.getBatchItem().getProduct().getName());
                }
                return idto;
            }).collect(Collectors.toList());
            dto.setItems(items);
        }
        return dto;
    }
}
