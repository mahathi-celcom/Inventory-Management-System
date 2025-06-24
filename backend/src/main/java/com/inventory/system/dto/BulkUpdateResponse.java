package com.inventory.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkUpdateResponse {
    
    private int totalProcessed;
    private int successCount;
    private int failureCount;
    private List<AssetDTO> updatedAssets;
    private List<BulkUpdateError> errors;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkUpdateError {
        private Long assetId;
        private String field;
        private String message;
        private String assetIdentifier; // serial number or name for easy identification
    }
} 