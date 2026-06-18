package com.example.outletmanagement.controller;

import com.example.outletmanagement.payload.dto.WebhookDto.ImsDispatchWebhookRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ImsDispatchWebhookResponseDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ReturnAckRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ReturnAckResponseDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ReturnPickupRequestDto;
import com.example.outletmanagement.payload.dto.WebhookDto.ReturnPickupResponseDto;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.ImsWebhookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhook/ims")
@RequiredArgsConstructor
@Slf4j
public class ImsWebhookController {

    private final ImsWebhookService imsWebhookService;

    @Value("${ims.webhook-secret:oms-webhook-secret-2025}")
    private String webhookSecret;

    @PostMapping("/dispatch")
    public ResponseEntity<ApiResponse<ImsDispatchWebhookResponseDto>> handleDispatch(
            @RequestHeader(value = "X-Webhook-Secret", required = false) String secret,
            @Valid @RequestBody ImsDispatchWebhookRequestDto request) {

        if (secret == null || !secret.equals(webhookSecret)) {
            log.warn("Unauthorized webhook attempt. Invalid or missing secret.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Unauthorized: Invalid Webhook Secret", null));
        }

        try {
            ImsDispatchWebhookResponseDto response = imsWebhookService.handleDispatch(request);
            if ("IGNORED".equals(response.getStatus())) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Webhook ignored (duplicate IMS reference code)", response));
            }
            return ResponseEntity.ok(new ApiResponse<>(true, "Webhook processed successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to process webhook: " + e.getMessage(), null));
        }
    }

    @PostMapping("/return-ack")
    public ResponseEntity<ApiResponse<ReturnAckResponseDto>> handleReturnAck(
            @RequestHeader(value = "X-Webhook-Secret", required = false) String secret,
            @Valid @RequestBody ReturnAckRequestDto request) {

        if (secret == null || !secret.equals(webhookSecret)) {
            log.warn("Unauthorized webhook attempt. Invalid or missing secret.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Unauthorized: Invalid Webhook Secret", null));
        }

        try {
            ReturnAckResponseDto response = imsWebhookService.handleReturnAck(request);
            if ("IGNORED".equals(response.getProcessingStatus())) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Webhook ignored (duplicate or already acknowledged)", response));
            }
            return ResponseEntity.ok(new ApiResponse<>(true, "Webhook processed successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to process webhook: " + e.getMessage(), null));
        }
    }

    @PostMapping("/return-pickup")
    public ResponseEntity<ApiResponse<ReturnPickupResponseDto>> handleReturnPickup(
            @RequestHeader(value = "X-Webhook-Secret", required = false) String secret,
            @Valid @RequestBody ReturnPickupRequestDto request) {

        if (secret == null || !secret.equals(webhookSecret)) {
            log.warn("Unauthorized webhook attempt. Invalid or missing secret.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Unauthorized: Invalid Webhook Secret", null));
        }

        try {
            ReturnPickupResponseDto response = imsWebhookService.handleReturnPickup(request);
            if ("IGNORED".equals(response.getProcessingStatus())) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Webhook ignored (duplicate or already picked up)", response));
            }
            return ResponseEntity.ok(new ApiResponse<>(true, "Webhook processed successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to process webhook: " + e.getMessage(), null));
        }
    }
}
