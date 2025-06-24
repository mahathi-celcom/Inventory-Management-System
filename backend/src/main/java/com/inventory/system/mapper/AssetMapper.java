package com.inventory.system.mapper;

import com.inventory.system.dto.AssetDTO;
import com.inventory.system.dto.AssetRequestDTO;
import com.inventory.system.dto.AssetTagDTO;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.model.*;
import com.inventory.system.repository.*;
import com.inventory.system.validation.AssetValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class AssetMapper {
    
    private final AssetTypeRepository assetTypeRepository;
    private final AssetMakeRepository assetMakeRepository;
    private final AssetModelRepository assetModelRepository;
    private final UserRepository userRepository;
    private final OSRepository osRepository;
    private final OSVersionRepository osVersionRepository;
    private final VendorRepository vendorRepository;

    /**
     * Convert AssetRequestDTO to Asset entity for bulk operations
     */
    public Asset toEntity(AssetRequestDTO dto) {
        if (dto == null) {
            return null;
        }
        
        log.debug("Converting AssetRequestDTO to Asset entity: {}", dto.getSerialNumber());
        
        Asset asset = new Asset();
        
        // Basic fields
        asset.setName(dto.getName());
        asset.setSerialNumber(dto.getSerialNumber());
        asset.setItAssetCode(dto.getItAssetCode());
        asset.setMacAddress(dto.getMacAddress());
        asset.setIpv4Address(dto.getIpv4Address());
        
        // Normalize and set status, ownerType, acquisitionType
        asset.setStatus(normalizeStatus(dto.getStatus()));
        asset.setOwnerType(normalizeOwnerType(dto.getOwnerType()));
        asset.setAcquisitionType(normalizeAcquisitionType(dto.getAcquisitionType()));
        
        asset.setInventoryLocation(dto.getInventoryLocation());
        asset.setPoNumber(dto.getPoNumber());
        asset.setInvoiceNumber(dto.getInvoiceNumber());
        asset.setAcquisitionDate(dto.getAcquisitionDate());
        asset.setWarrantyExpiry(dto.getWarrantyExpiry());
        
        // Handle warranty expiry date mapping - prioritize warrantyExpiryDate over extendedWarrantyExpiry
        if (dto.getWarrantyExpiryDate() != null) {
            asset.setExtendedWarrantyExpiry(dto.getWarrantyExpiryDate());
        } else {
            asset.setExtendedWarrantyExpiry(dto.getExtendedWarrantyExpiry());
        }
        
        asset.setLeaseEndDate(dto.getLeaseEndDate());
        asset.setTags(dto.getTags());
        
        // Handle BigDecimal conversions
        asset.setRentalAmount(convertToBigDecimal(dto.getRentalAmount()));
        asset.setAcquisitionPrice(convertToBigDecimal(dto.getAcquisitionPrice()));
        asset.setDepreciationPct(convertToBigDecimal(dto.getDepreciationPct()));
        asset.setCurrentPrice(convertToBigDecimal(dto.getCurrentPrice()));
        asset.setMinContractPeriod(dto.getMinContractPeriod());
        
        // Set foreign key relationships
        setAssetType(asset, dto.getAssetTypeId());
        setAssetMake(asset, dto.getMakeId());
        setAssetModel(asset, dto.getModelId());
        setCurrentUser(asset, dto.getCurrentUserId());
        setOS(asset, dto.getOsId());
        setOSVersion(asset, dto.getOsVersionId());
        setVendor(asset, dto.getVendorId());
        setExtendedWarrantyVendor(asset, dto.getExtendedWarrantyVendorId());
        
        // Set audit fields
        asset.setDeleted(false);
        
        return asset;
    }

    /**
     * Convert AssetRequestDTO to Asset entity using validation context with resolved foreign keys
     */
    public Asset toEntityWithContext(AssetRequestDTO dto, AssetValidationService.AssetValidationContext context) {
        if (dto == null) {
            return null;
        }
        
        log.debug("Converting AssetRequestDTO to Asset entity with context: {}", dto.getSerialNumber());
        
        Asset asset = new Asset();
        
        // Basic fields
        asset.setName(dto.getName());
        asset.setSerialNumber(dto.getSerialNumber());
        asset.setItAssetCode(dto.getItAssetCode());
        asset.setMacAddress(dto.getMacAddress());
        asset.setIpv4Address(dto.getIpv4Address());
        
        // Normalize and set status, ownerType, acquisitionType
        asset.setStatus(normalizeStatus(dto.getStatus()));
        asset.setOwnerType(normalizeOwnerType(dto.getOwnerType()));
        asset.setAcquisitionType(normalizeAcquisitionType(dto.getAcquisitionType()));
        
        asset.setInventoryLocation(dto.getInventoryLocation());
        asset.setPoNumber(dto.getPoNumber());
        asset.setInvoiceNumber(dto.getInvoiceNumber());
        asset.setAcquisitionDate(dto.getAcquisitionDate());
        asset.setWarrantyExpiry(dto.getWarrantyExpiry());
        
        // Handle warranty expiry date mapping - prioritize warrantyExpiryDate over extendedWarrantyExpiry
        if (dto.getWarrantyExpiryDate() != null) {
            asset.setExtendedWarrantyExpiry(dto.getWarrantyExpiryDate());
        } else {
            asset.setExtendedWarrantyExpiry(dto.getExtendedWarrantyExpiry());
        }
        
        asset.setLeaseEndDate(dto.getLeaseEndDate());
        asset.setTags(dto.getTags());
        
        // Handle BigDecimal conversions
        asset.setRentalAmount(convertToBigDecimal(dto.getRentalAmount()));
        asset.setAcquisitionPrice(convertToBigDecimal(dto.getAcquisitionPrice()));
        asset.setDepreciationPct(convertToBigDecimal(dto.getDepreciationPct()));
        asset.setCurrentPrice(convertToBigDecimal(dto.getCurrentPrice()));
        asset.setMinContractPeriod(dto.getMinContractPeriod());
        
        // Set foreign key relationships with context resolution
        setForeignKeysWithContext(asset, dto, context);
        
        // Set audit fields
        asset.setDeleted(false);
        
        return asset;
    }
    
    private void setForeignKeysWithContext(Asset asset, AssetRequestDTO dto, AssetValidationService.AssetValidationContext context) {
        // Asset Type: Use resolved from model hierarchy or DTO
        Long assetTypeId = context.getResolvedTypeId() != null ? context.getResolvedTypeId() : dto.getAssetTypeId();
        setAssetType(asset, assetTypeId);
        
        // Asset Make: Use resolved from model or DTO
        Long makeId = context.getResolvedMakeId() != null ? context.getResolvedMakeId() : dto.getMakeId();
        setAssetMake(asset, makeId);
        
        // Asset Model: Always use DTO value
        setAssetModel(asset, dto.getModelId());
        
        // Current User: Use DTO value
        setCurrentUser(asset, dto.getCurrentUserId());
        
        // OS: Use resolved from OS version or DTO
        Long osId = context.getResolvedOsId() != null ? context.getResolvedOsId() : dto.getOsId();
        setOS(asset, osId);
        
        // OS Version: Always use DTO value
        setOSVersion(asset, dto.getOsVersionId());
        
        // Vendor: Use resolved from PO or DTO
        Long vendorId = context.getResolvedVendorId() != null ? context.getResolvedVendorId() : dto.getVendorId();
        setVendor(asset, vendorId);
        
        // Extended Warranty Vendor: Use resolved from PO or DTO
        Long extendedWarrantyVendorId = context.getResolvedExtendedWarrantyVendorId() != null ? 
            context.getResolvedExtendedWarrantyVendorId() : dto.getExtendedWarrantyVendorId();
        setExtendedWarrantyVendor(asset, extendedWarrantyVendorId);
    }

    /**
     * Convert AssetDTO to Asset entity for regular operations
     */
    public Asset toEntity(AssetDTO dto) {
        if (dto == null) {
            return null;
        }
        
        log.debug("Converting AssetDTO to Asset entity: {}", dto.getSerialNumber());
        
        Asset asset = new Asset();
        
        // Basic fields
        asset.setName(dto.getName());
        asset.setSerialNumber(dto.getSerialNumber());
        asset.setItAssetCode(dto.getItAssetCode());
        asset.setMacAddress(dto.getMacAddress());
        asset.setIpv4Address(dto.getIpv4Address());
        
        // Normalize and set status, ownerType, acquisitionType
        asset.setStatus(normalizeStatus(dto.getStatus()));
        asset.setOwnerType(normalizeOwnerType(dto.getOwnerType()));
        asset.setAcquisitionType(normalizeAcquisitionType(dto.getAcquisitionType()));
        
        asset.setInventoryLocation(dto.getInventoryLocation());
        asset.setPoNumber(dto.getPoNumber());
        asset.setInvoiceNumber(dto.getInvoiceNumber());
        asset.setAcquisitionDate(dto.getAcquisitionDate());
        asset.setWarrantyExpiry(dto.getWarrantyExpiry());
        
        // Handle warranty expiry date mapping - prioritize warrantyExpiryDate over extendedWarrantyExpiry
        if (dto.getWarrantyExpiryDate() != null) {
            asset.setExtendedWarrantyExpiry(dto.getWarrantyExpiryDate());
        } else {
            asset.setExtendedWarrantyExpiry(dto.getExtendedWarrantyExpiry());
        }
        
        asset.setLeaseEndDate(dto.getLeaseEndDate());
        asset.setTags(dto.getTags());
        
        // Handle BigDecimal conversions
        asset.setRentalAmount(convertToBigDecimal(dto.getRentalAmount()));
        asset.setAcquisitionPrice(convertToBigDecimal(dto.getAcquisitionPrice()));
        asset.setDepreciationPct(convertToBigDecimal(dto.getDepreciationPct()));
        asset.setCurrentPrice(convertToBigDecimal(dto.getCurrentPrice()));
        asset.setMinContractPeriod(dto.getMinContractPeriod());
        
        // Set foreign key relationships
        setAssetType(asset, dto.getAssetTypeId());
        setAssetMake(asset, dto.getMakeId());
        setAssetModel(asset, dto.getModelId());
        setCurrentUser(asset, dto.getCurrentUserId());
        setOS(asset, dto.getOsId());
        setOSVersion(asset, dto.getOsVersionId());
        setVendor(asset, dto.getVendorId());
        setExtendedWarrantyVendor(asset, dto.getExtendedWarrantyVendorId());
        
        // Set audit fields
        asset.setDeleted(false);
        
        return asset;
    }

    /**
     * Convert Asset entity to AssetDTO
     */
    public AssetDTO toDTO(Asset asset) {
        if (asset == null) {
            return null;
        }
        
        AssetDTO dto = new AssetDTO();
        
        dto.setAssetId(asset.getAssetId());
        dto.setName(asset.getName());
        dto.setSerialNumber(asset.getSerialNumber());
        dto.setItAssetCode(asset.getItAssetCode());
        dto.setMacAddress(asset.getMacAddress());
        dto.setIpv4Address(asset.getIpv4Address());
        dto.setStatus(asset.getStatus());
        dto.setOwnerType(asset.getOwnerType());
        dto.setAcquisitionType(asset.getAcquisitionType());
        dto.setInventoryLocation(asset.getInventoryLocation());
        dto.setPoNumber(asset.getPoNumber());
        dto.setInvoiceNumber(asset.getInvoiceNumber());
        dto.setAcquisitionDate(asset.getAcquisitionDate());
        dto.setWarrantyExpiry(asset.getWarrantyExpiry());
        dto.setExtendedWarrantyExpiry(asset.getExtendedWarrantyExpiry());
        
        // Set warrantyExpiryDate to same value as extendedWarrantyExpiry for frontend compatibility
        dto.setWarrantyExpiryDate(asset.getExtendedWarrantyExpiry());
        
        dto.setLeaseEndDate(asset.getLeaseEndDate());
        dto.setRentalAmount(asset.getRentalAmount());
        dto.setAcquisitionPrice(asset.getAcquisitionPrice());
        dto.setDepreciationPct(asset.getDepreciationPct());
        dto.setCurrentPrice(asset.getCurrentPrice());
        dto.setMinContractPeriod(asset.getMinContractPeriod());
        dto.setTags(asset.getTags());
        dto.setCreatedAt(asset.getCreatedAt());
        dto.setUpdatedAt(asset.getUpdatedAt());
        dto.setDeleted(asset.getDeleted());
        
        // Set foreign key IDs
        dto.setAssetTypeId(asset.getAssetType() != null ? asset.getAssetType().getId() : null);
        dto.setMakeId(asset.getMake() != null ? asset.getMake().getId() : null);
        dto.setModelId(asset.getModel() != null ? asset.getModel().getId() : null);
        dto.setCurrentUserId(asset.getCurrentUser() != null ? asset.getCurrentUser().getId() : null);
        dto.setOsId(asset.getOs() != null ? asset.getOs().getId() : null);
        dto.setOsVersionId(asset.getOsVersion() != null ? asset.getOsVersion().getId() : null);
        dto.setVendorId(asset.getVendor() != null ? asset.getVendor().getId() : null);
        dto.setExtendedWarrantyVendorId(asset.getExtendedWarrantyVendor() != null ? 
            asset.getExtendedWarrantyVendor().getId() : null);
        
        // Map assigned tags
        if (asset.getAssignedTags() != null && !asset.getAssignedTags().isEmpty()) {
            Set<AssetTagDTO> tagDTOs = asset.getAssignedTags().stream()
                .map(this::convertTagToDTO)
                .collect(Collectors.toSet());
            dto.setAssignedTags(tagDTOs);
        }
        
        return dto;
    }

    /**
     * Convert list of Asset entities to DTOs
     */
    public List<AssetDTO> toDTOList(List<Asset> assets) {
        if (assets == null) {
            return null;
        }
        return assets.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Update existing Asset entity from DTO
     */
    public void updateEntityFromDTO(Asset asset, AssetDTO dto) {
        if (asset == null || dto == null) {
            return;
        }
        
        // Update basic fields
        if (dto.getName() != null) asset.setName(dto.getName());
        if (dto.getSerialNumber() != null) asset.setSerialNumber(dto.getSerialNumber());
        if (dto.getItAssetCode() != null) asset.setItAssetCode(dto.getItAssetCode());
        if (dto.getMacAddress() != null) asset.setMacAddress(dto.getMacAddress());
        if (dto.getIpv4Address() != null) asset.setIpv4Address(dto.getIpv4Address());
        if (dto.getStatus() != null) asset.setStatus(normalizeStatus(dto.getStatus()));
        if (dto.getOwnerType() != null) asset.setOwnerType(normalizeOwnerType(dto.getOwnerType()));
        if (dto.getAcquisitionType() != null) asset.setAcquisitionType(normalizeAcquisitionType(dto.getAcquisitionType()));
        if (dto.getInventoryLocation() != null) asset.setInventoryLocation(dto.getInventoryLocation());
        if (dto.getPoNumber() != null) asset.setPoNumber(dto.getPoNumber());
        if (dto.getInvoiceNumber() != null) asset.setInvoiceNumber(dto.getInvoiceNumber());
        if (dto.getAcquisitionDate() != null) asset.setAcquisitionDate(dto.getAcquisitionDate());
        if (dto.getWarrantyExpiry() != null) asset.setWarrantyExpiry(dto.getWarrantyExpiry());
        
        // Handle warranty expiry date mapping - prioritize warrantyExpiryDate over extendedWarrantyExpiry
        if (dto.getWarrantyExpiryDate() != null) {
            asset.setExtendedWarrantyExpiry(dto.getWarrantyExpiryDate());
        } else if (dto.getExtendedWarrantyExpiry() != null) {
            asset.setExtendedWarrantyExpiry(dto.getExtendedWarrantyExpiry());
        }
        
        if (dto.getLeaseEndDate() != null) asset.setLeaseEndDate(dto.getLeaseEndDate());
        
        if (dto.getTags() != null) asset.setTags(dto.getTags());
        
        // Update BigDecimal fields
        if (dto.getRentalAmount() != null) asset.setRentalAmount(dto.getRentalAmount());
        if (dto.getAcquisitionPrice() != null) asset.setAcquisitionPrice(dto.getAcquisitionPrice());
        if (dto.getDepreciationPct() != null) asset.setDepreciationPct(dto.getDepreciationPct());
        if (dto.getCurrentPrice() != null) asset.setCurrentPrice(dto.getCurrentPrice());
        if (dto.getMinContractPeriod() != null) asset.setMinContractPeriod(dto.getMinContractPeriod());
        
        // Update foreign key relationships
        if (dto.getAssetTypeId() != null) setAssetType(asset, dto.getAssetTypeId());
        if (dto.getMakeId() != null) setAssetMake(asset, dto.getMakeId());
        if (dto.getModelId() != null) setAssetModel(asset, dto.getModelId());
        if (dto.getCurrentUserId() != null) setCurrentUser(asset, dto.getCurrentUserId());
        if (dto.getOsId() != null) setOS(asset, dto.getOsId());
        if (dto.getOsVersionId() != null) setOSVersion(asset, dto.getOsVersionId());
        if (dto.getVendorId() != null) setVendor(asset, dto.getVendorId());
        if (dto.getExtendedWarrantyVendorId() != null) setExtendedWarrantyVendor(asset, dto.getExtendedWarrantyVendorId());
    }

    // Private helper methods for normalization
    private String normalizeStatus(String status) {
        if (status == null) return null;
        
        // Convert frontend values to backend values
        switch (status.trim()) {
            case "In stock": return "IN_STOCK";
            case "In Stock": return "IN_STOCK";  // Handle both cases
            case "Active": return "ACTIVE";
            case "In Repair": return "IN_REPAIR";
            case "In repair": return "IN_REPAIR";  // Handle lowercase
            case "Broken": return "BROKEN";
            case "broken": return "BROKEN";  // Handle lowercase
            case "Ceased": return "CEASED";
            case "ceased": return "CEASED";  // Handle lowercase
            // Handle backend values as-is
            case "IN_STOCK": return "IN_STOCK";
            case "ACTIVE": return "ACTIVE";
            case "IN_REPAIR": return "IN_REPAIR";
            case "BROKEN": return "BROKEN";
            case "CEASED": return "CEASED";
            default: return status.toUpperCase();
        }
    }
    
    private String normalizeOwnerType(String ownerType) {
        if (ownerType == null) return null;
        
        // Convert frontend values to backend values
        switch (ownerType.trim()) {
            case "Celcom": return "CELCOM";
            case "Vendor": return "VENDOR";
            default: return ownerType.toUpperCase();
        }
    }
    
    private String normalizeAcquisitionType(String acquisitionType) {
        if (acquisitionType == null) return null;
        
        // Convert frontend values to backend values
        switch (acquisitionType.trim()) {
            case "Bought": return "BOUGHT";
            case "Lease": return "LEASE";
            case "Rental": return "RENTAL";
            default: return acquisitionType.toUpperCase();
        }
    }
    
    private BigDecimal convertToBigDecimal(Object value) {
        if (value == null) return null;
        
        if (value instanceof BigDecimal) {
            return (BigDecimal) value;
        } else if (value instanceof Number) {
            return BigDecimal.valueOf(((Number) value).doubleValue());
        } else if (value instanceof String) {
            try {
                return new BigDecimal((String) value);
            } catch (NumberFormatException e) {
                log.warn("Failed to convert '{}' to BigDecimal", value);
                return null;
            }
        }
        return null;
    }

    // Foreign key relationship setters with error handling
    private void setAssetType(Asset asset, Long assetTypeId) {
        if (assetTypeId != null) {
            AssetType assetType = assetTypeRepository.findById(assetTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("AssetType", "id", assetTypeId));
            asset.setAssetType(assetType);
        }
    }
    
    private void setAssetMake(Asset asset, Long makeId) {
        if (makeId != null) {
            AssetMake assetMake = assetMakeRepository.findById(makeId)
                .orElseThrow(() -> new ResourceNotFoundException("AssetMake", "id", makeId));
            asset.setMake(assetMake);
        }
    }
    
    private void setAssetModel(Asset asset, Long modelId) {
        if (modelId != null) {
            AssetModel assetModel = assetModelRepository.findById(modelId)
                .orElseThrow(() -> new ResourceNotFoundException("AssetModel", "id", modelId));
            asset.setModel(assetModel);
        }
    }
    
    private void setCurrentUser(Asset asset, Long userId) {
        if (userId != null) {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            asset.setCurrentUser(user);
        }
    }
    
    private void setOS(Asset asset, Long osId) {
        if (osId != null) {
            OS os = osRepository.findById(osId)
                .orElseThrow(() -> new ResourceNotFoundException("OS", "id", osId));
            asset.setOs(os);
        }
    }
    
    private void setOSVersion(Asset asset, Long osVersionId) {
        if (osVersionId != null) {
            OSVersion osVersion = osVersionRepository.findById(osVersionId)
                .orElseThrow(() -> new ResourceNotFoundException("OSVersion", "id", osVersionId));
            asset.setOsVersion(osVersion);
        }
    }
    
    private void setVendor(Asset asset, Long vendorId) {
        if (vendorId != null) {
            Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", "id", vendorId));
            asset.setVendor(vendor);
        }
    }
    
    private void setExtendedWarrantyVendor(Asset asset, Long vendorId) {
        if (vendorId != null) {
            Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("ExtendedWarrantyVendor", "id", vendorId));
            asset.setExtendedWarrantyVendor(vendor);
        }
    }
    
    // Helper method to convert AssetTag to AssetTagDTO
    private AssetTagDTO convertTagToDTO(AssetTag assetTag) {
        if (assetTag == null) {
            return null;
        }
        AssetTagDTO dto = new AssetTagDTO();
        dto.setId(assetTag.getId());
        dto.setName(assetTag.getName());
        return dto;
    }
} 