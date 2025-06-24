package com.inventory.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class POSummaryDTO {
    private String poNumber;
    private Integer totalDevices;
    private Integer linkedAssetsCount;
    private Integer remainingAssets;
    private boolean canCreateMoreAssets;
    
    // Helper method to calculate remaining assets
    public Integer getRemainingAssets() {
        if (totalDevices == null || linkedAssetsCount == null) {
            return 0;
        }
        return Math.max(0, totalDevices - linkedAssetsCount);
    }
    
    // Helper method to check if more assets can be created
    public boolean getCanCreateMoreAssets() {
        return getRemainingAssets() > 0;
    }
} 