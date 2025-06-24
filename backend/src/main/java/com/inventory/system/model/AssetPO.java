package com.inventory.system.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "asset_po", uniqueConstraints = {
    @UniqueConstraint(name = "asset_po_po_number_unique", columnNames = "po_number")
})
public class AssetPO {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "po_id")
    private Long poId;
    
    @Column(name = "acquisition_type", nullable = false)
    private String acquisitionType;
    
    @Column(name = "po_number", nullable = false, unique = true)
    private String poNumber;
    
    @Column(name = "invoice_number", nullable = true)
    private String invoiceNumber;
    
    @Column(name = "acquisition_date", nullable = true)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate acquisitionDate;
    
    @Column(name = "vendor_id", nullable = true)
    private Long vendorId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", insertable = false, updatable = false)
    private Vendor vendor;
    
    @Column(name = "owner_type", nullable = false)
    private String ownerType;
    
    @Column(name = "lease_end_date", nullable = true)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate leaseEndDate;
    
    @Column(name = "rental_amount", nullable = true)
    private BigDecimal rentalAmount;
    
    @Column(name = "min_contract_period", nullable = true)
    private Integer minContractPeriod;
    
    @Column(name = "acquisition_price", nullable = true)
    private BigDecimal acquisitionPrice;
    
    @Column(name = "depreciation_pct", nullable = true)
    private Double depreciationPct;
    
    @Column(name = "current_price", nullable = true)
    private BigDecimal currentPrice;
    
    @Column(name = "total_devices", nullable = true)
    private Integer totalDevices;
    
    @Column(name = "warranty_expiry_date", nullable = true)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate warrantyExpiryDate;
} 