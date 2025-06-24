package com.inventory.system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;

@Data
public class AssetDTO {
    private Long assetId;
    
    @Positive(message = "Asset Type ID must be a positive number")
    private Long assetTypeId;
    
    @NotBlank(message = "Asset category is required")
    private String assetCategory; // HARDWARE, SOFTWARE
    
    @Positive(message = "Make ID must be a positive number")
    private Long makeId;
    

    @Positive(message = "Model ID must be a positive number")
    private Long modelId;
    
    @NotBlank(message = "Asset name is required")
    private String name;

    @NotBlank(message = "Serial number is required")
    private String serialNumber;

    private String itAssetCode;
    private String macAddress;
    private String ipv4Address;

    @NotBlank(message = "Status is required")
    private String status;

    @NotBlank(message = "Owner type is required")
    private String ownerType;

    @NotBlank(message = "Acquisition type is required")
    private String acquisitionType;

    private Long currentUserId;
    private String inventoryLocation;
    private Long osId;
    
    private Long osVersionId;
    
    private String poNumber;
    private String invoiceNumber;
    private LocalDate acquisitionDate;
    private LocalDate warrantyExpiry;
    private LocalDate extendedWarrantyExpiry;
    private LocalDate leaseEndDate;
    
    // Frontend-friendly warranty field that maps to extendedWarrantyExpiry
    private LocalDate warrantyExpiryDate;
    
    // Software License Fields
    private String licenseName;
    private LocalDate licenseValidityPeriod;

    
    @Positive(message = "Vendor ID must be a positive number when provided")
    private Long vendorId;
    
    private Long extendedWarrantyVendorId;
    private BigDecimal rentalAmount;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Acquisition price must be greater than 0")
    private BigDecimal acquisitionPrice;
    
    private BigDecimal depreciationPct;
    private BigDecimal currentPrice;
    private Integer minContractPeriod;
    private String tags;
    
    // Asset tag assignments
    private Set<AssetTagDTO> assignedTags = new HashSet<>();
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Soft delete flag
    private Boolean deleted;

    // Computed fields for frontend
    private String warrantyStatus;
    private String licenseStatus;

    // Helper methods
    public boolean isSoftwareAsset() {
        return "SOFTWARE".equalsIgnoreCase(this.assetCategory);
    }

    public boolean isHardwareAsset() {
        return "HARDWARE".equalsIgnoreCase(this.assetCategory);
    }
} 