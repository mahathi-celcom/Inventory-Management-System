package com.inventory.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class VendorDTO extends BaseDTO {
    @NotBlank(message = "Vendor name is required")
    private String name;

    private String contactInfo;
    
    private String status = "Active";
} 