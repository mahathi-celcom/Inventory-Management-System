package com.inventory.system.dto;

import jakarta.validation.constraints.*;
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
public class AssetPODTO {
    
    private Long id;
    
    @NotBlank(message = "Acquisition type is required")
    @Pattern(regexp = "^(Bought|Leased|Rented)$", message = "Acquisition type must be: Bought, Leased, or Rented")
    private String acquisitionType;
    
    @NotBlank(message = "PO Number is required")
    private String poNumber;
    
    private String invoiceNumber;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate acquisitionDate;
    
    private Long vendorId;
    
    private String vendorName; // For display purposes
    
    @NotBlank(message = "Owner type is required")
    @Pattern(regexp = "^(Celcom|Vendor)$", message = "Owner type must be: Celcom or Vendor")
    private String ownerType;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate leaseEndDate;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Rental amount must be greater than 0")
    private BigDecimal rentalAmount;
    
    @Min(value = 1, message = "Minimum contract period must be at least 1 month")
    private Integer minContractPeriod;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Acquisition price must be greater than 0")
    private BigDecimal acquisitionPrice;
    
    @DecimalMin(value = "0.0", message = "Depreciation percentage must be at least 0")
    @DecimalMax(value = "100.0", message = "Depreciation percentage cannot exceed 100")
    private Double depreciationPct;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Current price must be at least 0")
    private BigDecimal currentPrice;
    
    @Min(value = 1, message = "Total devices must be at least 1")
    private Integer totalDevices;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate warrantyExpiryDate;
} 