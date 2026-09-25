package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.ImsPortalDto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ImsPortalService {
    Page<ImsPortalOrderResponseDto> getIncomingOrders(String status, Pageable pageable);
    ImsPortalOrderResponseDto getOrderDetail(Long orderId);
    void approveOrder(Long orderId, ImsPortalApproveRequestDto request);
    void rejectOrder(Long orderId, ImsPortalRejectRequestDto request);
    void dispatchOrder(Long orderId, ImsPortalDispatchRequestDto request);

    Page<ImsPortalReturnResponseDto> getIncomingReturns(String status, Pageable pageable);
    ImsPortalReturnResponseDto getReturnDetail(String returnCode);
    void acknowledgeReturn(String returnCode, ImsPortalReturnActionDto request);
    void pickupReturn(String returnCode, ImsPortalReturnActionDto request);
    void completeReturn(String returnCode, ImsPortalReturnActionDto request);
}
