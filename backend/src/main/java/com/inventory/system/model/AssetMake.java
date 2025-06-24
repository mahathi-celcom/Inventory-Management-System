package com.inventory.system.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "asset_make")
public class AssetMake {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "make_id")
    private Long id;

    @Column(name = "make_name", nullable = false)
    private String name;
    
    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(255) DEFAULT 'Active'")
    private String status = "Active";
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id", referencedColumnName = "type_id")
    private AssetType assetType;
} 