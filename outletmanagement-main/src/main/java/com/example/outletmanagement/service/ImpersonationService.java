package com.example.outletmanagement.service;

import java.util.List;

import com.example.outletmanagement.payload.dto.ImpersonationDto.ImpersonationResponse;
import com.example.outletmanagement.payload.dto.ImpersonationDto.ImpersonationSessionDto;

public interface ImpersonationService {
    ImpersonationResponse startImpersonation(String adminUsername, Long targetUserId, String ipAddress);
    void endImpersonation(String adminUsername);
    List<ImpersonationSessionDto> getActiveSessions();
    List<ImpersonationSessionDto> getSessionHistory(String targetUsername);
    ImpersonationSessionDto getMyActiveSession(String adminUsername);
}
