package com.inventory.system.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AssetUpdateDTO {
    // Optional fields for partial updates - all fields are optional
    private String name;
    private String status;
    private String ownerType;
    private String acquisitionType;
    private Long currentUserId;
    private String inventoryLocation;
    private Long osId;
    private Long osVersionId;
    private String macAddress;
    private String ipv4Address;
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