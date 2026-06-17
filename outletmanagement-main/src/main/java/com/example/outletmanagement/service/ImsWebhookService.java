package com.example.outletmanagement.service;

import com.example.outletmanagement.payload.dto.WebhookDto.ImsDispatchWebhookRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsDispatchWebhookResponseDto;

public interface ImsWebhookService {
    ImsDispatchWebhookResponseDto handleDispatch(ImsDispatchWebhookRequestDto request);
}
