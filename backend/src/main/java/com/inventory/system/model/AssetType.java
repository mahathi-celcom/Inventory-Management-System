package com.inventory.system.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Data
@Entity
@Table(name = "asset_type")
public class AssetType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "type_id")
    private Long id;

    @Column(name = "asset_type_name", nullable = false)
    private String name;

    private String description;
    
    @Column(name = "category")
    private String assetCategory; // "Hardware" or "Software"
    
    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(255) DEFAULT 'Active'")
    private String status = "Active";
    
    @OneToMany(mappedBy = "assetType", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<AssetMake> assetMakes;

    // Helper methods for category checking
    public boolean isHardware() {
        return "Hardware".equalsIgnoreCase(this.assetCategory) || "HARDWARE".equalsIgnoreCase(this.assetCategory);
    }

    public boolean isSoftware() {
        return "Software".equalsIgnoreCase(this.assetCategory) || "SOFTWARE".equalsIgnoreCase(this.assetCategory);
    }
} 