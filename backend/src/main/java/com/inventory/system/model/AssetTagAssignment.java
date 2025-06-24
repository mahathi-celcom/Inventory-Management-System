package com.inventory.system.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "asset_tag_assignment")
@IdClass(AssetTagAssignmentId.class)
public class AssetTagAssignment {
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id")
    private Asset asset;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tag_id")
    private AssetTag tag;
} 