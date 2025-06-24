package com.inventory.system.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssetTagAssignmentDTO {
    private Long id;
    
    @NotNull(message = "Asset ID is required")
    private Long assetId;
    
    @NotNull(message = "Tag ID is required")
    private Long tagId;
    
    // Additional fields for frontend display
    private String assetName;
    private String tagName;
} 