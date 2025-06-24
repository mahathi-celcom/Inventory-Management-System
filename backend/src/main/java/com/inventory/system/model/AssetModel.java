package com.inventory.system.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "asset_model")
public class AssetModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "model_id")
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "make_id", nullable = false, referencedColumnName = "make_id")
    private AssetMake make;

    @Column(name = "model_name", nullable = false)
    private String name;

    private String ram;
    private String storage;
    private String processor;
    
    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(255) DEFAULT 'Active'")
    private String status = "Active";
} 