package com.example.outletmanagement.model.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "form_schemas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormSchema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;           // e.g. "Stock Audit Q3"
    
    private String description;
    
    private String category;       // STOCK_AUDIT | OUTLET_SURVEY | CUSTOM
    
    @Lob
    private String fieldsJson;     // JSON array of field definitions
    
    private Boolean active;
    
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
