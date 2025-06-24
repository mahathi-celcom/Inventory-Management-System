package com.inventory.system.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AssetIndividualUpdateDTO {
    
    @NotNull(message = "Asset ID is required")
    @Positive(message = "Asset ID must be positive")
    private Long assetId;
    
    // Fields that can be updated (all optional - only non-null fields will be updated)
    private String name;
    private String serialNumber;
    private String itAssetCode;
    private String macAddress;
    private String ipv4Address;
    private String status;
    private String ownerType;
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
    private Long vendorId;
    private Long extendedWarrantyVendorId;
    private BigDecimal rentalAmount;
    private BigDecimal acquisitionPrice;
    private BigDecimal depreciationPct;
    private BigDecimal currentPrice;
    private Integer minContractPeriod;
    private String tags;
} 