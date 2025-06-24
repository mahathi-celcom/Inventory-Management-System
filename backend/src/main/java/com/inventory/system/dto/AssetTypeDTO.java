package com.inventory.system.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AssetTypeDTO {
    @JsonProperty("id")
    private Long id;
    
    @JsonProperty("name")
    @NotBlank(message = "Asset type name is required")
    private String name;
    
    @JsonProperty("description")
    private String description;

    @JsonProperty("assetCategory")
    @Pattern(regexp = "^(?i)(Hardware|Software)$", 
             message = "Asset category must be 'Hardware' or 'Software' (case insensitive)")
    private String assetCategory;
    
    @JsonProperty("status")
    private String status = "Active";

    // Helper methods for category checking
    public boolean isHardware() {
        return "Hardware".equalsIgnoreCase(this.assetCategory) || "HARDWARE".equalsIgnoreCase(this.assetCategory);
    }

    public boolean isSoftware() {
        return "Software".equalsIgnoreCase(this.assetCategory) || "SOFTWARE".equalsIgnoreCase(this.assetCategory);
    }
} 