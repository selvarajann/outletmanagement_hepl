package com.example.outletmanagement.model.entity;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "location_id")
private Location location;

    // @ManyToMany
    // @JoinTable(
    //     name = "outlet_divisions",
    //     joinColumns = @JoinColumn(name = "outlet_id"),
    //     inverseJoinColumns = @JoinColumn(name = "division_id")
    // )
    // private List<Division> divisions;
    // private List<Products> products;
    @OneToMany(mappedBy = "outlet", cascade = CascadeType.ALL, orphanRemoval = true)
@JsonIgnore
private List<OutletDivisionProduct> mappings;
    private String createdBy;
    private String updatedBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}