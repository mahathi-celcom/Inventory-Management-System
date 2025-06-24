package com.inventory.system.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.ArrayList;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkAssetResponse {
    private int successCount;
    private int failureCount;
    private int totalProcessed;
    
    @Builder.Default
    private List<BulkAssetError> errors = new ArrayList<>();
    
    @Builder.Default
    private List<AssetDTO> successfulAssets = new ArrayList<>();
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkAssetError {
        private int index; // Index in the original request list
        private String field; // Field that caused the error (if applicable)
        private String message; // Error message
        private String assetIdentifier; // Serial number or name to identify the asset
    }
} 