package com.inventory.system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import java.time.LocalDateTime;
@Data
public class AssetStatusHistoryDTO {
    private Long id;

    @NotNull(message = "Asset ID is required")
    private Long assetId;

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "^(IN_STOCK|IN_REPAIR|BROKEN|CEASED|ACTIVE)$", 
             flags = Pattern.Flag.CASE_INSENSITIVE,
             message = "Status must be one of: IN_STOCK, IN_REPAIR, BROKEN, CEASED, ACTIVE")
    private String status;

    @NotNull(message = "Changed by user ID is required")
    private Long changedById;

    private LocalDateTime changeDate;
    private String remarks;
} 