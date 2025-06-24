package com.inventory.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetPOUpdateResponse {
    
    private AssetPODTO assetPO;
    private int linkedAssetsUpdated;
    private String message;
    
    public static AssetPOUpdateResponse of(AssetPODTO assetPO, int linkedAssetsUpdated) {
        return AssetPOUpdateResponse.builder()
                .assetPO(assetPO)
                .linkedAssetsUpdated(linkedAssetsUpdated)
                .message(String.format("AssetPO updated successfully. %d linked assets were also updated.", linkedAssetsUpdated))
                .build();
    }
} 