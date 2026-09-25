package com.example.outletmanagement.payload.dto.ImsPortalDto;

import lombok.Data;

@Data
public class ImsPortalReturnActionDto {
    private String code;   // ackCode / pickupCode / completionCode
    private String notes;
}
