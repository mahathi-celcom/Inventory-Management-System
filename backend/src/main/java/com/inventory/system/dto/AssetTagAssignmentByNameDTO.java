package com.inventory.system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssetTagAssignmentByNameDTO {
    @NotNull(message = "Asset ID is required")
    private Long assetId;
    
    @NotBlank(message = "Tag name is required")
    private String tagName;
} 