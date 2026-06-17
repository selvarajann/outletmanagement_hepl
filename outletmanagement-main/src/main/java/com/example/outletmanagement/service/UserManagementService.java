package com.example.outletmanagement.service;

import java.util.List;

import com.example.outletmanagement.payload.dto.UserDto.UserRequest;
import com.example.outletmanagement.payload.dto.UserDto.UserResponse;

public interface UserManagementService {
    List<UserResponse> getAllUsers();
    UserResponse createUser(UserRequest request);
    UserResponse updateUser(Long id, UserRequest request);
    void deleteUser(Long id);
}
