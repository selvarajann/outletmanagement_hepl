package com.example.outletmanagement.payload.dto.UserDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.example.outletmanagement.validation.ValidPassword;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRequest {
    private String username;
    private String email;
    @ValidPassword
    private String password;
    private String role;
    private boolean active = true;
}
