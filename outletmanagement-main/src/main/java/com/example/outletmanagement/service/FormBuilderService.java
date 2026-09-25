package com.example.outletmanagement.service;

import com.example.outletmanagement.model.entity.FormResponse;
import com.example.outletmanagement.model.entity.FormSchema;
import com.example.outletmanagement.repository.FormResponseRepository;
import com.example.outletmanagement.repository.FormSchemaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FormBuilderService {

    private final FormSchemaRepository formSchemaRepository;
    private final FormResponseRepository formResponseRepository;

    public List<FormSchema> getAllFormSchemas() {
        return formSchemaRepository.findAll();
    }

    public FormSchema getFormSchema(Long id) {
        return formSchemaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Form Schema not found"));
    }

    @Transactional
    public FormSchema createFormSchema(FormSchema schema, String createdBy) {
        schema.setCreatedBy(createdBy);
        schema.setActive(true);
        return formSchemaRepository.save(schema);
    }

    @Transactional
    public FormSchema updateFormSchema(Long id, FormSchema updatedSchema) {
        FormSchema existing = getFormSchema(id);
        existing.setName(updatedSchema.getName());
        existing.setDescription(updatedSchema.getDescription());
        existing.setCategory(updatedSchema.getCategory());
        existing.setFieldsJson(updatedSchema.getFieldsJson());
        existing.setActive(updatedSchema.getActive() != null ? updatedSchema.getActive() : false);
        return formSchemaRepository.save(existing);
    }

    @Transactional
    public void deleteFormSchema(Long id) {
        formSchemaRepository.deleteById(id);
    }

    @Transactional
    public FormResponse submitFormResponse(Long formSchemaId, String submittedBy, String answersJson) {
        FormSchema schema = getFormSchema(formSchemaId);
        
        if (schema.getActive() == null || !schema.getActive()) {
            throw new RuntimeException("Cannot submit response to an inactive form");
        }

        FormResponse response = FormResponse.builder()
                .formSchemaId(formSchemaId)
                .submittedBy(submittedBy)
                .answersJson(answersJson)
                .build();
                
        return formResponseRepository.save(response);
    }

    public List<FormResponse> getFormResponses(Long formSchemaId) {
        return formResponseRepository.findByFormSchemaId(formSchemaId);
    }
}
