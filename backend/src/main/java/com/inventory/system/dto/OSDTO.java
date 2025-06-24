package com.inventory.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OSDTO {
    private Long id;
    
    @NotBlank(message = "OS type is required")
    private String osType;
    
    private String status;
} 