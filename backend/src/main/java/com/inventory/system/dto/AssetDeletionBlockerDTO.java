package com.inventory.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetDeletionBlockerDTO {
    private Long assetId;
    private String assetTag;
    private String name;
    private String status;
    private String assignedTo;
    private String reason;
    
    public static AssetDeletionBlockerDTO fromAsset(AssetDTO asset, String reason) {
        return AssetDeletionBlockerDTO.builder()
                .assetId(asset.getAssetId())
                .assetTag(asset.getItAssetCode())
                .name(asset.getName())
                .status(asset.getStatus())
                .assignedTo(asset.getCurrentUserId() != null ? "User ID: " + asset.getCurrentUserId() : null)
                .reason(reason)
                .build();
    }
} 