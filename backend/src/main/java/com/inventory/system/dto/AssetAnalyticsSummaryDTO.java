package com.inventory.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetAnalyticsSummaryDTO {
    
    // Asset count by status
    private Map<String, Long> assetCountByStatus;
    
    // Asset count by OS type
    private Map<String, Long> assetCountByOS;
    
    // Asset count by department and asset type (nested structure)
    private Map<String, Map<String, Long>> assetCountByDepartmentAndType;
    
    // Warranty status by asset type
    private Map<String, WarrantySummaryDTO> warrantyStatusByAssetType;
    
    // Asset aging summary
    private List<AssetAgingDTO> assetAging;
    
    // Asset count by category (Hardware/Software classification)
    private Map<String, Long> assetCountByCategory;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WarrantySummaryDTO {
        private String assetType;
        private Long inWarranty;
        private Long outOfWarranty;
        private Long noWarranty;
        private Long totalAssets;
        
        public double getInWarrantyPercentage() {
            return totalAssets > 0 ? (inWarranty * 100.0) / totalAssets : 0.0;
        }
        
        public double getOutOfWarrantyPercentage() {
            return totalAssets > 0 ? (outOfWarranty * 100.0) / totalAssets : 0.0;
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssetAgingDTO {
        private String ageRange;
        private Long count;
        private String department; // for filtered results
        private String assetType;  // for filtered results
    }
} 