package com.inventory.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetPOMigrationResponse {
    
    private String oldPoNumber;
    private String newPoNumber;
    private AssetPODTO newAssetPO;
    private int assetsUpdated;
    private String status;
    private String message;
    
    public static AssetPOMigrationResponse success(String oldPoNumber, String newPoNumber, 
                                                  AssetPODTO newAssetPO, int assetsUpdated) {
        return AssetPOMigrationResponse.builder()
                .oldPoNumber(oldPoNumber)
                .newPoNumber(newPoNumber)
                .newAssetPO(newAssetPO)
                .assetsUpdated(assetsUpdated)
                .status("SUCCESS")
                .message(String.format("Successfully migrated PO number from '%s' to '%s'. " +
                        "Updated %d asset records.", oldPoNumber, newPoNumber, assetsUpdated))
                .build();
    }
    
    public static AssetPOMigrationResponse failure(String oldPoNumber, String newPoNumber, String error) {
        return AssetPOMigrationResponse.builder()
                .oldPoNumber(oldPoNumber)
                .newPoNumber(newPoNumber)
                .assetsUpdated(0)
                .status("FAILED")
                .message(String.format("Failed to migrate PO number from '%s' to '%s': %s", 
                        oldPoNumber, newPoNumber, error))
                .build();
    }
} 