package com.inventory.system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssetModelDTO {
    private Long id;
    
    @NotNull(message = "Make ID is required")
    private Long makeId;
    
    @NotBlank(message = "Model name is required")
    private String name;
    
    private String ram;
    private String storage;
    private String processor;
    
    private String status = "Active";
} 