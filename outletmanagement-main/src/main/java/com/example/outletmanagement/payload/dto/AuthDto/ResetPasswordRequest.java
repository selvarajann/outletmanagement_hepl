package com.example.outletmanagement.payload.dto.AuthDto;

import com.example.outletmanagement.validation.ValidPassword;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String token;
    @ValidPassword
    private String newPassword;
}
