package com.example.outletmanagement.payload.dto.WebhookDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImsDispatchWebhookResponseDto {
    private String imsReferenceCode;
    private String shipmentCode;
    private String status;
}
