package com.example.outletmanagement.controller;

import com.example.outletmanagement.model.entity.FormResponse;
import com.example.outletmanagement.model.entity.FormSchema;
import com.example.outletmanagement.payload.response.ApiResponse;
import com.example.outletmanagement.service.FormBuilderService;
import com.example.outletmanagement.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/forms")
@RequiredArgsConstructor
public class FormBuilderController {

    private final FormBuilderService formBuilderService;
    private final JwtUtil jwtUtil;

    private String extractUsername(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                return jwtUtil.extractUsername(token);
            } catch (Exception e) {
                // Ignore
            }
        }
        return "unknown";
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FormSchema>>> getAllForms() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Forms fetched successfully", formBuilderService.getAllFormSchemas()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FormSchema>> getForm(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Form fetched successfully", formBuilderService.getFormSchema(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FormSchema>> createForm(@RequestBody FormSchema schema, HttpServletRequest request) {
        String username = extractUsername(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Form created successfully", formBuilderService.createFormSchema(schema, username)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FormSchema>> updateForm(@PathVariable Long id, @RequestBody FormSchema schema) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Form updated successfully", formBuilderService.updateFormSchema(id, schema)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteForm(@PathVariable Long id) {
        formBuilderService.deleteFormSchema(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Form deleted successfully", null));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<FormResponse>> submitForm(@PathVariable Long id, @RequestBody SubmitRequest submitRequest, HttpServletRequest request) {
        String username = extractUsername(request);
        FormResponse response = formBuilderService.submitFormResponse(id, username, submitRequest.getAnswersJson());
        return ResponseEntity.ok(new ApiResponse<>(true, "Form submitted successfully", response));
    }

    @GetMapping("/{id}/responses")
    public ResponseEntity<ApiResponse<List<FormResponse>>> getFormResponses(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Form responses fetched successfully", formBuilderService.getFormResponses(id)));
    }

    @Data
    public static class SubmitRequest {
        private String answersJson;
    }
}
