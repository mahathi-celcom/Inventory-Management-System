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
public class BulkAssetByPOResponse {
    private String poNumber;
    private int createdCount;
    private int failedCount;
    private int totalProcessed;
    private String message;
    private List<AssetDTO> createdAssets;
    private List<BulkAssetError> errors;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkAssetError {
        private int index;
        private String field;
        private String message;
        private String assetIdentifier;
    }
    
    // Helper method to create success response
    public static BulkAssetByPOResponse success(String poNumber, List<AssetDTO> createdAssets) {
        return BulkAssetByPOResponse.builder()
                .poNumber(poNumber)
                .createdCount(createdAssets.size())
                .failedCount(0)
                .totalProcessed(createdAssets.size())
                .message(String.format("%d assets created successfully for %s", createdAssets.size(), poNumber))
                .createdAssets(createdAssets)
                .build();
    }
    
    // Helper method to create partial success response
    public static BulkAssetByPOResponse partialSuccess(String poNumber, List<AssetDTO> createdAssets, 
                                                       List<BulkAssetError> errors, int totalProcessed) {
        return BulkAssetByPOResponse.builder()
                .poNumber(poNumber)
                .createdCount(createdAssets.size())
                .failedCount(errors.size())
                .totalProcessed(totalProcessed)
                .message(String.format("%d assets created, %d failed for %s", 
                        createdAssets.size(), errors.size(), poNumber))
                .createdAssets(createdAssets)
                .errors(errors)
                .build();
    }
    
    // Helper method to create failure response
    public static BulkAssetByPOResponse failure(String poNumber, List<BulkAssetError> errors, int totalProcessed) {
        return BulkAssetByPOResponse.builder()
                .poNumber(poNumber)
                .createdCount(0)
                .failedCount(errors.size())
                .totalProcessed(totalProcessed)
                .message(String.format("All %d assets failed to create for %s", errors.size(), poNumber))
                .createdAssets(List.of())
                .errors(errors)
                .build();
    }
} 