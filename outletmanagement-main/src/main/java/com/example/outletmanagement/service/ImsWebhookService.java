package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.WebhookDto.ImsDispatchWebhookRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsDispatchWebhookResponseDto;

import com.example.outletmanagement.payload.dto.WebhookDto.ReturnAckRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ReturnAckResponseDto;

import com.example.outletmanagement.payload.dto.WebhookDto.ReturnPickupRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ReturnPickupResponseDto;

import com.example.outletmanagement.payload.dto.WebhookDto.ReturnCompletionRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ReturnCompletionResponseDto;

public interface ImsWebhookService {
    ImsDispatchWebhookResponseDto handleDispatch(ImsDispatchWebhookRequestDto request);
    ReturnAckResponseDto handleReturnAck(ReturnAckRequestDto request);
    ReturnPickupResponseDto handleReturnPickup(ReturnPickupRequestDto request);
    ReturnCompletionResponseDto handleReturnCompletion(ReturnCompletionRequestDto request);
}
