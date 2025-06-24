package com.inventory.system.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "os_version")
public class OSVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "os_version_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "os_id")
    private OS os;

    @Column(name = "version", nullable = false)
    private String versionNumber;
    
    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(255) DEFAULT 'Active'")
    private String status = "Active";
} 