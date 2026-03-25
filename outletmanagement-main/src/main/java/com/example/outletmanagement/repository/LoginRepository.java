package com.example.outletmanagement.repository;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.outletmanagement.model.entity.Login;
@Repository
public interface LoginRepository extends JpaRepository<Login,Long> {
    Optional<Login> findByUsername(String username);
    Optional<Login> findByEmail(String email);
    boolean existsByUsername(String username);  
    Boolean existsByEmail(String email);
}