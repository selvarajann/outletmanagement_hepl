package com.example.outletmanagement.payload.dto.sarvam;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SarvamRequestDto {
    private String model;
    private List<SarvamMessage> messages;
    private Double temperature;
    private Integer max_tokens;
    private Double top_p;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SarvamMessage {
        private String role; // system, user, assistant
        private String content;
    }
}
