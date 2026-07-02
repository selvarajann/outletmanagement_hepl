package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.WebhookDto.ImsDispatchWebhookRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsDispatchWebhookResponseDto;

import com.example.outletmanagement.payload.dto.WebhookDto.ReturnAckRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ReturnAckResponseDto;

import com.example.outletmanagement.payload.dto.WebhookDto.ReturnPickupRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ReturnPickupResponseDto;

import com.example.outletmanagement.payload.dto.WebhookDto.ReturnCompletionRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ReturnCompletionResponseDto;

import com.example.outletmanagement.payload.dto.WebhookDto.ImsStockOrderStatusRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsStockOrderStatusResponseDto;

import com.example.outletmanagement.payload.dto.WebhookDto.ImsProductSyncRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsProductSyncResponseDto;

import com.example.outletmanagement.payload.dto.WebhookDto.ImsBatchSyncRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsBatchSyncResponseDto;

public interface ImsWebhookService {
    ImsBatchSyncResponseDto handleBatchSync(ImsBatchSyncRequestDto request);
    ImsProductSyncResponseDto handleProductSync(ImsProductSyncRequestDto request);
    ImsDispatchWebhookResponseDto handleDispatch(ImsDispatchWebhookRequestDto request);
    ReturnAckResponseDto handleReturnAck(ReturnAckRequestDto request);
    ReturnPickupResponseDto handleReturnPickup(ReturnPickupRequestDto request);
    ReturnCompletionResponseDto handleReturnCompletion(ReturnCompletionRequestDto request);
    ImsStockOrderStatusResponseDto handleStockOrderStatus(ImsStockOrderStatusRequestDto request);
}
