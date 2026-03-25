package com.example.outletmanagement.model.entity;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "outlets",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"outletName", "location_id"}
       ))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Outlet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String outletCode;

    @Column(nullable = false)
    private String outletName;

    private String address;
    private String outletType;
    private String ownerName;

    @ManyToOne
    @JoinColumn(name = "location_id")
    private Location location;

    @ManyToMany
    @JoinTable(
        name = "outlet_divisions",
        joinColumns = @JoinColumn(name = "outlet_id"),
        inverseJoinColumns = @JoinColumn(name = "division_id")
    )
    private List<Division> divisions;

    private String createdBy;
    private String updatedBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}