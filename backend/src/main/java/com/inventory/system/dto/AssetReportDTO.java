package com.inventory.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetReportDTO {
    
    // Basic Asset Info
    private Long assetId;
    private String name;
    private String serialNumber;
    private String itAssetCode;
    private String status;
    private String assetCategory;
    
    // Type and Make Info
    private String assetTypeName;
    private String makeName;
    private String modelName;
    
    // User and Location Info
    private String currentUserName;
    private String currentUserDepartment;
    private String currentUserDesignation;
    private String inventoryLocation;
    
    // OS Info
    private String osName;
    private String osVersion;
    
    // Financial Info
    private String poNumber;
    private String invoiceNumber;
    private LocalDate acquisitionDate;
    private BigDecimal acquisitionPrice;
    private BigDecimal currentPrice;
    private String ownerType;
    private String acquisitionType;
    
    // Warranty Info
    private LocalDate warrantyExpiry;
    private LocalDate extendedWarrantyExpiry;
    private String warrantyStatus;
    private String vendorName;
    
    // Technical Info
    private String macAddress;
    private String ipv4Address;
    
    // Aging Info
    private String ageRange;
    private Long ageInDays;
    
    // Tags
    private String assignedTags;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Software-specific fields
    private String licenseName;
    private LocalDate licenseValidityPeriod;

    private String licenseStatus;
    
    // Lease info
    private LocalDate leaseEndDate;
    private BigDecimal rentalAmount;
    private Integer minContractPeriod;
} 