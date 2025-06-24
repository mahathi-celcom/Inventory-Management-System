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
public class PODeletionConflictDTO {
    private String message;
    private String poNumber;
    private Integer totalAssets;
    private Integer blockingAssetsCount;
    private List<AssetDeletionBlockerDTO> blockingAssets;
    
    public static PODeletionConflictDTO createConflict(String poNumber, List<AssetDeletionBlockerDTO> blockingAssets, int totalAssets) {
        String message = String.format("Cannot delete PO due to %d dependent assets with blocking conditions", blockingAssets.size());
        
        return PODeletionConflictDTO.builder()
                .message(message)
                .poNumber(poNumber)
                .totalAssets(totalAssets)
                .blockingAssetsCount(blockingAssets.size())
                .blockingAssets(blockingAssets)
                .build();
    }
} 