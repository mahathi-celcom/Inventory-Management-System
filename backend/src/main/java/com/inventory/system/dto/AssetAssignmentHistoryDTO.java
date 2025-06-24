package com.inventory.system.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AssetAssignmentHistoryDTO {
    private Long id;

    @NotNull(message = "Asset ID is required")
    private Long assetId;

    @NotNull(message = "User ID is required")
    private Long userId;

    private LocalDateTime assignedDate;
    private LocalDateTime unassignedDate;
} 