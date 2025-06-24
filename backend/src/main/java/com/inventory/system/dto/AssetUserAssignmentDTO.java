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
public class AssetUserAssignmentDTO {
    @NotNull(message = "Asset ID is required")
    private Long assetId;
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    private String remarks;
} 