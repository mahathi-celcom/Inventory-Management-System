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
public class PODeletionWarningDTO {
    private String poNumber;
    private Integer linkedAssetsCount;
    private boolean hasLinkedAssets;
    private String warningMessage;
    private List<AssetDTO> linkedAssets; // Optional: preview of assets that will be deleted
    
    public static PODeletionWarningDTO createWarning(String poNumber, List<AssetDTO> linkedAssets) {
        boolean hasLinkedAssets = linkedAssets != null && !linkedAssets.isEmpty();
        String warningMessage = hasLinkedAssets 
            ? String.format("Warning: This PO has %d linked assets that will also be deleted. This action cannot be undone.", linkedAssets.size())
            : "This PO has no linked assets and can be safely deleted.";
            
        return PODeletionWarningDTO.builder()
            .poNumber(poNumber)
            .linkedAssetsCount(hasLinkedAssets ? linkedAssets.size() : 0)
            .hasLinkedAssets(hasLinkedAssets)
            .warningMessage(warningMessage)
            .linkedAssets(linkedAssets)
            .build();
    }
} 