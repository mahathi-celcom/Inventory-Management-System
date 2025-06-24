package com.inventory.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssetTagDTO {
    private Long id;

    @NotBlank(message = "Tag name is required")
    private String name;
} 