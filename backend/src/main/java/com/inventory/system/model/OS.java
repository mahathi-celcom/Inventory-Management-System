package com.inventory.system.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "os")
public class OS {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "os_id")
    private Long id;

    @Column(name = "os_type", nullable = false)
    private String osType;
    
    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(255) DEFAULT 'Active'")
    private String status = "Active";
} 