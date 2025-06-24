package com.inventory.system.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetTagAssignmentRequestDTO {
    @NotNull(message = "Asset ID is required")
    private Long assetId;
    
    @NotNull(message = "Tag ID is required")
    private Long tagId;
} 