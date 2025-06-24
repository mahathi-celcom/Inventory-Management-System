package com.inventory.system.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;

@Data
@Entity
@Table(name = "asset")
public class Asset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "asset_id")
    private Long assetId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_type_id")
    private AssetType assetType;

    @Column(name = "asset_category")
    private String assetCategory; // e.g., "HARDWARE", "SOFTWARE"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "make_id")
    private AssetMake make;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "model_id")
    private AssetModel model;

    private String name;

    @Column(name = "serial_number", unique = true)
    private String serialNumber;

    @Column(name = "it_asset_code", unique = true)
    private String itAssetCode;

    @Column(name = "mac_address")
    private String macAddress;

    @Column(name = "ipv4_address")
    private String ipv4Address;

    private String status;

    @Column(name = "owner_type")
    private String ownerType;

    @Column(name = "acquisition_type")
    private String acquisitionType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_user_id")
    private User currentUser;

    @Column(name = "inventory_location")
    private String inventoryLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "os_id")
    private OS os;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "os_version_id")
    private OSVersion osVersion;

    @Column(name = "po_number")
    private String poNumber;

    @Column(name = "invoice_number")
    private String invoiceNumber;

    @Column(name = "acquisition_date")
    private LocalDate acquisitionDate;

    @Column(name = "warranty_expiry")
    private LocalDate warrantyExpiry;

    @Column(name = "extended_warranty_expiry")
    private LocalDate extendedWarrantyExpiry;

    @Column(name = "lease_end_date")
    private LocalDate leaseEndDate;

    // Software License Fields
    @Column(name = "license_name")
    private String licenseName;

    @Column(name = "license_validity_period")
    private LocalDate licenseValidityPeriod;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "extended_warranty_vendor_id")
    private Vendor extendedWarrantyVendor;

    @Column(name = "rental_amount", precision = 12, scale = 2)
    private BigDecimal rentalAmount;

    @Column(name = "acquisition_price", precision = 12, scale = 2)
    private BigDecimal acquisitionPrice;

    @Column(name = "depreciation_pct", precision = 5, scale = 2)
    private BigDecimal depreciationPct;

    @Column(name = "current_price", precision = 12, scale = 2)
    private BigDecimal currentPrice;

    @Column(name = "min_contract_period")
    private Integer minContractPeriod;

    private String tags;

    // Many-to-many relationship with AssetTag through asset_tag_assignment junction table
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "asset_tag_assignment",
        joinColumns = @JoinColumn(name = "asset_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @JsonIgnore
    private Set<AssetTag> assignedTags = new HashSet<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Soft delete flag
    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (deleted == null) {
            deleted = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Helper method to determine if this is a software asset
    public boolean isSoftwareAsset() {
        return "SOFTWARE".equalsIgnoreCase(this.assetCategory);
    }

    // Helper method to determine if this is a hardware asset
    public boolean isHardwareAsset() {
        return "HARDWARE".equalsIgnoreCase(this.assetCategory);
    }

    // Helper method to calculate warranty status
    public String getWarrantyStatus() {
        if (warrantyExpiry == null) {
            return "NO_WARRANTY";
        }
        
        LocalDate today = LocalDate.now();
        LocalDate warningDate = warrantyExpiry.minusMonths(3); // 3 months warning
        
        if (today.isAfter(warrantyExpiry)) {
            return "EXPIRED"; // Red
        } else if (today.isAfter(warningDate)) {
            return "WARNING"; // Yellow
        } else {
            return "ACTIVE"; // Green
        }
    }

    // Helper method to calculate license validity status
    public String getLicenseStatus() {
        if (!isSoftwareAsset() || licenseValidityPeriod == null) {
            return "NOT_APPLICABLE";
        }
        
        LocalDate today = LocalDate.now();
        LocalDate warningDate = licenseValidityPeriod.minusMonths(1); // 1 month warning for licenses
        
        if (today.isAfter(licenseValidityPeriod)) {
            return "EXPIRED"; // Red
        } else if (today.isAfter(warningDate)) {
            return "WARNING"; // Yellow
        } else {
            return "ACTIVE"; // Green
        }
    }
} 