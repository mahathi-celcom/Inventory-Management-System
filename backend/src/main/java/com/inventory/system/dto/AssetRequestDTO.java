package com.inventory.system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
public class AssetRequestDTO extends AssetDTO {
    // This class extends AssetDTO to reuse existing validation and structure
    // Additional validation can be added here if needed for bulk operations
    
    // New validation for asset category
    @Override
    @NotBlank(message = "Asset category is required (HARDWARE, SOFTWARE)")
    @Pattern(regexp = "^(HARDWARE|SOFTWARE|Hardware|Software)$", 
             flags = Pattern.Flag.CASE_INSENSITIVE,
             message = "Asset category must be one of: HARDWARE, SOFTWARE ")
    public String getAssetCategory() {
        return super.getAssetCategory();
    }
    
    // Override key fields with validation that matches your actual JSON payload
    @Override
    @NotBlank(message = "Serial number is required and cannot be blank")
    @Size(min = 3, max = 50, message = "Serial number must be between 3 and 50 characters")
    public String getSerialNumber() {
        return super.getSerialNumber();
    }
    
    @Override
    @NotBlank(message = "Asset name is required and cannot be blank")
    @Size(min = 2, max = 100, message = "Asset name must be between 2 and 100 characters")
    public String getName() {
        return super.getName();
    }
    
    // Updated to match your actual JSON values
    @Override
    @NotBlank(message = "Status is required (e.g., In stock, Active, Broken, In Repair, Ceased)")
    @Pattern(regexp = "^(In stock|In Stock|Active|Broken|broken|In Repair|In repair|Ceased|ceased|IN_STOCK|ACTIVE|IN_REPAIR|BROKEN|CEASED)$", 
             message = "Status must be one of: In stock, Active, Broken, In Repair, Ceased")
    public String getStatus() {
        return super.getStatus();
    }
    
    // Updated to match your actual JSON values  
    @Override
    @NotBlank(message = "Owner type is required (e.g., Celcom, Vendor)")
    @Pattern(regexp = "^(Celcom|Vendor|CELCOM|VENDOR)$", 
             message = "Owner type must be one of: Celcom, Vendor")
    public String getOwnerType() {
        return super.getOwnerType();
    }
    
    // Updated to match your actual JSON values
    @Override
    @NotBlank(message = "Acquisition type is required (e.g., Bought, Lease, Rental)")
    @Pattern(regexp = "^(Bought|Lease|Rental|BOUGHT|LEASE|RENTAL)$", 
             message = "Acquisition type must be one of: Bought, Lease, Rental")
    public String getAcquisitionType() {
        return super.getAcquisitionType();
    }
    
    // Handle modelId without custom deserializer - Jackson will handle string-to-long conversion
    @Override
    @NotNull(message = "Model ID is required")
    @Positive(message = "Model ID must be a positive number")
    public Long getModelId() {
        return super.getModelId();
    }
    
    // Handle osVersionId without custom deserializer - Jackson will handle string-to-long conversion
    @Override
    @Positive(message = "OS Version ID must be a positive number when provided")
    public Long getOsVersionId() {
        return super.getOsVersionId();
    }
    
    // Additional validation for foreign key fields
    @Override
    @Positive(message = "Asset Type ID must be a positive number when provided")
    public Long getAssetTypeId() {
        return super.getAssetTypeId();
    }
    
    @Override
    @Positive(message = "Make ID must be a positive number when provided")
    public Long getMakeId() {
        return super.getMakeId();
    }
    
    @Override
    @Positive(message = "Current User ID must be a positive number when provided")
    public Long getCurrentUserId() {
        return super.getCurrentUserId();
    }
    
    @Override
    @Positive(message = "Vendor ID must be a positive number when provided")
    public Long getVendorId() {
        return super.getVendorId();
    }

    // Software license validation
    @Override
    @Size(max = 100, message = "License name cannot exceed 100 characters")
    public String getLicenseName() {
        return super.getLicenseName();
    }

    // Additional fields specific to bulk operations
    private String batchId; // Optional field to group assets in a bulk operation
    private Integer sequence; // Optional field to maintain order in bulk operations
    
    @Size(max = 50, message = "Batch ID cannot exceed 50 characters")
    public String getBatchId() {
        return batchId;
    }
    
    @Positive(message = "Sequence number must be positive when provided")
    public Integer getSequence() {
        return sequence;
    }
} 