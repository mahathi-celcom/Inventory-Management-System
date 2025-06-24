package com.inventory.system.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class AssetBulkUpdateDTO {
    
    @NotEmpty(message = "Asset list cannot be empty")
    @Valid
    private List<AssetIndividualUpdateDTO> assets;
    
    private String batchId; // Optional: for tracking bulk operations
    private String notes;   // Optional: bulk operation notes
} 