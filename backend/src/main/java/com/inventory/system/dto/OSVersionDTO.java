package com.inventory.system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OSVersionDTO {
    private Long id;

    @NotNull(message = "OS ID is required")
    private Long osId;

    @NotBlank(message = "Version number is required")
    private String versionNumber;
    
    private String status;
} 