package com.example.outletmanagement.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.outletmanagement.model.entity.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE n.targetUsername = :username OR (n.targetRole = :role AND n.targetUsername IS NULL) ORDER BY n.createdAt DESC")
    Page<Notification> findForUserAndRole(String username, String role, Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE (n.targetUsername = :username OR (n.targetRole = :role AND n.targetUsername IS NULL)) AND n.read = false")
    long countUnreadForUserAndRole(String username, String role);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE (n.targetUsername = :username OR (n.targetRole = :role AND n.targetUsername IS NULL)) AND n.read = false")
    void markAllReadForUserAndRole(String username, String role);
}
