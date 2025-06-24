package com.inventory.system.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.util.Set;
import java.util.HashSet;

@Data
@Entity
@Table(name = "asset_tag")
public class AssetTag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tag_id")
    private Long id;

    @Column(name = "tag_name", unique = true)
    private String name;

    // Many-to-many reverse relationship with Asset
    @ManyToMany(mappedBy = "assignedTags", fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Asset> assets = new HashSet<>();
} 