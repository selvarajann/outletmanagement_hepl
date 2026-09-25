package com.example.outletmanagement.repository;

import com.example.outletmanagement.model.entity.FormResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FormResponseRepository extends JpaRepository<FormResponse, Long> {
    List<FormResponse> findByFormSchemaId(Long formSchemaId);
}
