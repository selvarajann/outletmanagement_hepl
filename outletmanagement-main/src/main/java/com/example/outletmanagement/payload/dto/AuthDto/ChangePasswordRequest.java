package com.example.outletmanagement.payload.dto.AuthDto;

import com.example.outletmanagement.validation.ValidPassword;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    private String oldPassword;
    @ValidPassword
    private String newPassword;
}
