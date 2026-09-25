package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.FormSchema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FormSchemaRepository extends JpaRepository<FormSchema, Long> {
}
