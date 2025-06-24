package com.inventory.system.service.impl;

import com.inventory.system.dto.AssetDTO;
import com.inventory.system.dto.AssetRequestDTO;
import com.inventory.system.dto.AssetUpdateDTO;
import com.inventory.system.dto.AssetStatusHistoryDTO;
import com.inventory.system.dto.BulkAssetResponse;
import com.inventory.system.dto.BulkUpdateResponse;
import com.inventory.system.dto.AssetBulkUpdateDTO;
import com.inventory.system.dto.AssetIndividualUpdateDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.dto.BulkAssetByPOResponse;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.model.*;
import com.inventory.system.repository.*;
import com.inventory.system.service.AssetService;
import com.inventory.system.service.AssetStatusHistoryService;
import com.inventory.system.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import com.inventory.system.mapper.AssetMapper;
import com.inventory.system.validation.AssetValidationService;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetServiceImpl implements AssetService {
    private final AssetRepository assetRepository;
    private final AssetTypeRepository assetTypeRepository;
    private final AssetMakeRepository assetMakeRepository;
    private final AssetModelRepository assetModelRepository;
    private final UserRepository userRepository;
    private final OSRepository osRepository;
    private final OSVersionRepository osVersionRepository;
    private final VendorRepository vendorRepository;
    private final AuditLogService auditLogService;
    private final AssetStatusHistoryService assetStatusHistoryService;
    private final Validator validator;
    private final AssetMapper assetMapper;
    private final AssetValidationService assetValidationService;
    private final AssetPORepository assetPORepository;

    @Override
    @Transactional
    public AssetDTO createAsset(AssetDTO assetDTO) {
        Asset asset = assetMapper.toEntity(assetDTO);
        Asset savedAsset = assetRepository.save(asset);
        
        // Log the creation
        auditLogService.logAssetAction(
            savedAsset,
            savedAsset.getCurrentUser(),
            "CREATE",
            "Asset created with name: " + savedAsset.getName()
        );
        
        return assetMapper.toDTO(savedAsset);
    }

    @Override
    @Transactional
    public AssetDTO updateAsset(Long assetId, AssetDTO assetDTO) {
        log.info("Updating asset with ID: {}", assetId);
        
        Asset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", assetId));
        
        // Check if asset is deleted
        if (asset.getDeleted()) {
            throw new IllegalStateException("Cannot update deleted asset with ID: " + assetId);
        }
        
        // Validate partial update - only check fields that are being updated
        validatePartialUpdate(asset, assetDTO);
        
        // Store old values for audit
        String oldStatus = asset.getStatus();
        User oldUser = asset.getCurrentUser();
        
        updateAssetFromDTO(asset, assetDTO);
        Asset updatedAsset = assetRepository.save(asset);
        
        // Log status change if applicable
        if (!oldStatus.equals(updatedAsset.getStatus())) {
            auditLogService.logAssetAction(
                updatedAsset,
                updatedAsset.getCurrentUser(),
                "STATUS_CHANGE",
                String.format("Status changed from %s to %s", oldStatus, updatedAsset.getStatus())
            );
        }
        
        // Log user assignment change if applicable
        if (oldUser != updatedAsset.getCurrentUser()) {
            auditLogService.logAssetAction(
                updatedAsset,
                updatedAsset.getCurrentUser(),
                "USER_ASSIGNMENT",
                String.format("Asset reassigned from %s to %s",
                    oldUser != null ? oldUser.getId() : "none",
                    updatedAsset.getCurrentUser() != null ? updatedAsset.getCurrentUser().getId() : "none")
            );
        }
        
        log.info("Asset updated successfully with ID: {}", updatedAsset.getAssetId());
        return convertToDTO(updatedAsset);
    }

    private void validatePartialUpdate(Asset existingAsset, AssetDTO dto) {
        log.debug("Validating partial update for asset {}", existingAsset.getAssetId());
        
        // Only validate fields that are being updated (non-null in DTO)
        
        // Check for duplicate serial number if being updated
        if (dto.getSerialNumber() != null && !dto.getSerialNumber().equals(existingAsset.getSerialNumber())) {
            if (assetRepository.existsBySerialNumberIgnoreCaseAndAssetIdNot(dto.getSerialNumber(), existingAsset.getAssetId())) {
                throw new IllegalArgumentException("Serial number already exists: " + dto.getSerialNumber());
            }
        }
        
        // Check for duplicate MAC address if being updated
        if (dto.getMacAddress() != null && !dto.getMacAddress().equals(existingAsset.getMacAddress())) {
            if (assetRepository.existsByMacAddressIgnoreCaseAndAssetIdNot(dto.getMacAddress(), existingAsset.getAssetId())) {
                throw new IllegalArgumentException("MAC address already exists: " + dto.getMacAddress());
            }
        }
        
        // Check for duplicate IT asset code if being updated
        if (dto.getItAssetCode() != null && !dto.getItAssetCode().equals(existingAsset.getItAssetCode())) {
            if (assetRepository.existsByItAssetCodeIgnoreCaseAndAssetIdNot(dto.getItAssetCode(), existingAsset.getAssetId())) {
                throw new IllegalArgumentException("IT Asset Code already exists: " + dto.getItAssetCode());
            }
        }
        
        log.debug("Partial update validation passed for asset {}", existingAsset.getAssetId());
    }

    @Override
    public AssetDTO getAsset(Long assetId) {
        Asset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", assetId));
        
        // Check if asset is deleted
        if (asset.getDeleted()) {
            throw new ResourceNotFoundException("Asset", "assetId", assetId);
        }
        
        return convertToDTO(asset);
    }

    @Override
    public PageResponse<AssetDTO> getAllAssets(Pageable pageable) {
        Page<Asset> assetPage = assetRepository.findAllActive(pageable);
        return createPageResponse(assetPage);
    }

    @Override
    public PageResponse<AssetDTO> searchAssets(String search, Pageable pageable) {
        Page<Asset> assetPage = assetRepository.searchAssets(search, pageable);
        return createPageResponse(assetPage);
    }

    @Override
    @Transactional
    public void deleteAsset(Long assetId) {
        Asset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", assetId));
        
        // Check if already deleted
        if (asset.getDeleted()) {
            throw new IllegalStateException("Asset is already deleted: " + assetId);
        }
        
        // Perform soft delete
        asset.setDeleted(true);
        assetRepository.save(asset);
        
        // Log the soft deletion
        auditLogService.logAssetAction(
            asset,
            asset.getCurrentUser(),
            "SOFT_DELETE",
            "Asset soft deleted"
        );
    }

    // Removed filtering methods - use frontend filtering instead

    @Override
public List<AssetDTO> getAssetsByPONumber(String poNumber) {
    List<Asset> assets = assetRepository.findByPoNumber(poNumber);
    return assets.stream()
        .map(assetMapper::toDTO)
        .collect(Collectors.toList());
}


    // Removed remaining filtering methods - use frontend filtering instead

    @Override
    public PageResponse<AssetDTO> getDeletedAssets(Pageable pageable) {
        Page<Asset> assetPage = assetRepository.findAllDeleted(pageable);
        return createPageResponse(assetPage);
    }

    @Override
    public PageResponse<AssetDTO> getAllAssetsIncludingDeleted(Pageable pageable) {
        Page<Asset> assetPage = assetRepository.findAll(pageable);
        return createPageResponse(assetPage);
    }

    @Override
    @Transactional
    public void restoreAsset(Long assetId) {
        Asset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", assetId));
        
        if (!asset.getDeleted()) {
            throw new IllegalStateException("Asset is not deleted: " + assetId);
        }
        
        // Restore the asset
        asset.setDeleted(false);
        assetRepository.save(asset);
        
        // Log the restoration
        auditLogService.logAssetAction(
            asset,
            asset.getCurrentUser(),
            "RESTORE",
            "Asset restored from soft delete"
        );
    }

    @Override
    @Transactional
    public void permanentlyDeleteAsset(Long assetId) {
        Asset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", assetId));
        
        // Log before permanent deletion
        auditLogService.logAssetAction(
            asset,
            asset.getCurrentUser(),
            "PERMANENT_DELETE",
            "Asset permanently deleted"
        );
        
        // Perform hard delete
        assetRepository.delete(asset);
    }

    @Override
    @Transactional
    public AssetDTO updateAssetStatus(Long assetId, AssetStatusHistoryDTO statusHistoryDTO) {
        log.info("Updating asset status for ID: {} with status: {}", assetId, statusHistoryDTO.getStatus());
        
        Asset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", assetId));
        
        // Check if asset is deleted
        if (asset.getDeleted()) {
            throw new IllegalStateException("Cannot update deleted asset with ID: " + assetId);
        }
        
        // Store old status for audit
        String oldStatus = asset.getStatus();
        String originalStatusInput = statusHistoryDTO.getStatus();
        
        // Normalize and update asset status
        String normalizedStatus = normalizeStatus(statusHistoryDTO.getStatus());
        asset.setStatus(normalizedStatus);
        Asset updatedAsset = assetRepository.save(asset);
        
        // Create status history entry with normalized status
        statusHistoryDTO.setAssetId(assetId);
        statusHistoryDTO.setStatus(normalizedStatus); // Use normalized status for history
        assetStatusHistoryService.createStatusHistory(statusHistoryDTO);
        
        // Log status change
        auditLogService.logAssetAction(
            updatedAsset,
            updatedAsset.getCurrentUser(),
            "STATUS_CHANGE",
            String.format("Status changed from %s to %s. Remarks: %s", 
                oldStatus, updatedAsset.getStatus(), statusHistoryDTO.getRemarks())
        );
        
        log.info("Successfully updated asset status for ID: {} from {} to {} (normalized from: {})", 
            assetId, oldStatus, updatedAsset.getStatus(), originalStatusInput);
        
        return convertToDTO(updatedAsset);
    }

    /**
     * Normalize status values to handle frontend/backend differences
     */
    private String normalizeStatus(String status) {
        if (status == null) return null;
        
        String trimmedStatus = status.trim();
        
        // Convert frontend values to backend values
        switch (trimmedStatus.toLowerCase()) {
            case "in stock": 
            case "in_stock": 
                return "IN_STOCK";
            case "active": 
                return "ACTIVE";
            case "in repair": 
            case "in_repair": 
                return "IN_REPAIR";
            case "broken": 
                return "BROKEN";
            case "ceased": 
                return "CEASED";
            default: 
                // Check if it's already in backend format (case-insensitive)
                String upperStatus = trimmedStatus.toUpperCase();
                if (upperStatus.equals("IN_STOCK") || 
                    upperStatus.equals("ACTIVE") || 
                    upperStatus.equals("IN_REPAIR") || 
                    upperStatus.equals("BROKEN") || 
                    upperStatus.equals("CEASED")) {
                    return upperStatus;
                }
                // If we reach here, it's an invalid status
                log.warn("Unknown status value: '{}'. Returning as uppercase.", trimmedStatus);
                return trimmedStatus.toUpperCase();
        }
    }

    private void updateAssetFromDTO(Asset asset, AssetDTO dto) {
        log.debug("Updating asset {} with DTO - partial update mode", asset.getAssetId());
        
        boolean hasUpdates = false;
        
        // Update foreign key relationships only if provided
        if (dto.getAssetTypeId() != null) {
            log.debug("Updating assetType from '{}' to '{}'", 
                asset.getAssetType() != null ? asset.getAssetType().getId() : null, dto.getAssetTypeId());
            asset.setAssetType(assetTypeRepository.findById(dto.getAssetTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("AssetType", "id", dto.getAssetTypeId())));
            hasUpdates = true;
        }
        
        if (dto.getMakeId() != null) {
            log.debug("Updating make from '{}' to '{}'", 
                asset.getMake() != null ? asset.getMake().getId() : null, dto.getMakeId());
            asset.setMake(assetMakeRepository.findById(dto.getMakeId())
                .orElseThrow(() -> new ResourceNotFoundException("AssetMake", "id", dto.getMakeId())));
            hasUpdates = true;
        }
        
        if (dto.getModelId() != null) {
            log.debug("Updating model from '{}' to '{}'", 
                asset.getModel() != null ? asset.getModel().getId() : null, dto.getModelId());
            asset.setModel(assetModelRepository.findById(dto.getModelId())
                .orElseThrow(() -> new ResourceNotFoundException("AssetModel", "id", dto.getModelId())));
            hasUpdates = true;
        }

        // Update asset category
        if (dto.getAssetCategory() != null) {
            log.debug("Updating assetCategory from '{}' to '{}'", asset.getAssetCategory(), dto.getAssetCategory());
            asset.setAssetCategory(dto.getAssetCategory().toUpperCase());
            hasUpdates = true;
        }

        // Update basic fields only if provided
        if (dto.getName() != null) {
            log.debug("Updating name from '{}' to '{}'", asset.getName(), dto.getName());
            asset.setName(dto.getName());
            hasUpdates = true;
        }
        
        if (dto.getSerialNumber() != null) {
            log.debug("Updating serialNumber from '{}' to '{}'", asset.getSerialNumber(), dto.getSerialNumber());
            asset.setSerialNumber(dto.getSerialNumber());
            hasUpdates = true;
        }
        
        if (dto.getItAssetCode() != null) {
            log.debug("Updating itAssetCode from '{}' to '{}'", asset.getItAssetCode(), dto.getItAssetCode());
            asset.setItAssetCode(dto.getItAssetCode());
            hasUpdates = true;
        }
        
        if (dto.getMacAddress() != null) {
            log.debug("Updating macAddress from '{}' to '{}'", asset.getMacAddress(), dto.getMacAddress());
            asset.setMacAddress(dto.getMacAddress());
            hasUpdates = true;
        }
        
        if (dto.getIpv4Address() != null) {
            log.debug("Updating ipv4Address from '{}' to '{}'", asset.getIpv4Address(), dto.getIpv4Address());
            asset.setIpv4Address(dto.getIpv4Address());
            hasUpdates = true;
        }
        
        if (dto.getStatus() != null) {
            String normalizedStatus = normalizeStatus(dto.getStatus());
            log.debug("Updating status from '{}' to '{}' (normalized from '{}')", asset.getStatus(), normalizedStatus, dto.getStatus());
            asset.setStatus(normalizedStatus);
            hasUpdates = true;
        }
        
        if (dto.getOwnerType() != null) {
            log.debug("Updating ownerType from '{}' to '{}'", asset.getOwnerType(), dto.getOwnerType());
            asset.setOwnerType(dto.getOwnerType());
            hasUpdates = true;
        }
        
        if (dto.getAcquisitionType() != null) {
            log.debug("Updating acquisitionType from '{}' to '{}'", asset.getAcquisitionType(), dto.getAcquisitionType());
            asset.setAcquisitionType(dto.getAcquisitionType());
            hasUpdates = true;
        }

        if (dto.getCurrentUserId() != null) {
            User user = userRepository.findById(dto.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", dto.getCurrentUserId()));
            log.debug("Updating currentUser from '{}' to '{}'", 
                asset.getCurrentUser() != null ? asset.getCurrentUser().getId() : null, user.getId());
            asset.setCurrentUser(user);
            hasUpdates = true;
        }

        if (dto.getInventoryLocation() != null) {
            log.debug("Updating inventoryLocation from '{}' to '{}'", asset.getInventoryLocation(), dto.getInventoryLocation());
            asset.setInventoryLocation(dto.getInventoryLocation());
            hasUpdates = true;
        }

        if (dto.getOsId() != null) {
            asset.setOs(osRepository.findById(dto.getOsId())
                .orElseThrow(() -> new ResourceNotFoundException("OS", "id", dto.getOsId())));
            hasUpdates = true;
        }

        if (dto.getOsVersionId() != null) {
            asset.setOsVersion(osVersionRepository.findById(dto.getOsVersionId())
                .orElseThrow(() -> new ResourceNotFoundException("OSVersion", "id", dto.getOsVersionId())));
            hasUpdates = true;
        }

        if (dto.getVendorId() != null) {
            asset.setVendor(vendorRepository.findById(dto.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", "id", dto.getVendorId())));
            hasUpdates = true;
        }

        if (dto.getExtendedWarrantyVendorId() != null) {
            asset.setExtendedWarrantyVendor(vendorRepository.findById(dto.getExtendedWarrantyVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", "id", dto.getExtendedWarrantyVendorId())));
            hasUpdates = true;
        }

        if (dto.getPoNumber() != null) {
            log.debug("Updating poNumber from '{}' to '{}'", asset.getPoNumber(), dto.getPoNumber());
            asset.setPoNumber(dto.getPoNumber());
            hasUpdates = true;
        }
        
        if (dto.getInvoiceNumber() != null) {
            log.debug("Updating invoiceNumber from '{}' to '{}'", asset.getInvoiceNumber(), dto.getInvoiceNumber());
            asset.setInvoiceNumber(dto.getInvoiceNumber());
            hasUpdates = true;
        }
        
        if (dto.getAcquisitionDate() != null) {
            log.debug("Updating acquisitionDate from '{}' to '{}'", asset.getAcquisitionDate(), dto.getAcquisitionDate());
            asset.setAcquisitionDate(dto.getAcquisitionDate());
            hasUpdates = true;
        }
        
        if (dto.getWarrantyExpiry() != null) {
            log.debug("Updating warrantyExpiry from '{}' to '{}'", asset.getWarrantyExpiry(), dto.getWarrantyExpiry());
            asset.setWarrantyExpiry(dto.getWarrantyExpiry());
            hasUpdates = true;
        }
        
        if (dto.getExtendedWarrantyExpiry() != null) {
            log.debug("Updating extendedWarrantyExpiry from '{}' to '{}'", asset.getExtendedWarrantyExpiry(), dto.getExtendedWarrantyExpiry());
            asset.setExtendedWarrantyExpiry(dto.getExtendedWarrantyExpiry());
            hasUpdates = true;
        }
        
        if (dto.getLeaseEndDate() != null) {
            log.debug("Updating leaseEndDate from '{}' to '{}'", asset.getLeaseEndDate(), dto.getLeaseEndDate());
            asset.setLeaseEndDate(dto.getLeaseEndDate());
            hasUpdates = true;
        }

        // Update software license fields
        if (dto.getLicenseName() != null) {
            log.debug("Updating licenseName from '{}' to '{}'", asset.getLicenseName(), dto.getLicenseName());
            asset.setLicenseName(dto.getLicenseName());
            hasUpdates = true;
        }

        if (dto.getLicenseValidityPeriod() != null) {
            log.debug("Updating licenseValidityPeriod from '{}' to '{}'", asset.getLicenseValidityPeriod(), dto.getLicenseValidityPeriod());
            asset.setLicenseValidityPeriod(dto.getLicenseValidityPeriod());
            hasUpdates = true;
        }


        
        if (dto.getRentalAmount() != null) {
            log.debug("Updating rentalAmount from '{}' to '{}'", asset.getRentalAmount(), dto.getRentalAmount());
            asset.setRentalAmount(dto.getRentalAmount());
            hasUpdates = true;
        }
        
        if (dto.getAcquisitionPrice() != null) {
            log.debug("Updating acquisitionPrice from '{}' to '{}'", asset.getAcquisitionPrice(), dto.getAcquisitionPrice());
            asset.setAcquisitionPrice(dto.getAcquisitionPrice());
            hasUpdates = true;
        }
        
        if (dto.getDepreciationPct() != null) {
            log.debug("Updating depreciationPct from '{}' to '{}'", asset.getDepreciationPct(), dto.getDepreciationPct());
            asset.setDepreciationPct(dto.getDepreciationPct());
            hasUpdates = true;
        }
        
        if (dto.getCurrentPrice() != null) {
            log.debug("Updating currentPrice from '{}' to '{}'", asset.getCurrentPrice(), dto.getCurrentPrice());
            asset.setCurrentPrice(dto.getCurrentPrice());
            hasUpdates = true;
        }
        
        if (dto.getMinContractPeriod() != null) {
            log.debug("Updating minContractPeriod from '{}' to '{}'", asset.getMinContractPeriod(), dto.getMinContractPeriod());
            asset.setMinContractPeriod(dto.getMinContractPeriod());
            hasUpdates = true;
        }
        
        if (dto.getTags() != null) {
            log.debug("Updating tags from '{}' to '{}'", asset.getTags(), dto.getTags());
            asset.setTags(dto.getTags());
            hasUpdates = true;
        }
        
        // Handle deleted field - only set if provided, otherwise keep existing value
        if (dto.getDeleted() != null) {
            log.debug("Updating deleted from '{}' to '{}'", asset.getDeleted(), dto.getDeleted());
            asset.setDeleted(dto.getDeleted());
            hasUpdates = true;
        }
        
        if (!hasUpdates) {
            log.warn("No fields were updated for asset {} - all DTO fields were null", asset.getAssetId());
        } else {
            log.debug("Asset {} has pending updates", asset.getAssetId());
        }
    }

    private AssetDTO convertToDTO(Asset asset) {
        AssetDTO dto = new AssetDTO();
        dto.setAssetId(asset.getAssetId());
        dto.setAssetTypeId(asset.getAssetType() != null ? asset.getAssetType().getId() : null);
        dto.setAssetCategory(asset.getAssetCategory());
        dto.setMakeId(asset.getMake() != null ? asset.getMake().getId() : null);
        dto.setModelId(asset.getModel() != null ? asset.getModel().getId() : null);
        dto.setName(asset.getName());
        dto.setSerialNumber(asset.getSerialNumber());
        dto.setItAssetCode(asset.getItAssetCode());
        dto.setMacAddress(asset.getMacAddress());
        dto.setIpv4Address(asset.getIpv4Address());
        
        dto.setStatus(asset.getStatus());
        dto.setOwnerType(asset.getOwnerType());
        dto.setAcquisitionType(asset.getAcquisitionType());
        
        if (asset.getCurrentUser() != null) {
            dto.setCurrentUserId(asset.getCurrentUser().getId());
        }
        
        dto.setInventoryLocation(asset.getInventoryLocation());
        
        if (asset.getOs() != null) {
            dto.setOsId(asset.getOs().getId());
        }
        if (asset.getOsVersion() != null) {
            dto.setOsVersionId(asset.getOsVersion().getId());
        }
        if (asset.getVendor() != null) {
            dto.setVendorId(asset.getVendor().getId());
        }
        if (asset.getExtendedWarrantyVendor() != null) {
            dto.setExtendedWarrantyVendorId(asset.getExtendedWarrantyVendor().getId());
        }

        dto.setPoNumber(asset.getPoNumber());
        dto.setInvoiceNumber(asset.getInvoiceNumber());
        dto.setAcquisitionDate(asset.getAcquisitionDate());
        dto.setWarrantyExpiry(asset.getWarrantyExpiry());
        dto.setExtendedWarrantyExpiry(asset.getExtendedWarrantyExpiry());
        dto.setLeaseEndDate(asset.getLeaseEndDate());
        
        // Software License Fields
        dto.setLicenseName(asset.getLicenseName());
        dto.setLicenseValidityPeriod(asset.getLicenseValidityPeriod());

        
        dto.setRentalAmount(asset.getRentalAmount());
        dto.setAcquisitionPrice(asset.getAcquisitionPrice());
        dto.setDepreciationPct(asset.getDepreciationPct());
        dto.setCurrentPrice(asset.getCurrentPrice());
        dto.setMinContractPeriod(asset.getMinContractPeriod());
        dto.setTags(asset.getTags());
        dto.setCreatedAt(asset.getCreatedAt());
        dto.setUpdatedAt(asset.getUpdatedAt());
        
        // Include deleted flag
        dto.setDeleted(asset.getDeleted());
        
        // Set computed fields for frontend
        dto.setWarrantyStatus(asset.getWarrantyStatus());
        dto.setLicenseStatus(asset.getLicenseStatus());
        
        return dto;
    }

    private PageResponse<AssetDTO> createPageResponse(Page<Asset> page) {
        return new PageResponse<>(
            page.getContent().stream().map(this::convertToDTO).toList(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.isLast(),
            page.isFirst()
        );
    }

    // Bulk operations implementation
    @Override
    @Transactional
    public BulkAssetResponse createAssetsInBulk(List<AssetRequestDTO> requests) {
        log.info("=== SERVICE LAYER: Starting bulk asset creation for {} assets ===", requests.size());
        
        // Validate input
        if (requests == null || requests.isEmpty()) {
            throw new IllegalArgumentException("Asset request list cannot be null or empty");
        }
        
        BulkAssetResponse.BulkAssetResponseBuilder responseBuilder = BulkAssetResponse.builder()
            .totalProcessed(requests.size())
            .successCount(0)
            .failureCount(0);
        
        List<BulkAssetResponse.BulkAssetError> errors = new ArrayList<>();
        List<AssetDTO> successfulAssets = new ArrayList<>();
        
        // Process each asset request
        for (int i = 0; i < requests.size(); i++) {
            AssetRequestDTO request = requests.get(i);
            
            log.debug("Processing asset[{}]: {}", i, request.getSerialNumber() != null ? request.getSerialNumber() : request.getName());
            
            try {
                // Step 1: Validate the request using Bean Validation
                Set<ConstraintViolation<AssetRequestDTO>> violations = validator.validate(request);
                if (!violations.isEmpty()) {
                    String errorMessage = violations.stream()
                        .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                        .reduce((a, b) -> a + "; " + b)
                        .orElse("Validation failed");
                    
                    log.warn("Validation failed for asset[{}]: {}", i, errorMessage);
                    errors.add(BulkAssetResponse.BulkAssetError.builder()
                        .index(i)
                        .field("validation")
                        .message(errorMessage)
                        .assetIdentifier(request.getSerialNumber() != null ? request.getSerialNumber() : request.getName())
                        .build());
                    continue;
                }
                
                // Step 2: Comprehensive validation using validation service
                AssetValidationService.AssetValidationResult validationResult = 
                    assetValidationService.validateAssetForCreation(request, i);
                
                if (!validationResult.isValid()) {
                    String errorMessage = String.join("; ", validationResult.getErrors());
                    log.warn("Validation failed for asset[{}]: {}", i, errorMessage);
                    errors.add(BulkAssetResponse.BulkAssetError.builder()
                        .index(i)
                        .field("validation")
                        .message(errorMessage)
                        .assetIdentifier(request.getSerialNumber() != null ? request.getSerialNumber() : request.getName())
                        .build());
                    continue;
                }
                
                // Step 3: Create the asset using mapper with validation context
                Asset asset = assetMapper.toEntityWithContext(request, validationResult.getContext());
                Asset savedAsset = assetRepository.save(asset);
                
                log.debug("Successfully created asset[{}] with ID: {}", i, savedAsset.getAssetId());
                
                // Log the creation
                auditLogService.logAssetAction(
                    savedAsset,
                    savedAsset.getCurrentUser(),
                    "BULK_CREATE",
                    "Asset created via bulk operation with name: " + savedAsset.getName()
                );
                
                successfulAssets.add(assetMapper.toDTO(savedAsset));
                
            } catch (DataIntegrityViolationException e) {
                log.error("Data integrity violation for asset[{}]: {}", i, e.getMessage(), e);
                
                String errorMessage = parseDataIntegrityError(e, request);
                errors.add(BulkAssetResponse.BulkAssetError.builder()
                    .index(i)
                    .field("dataIntegrity")
                    .message(errorMessage)
                    .assetIdentifier(request.getSerialNumber() != null ? request.getSerialNumber() : request.getName())
                    .build());
                    
            } catch (ResourceNotFoundException e) {
                log.error("Resource not found for asset[{}]: {}", i, e.getMessage(), e);
                errors.add(BulkAssetResponse.BulkAssetError.builder()
                    .index(i)
                    .field("resourceNotFound")
                    .message("Referenced resource not found: " + e.getMessage())
                    .assetIdentifier(request.getSerialNumber() != null ? request.getSerialNumber() : request.getName())
                    .build());
                    
            } catch (IllegalArgumentException e) {
                log.error("Invalid argument for asset[{}]: {}", i, e.getMessage(), e);
                errors.add(BulkAssetResponse.BulkAssetError.builder()
                    .index(i)
                    .field("invalidArgument")
                    .message("Invalid data provided: " + e.getMessage())
                    .assetIdentifier(request.getSerialNumber() != null ? request.getSerialNumber() : request.getName())
                    .build());
                    
            } catch (Exception e) {
                log.error("Unexpected error creating asset[{}]: {}", i, e.getMessage(), e);
                errors.add(BulkAssetResponse.BulkAssetError.builder()
                    .index(i)
                    .field("unexpected")
                    .message("Unexpected error: " + e.getMessage())
                    .assetIdentifier(request.getSerialNumber() != null ? request.getSerialNumber() : request.getName())
                    .build());
            }
        }
        
        BulkAssetResponse response = responseBuilder
            .successCount(successfulAssets.size())
            .failureCount(errors.size())
            .errors(errors)
            .successfulAssets(successfulAssets)
            .build();
        
        log.info("=== SERVICE LAYER: Bulk asset creation completed - Success: {}, Failures: {} ===", 
            response.getSuccessCount(), response.getFailureCount());
        
        return response;
    }
    

    
    private String parseDataIntegrityError(DataIntegrityViolationException e, AssetRequestDTO request) {
        String message = e.getMessage();
        if (message == null) {
            return "Data integrity constraint violation";
        }
        
        String lowerMessage = message.toLowerCase();
        
        if (lowerMessage.contains("serial") && lowerMessage.contains("unique")) {
            return "Serial number '" + request.getSerialNumber() + "' already exists";
        }
        if (lowerMessage.contains("it_asset_code") && lowerMessage.contains("unique")) {
            return "IT Asset Code '" + request.getItAssetCode() + "' already exists";
        }
        if (lowerMessage.contains("foreign key") || lowerMessage.contains("fk_")) {
            return "Invalid reference to related entity - check asset type, make, model, user, vendor, or OS IDs";
        }
        if (lowerMessage.contains("not null") || lowerMessage.contains("null constraint")) {
            return "Required field is missing - check all mandatory fields";
        }
        if (lowerMessage.contains("check constraint")) {
            return "Data validation failed - check field values and constraints";
        }
        
        return "Data integrity constraint violation: " + message;
    }
    
    @Override
    @Transactional
    public void updateAssetsByPO(String poNumber, AssetUpdateDTO updates) {
        log.info("Starting bulk update for assets with PO number: {}", poNumber);
        log.debug("Update DTO received: {}", updates);
        
        if (poNumber == null || poNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("PO number cannot be null or empty");
        }

        List<Asset> assets = assetRepository.findByPoNumber(poNumber);
        
        if (assets.isEmpty()) {
            log.warn("No assets found for PO number: {}", poNumber);
            return;
        }
        
        log.info("Found {} assets to update for PO number: {}", assets.size(), poNumber);
        
        for (Asset asset : assets) {
            try {
                log.debug("Processing asset {} - before update: name='{}', status='{}'", 
                    asset.getAssetId(), asset.getName(), asset.getStatus());
                
                // Capture before state for comparison
                LocalDateTime beforeUpdatedAt = asset.getUpdatedAt();
                
                updateAssetFromUpdateDTO(asset, updates);
                Asset updatedAsset = assetRepository.save(asset);
                
                log.debug("Asset {} saved - after update: name='{}', status='{}', updatedAt changed from '{}' to '{}'", 
                    updatedAsset.getAssetId(), updatedAsset.getName(), updatedAsset.getStatus(), 
                    beforeUpdatedAt, updatedAsset.getUpdatedAt());
                
                // Log the update
                auditLogService.logAssetAction(
                    updatedAsset,
                    updatedAsset.getCurrentUser(),
                    "BULK_UPDATE_BY_PO",
                    "Asset updated via bulk PO operation for PO: " + poNumber
                );
            } catch (Exception e) {
                log.error("Error updating asset {} for PO {}: {}", asset.getAssetId(), poNumber, e.getMessage(), e);
                // Continue with other assets instead of failing the entire operation
            }
        }
        
        log.info("Bulk update completed for PO number: {}", poNumber);
    }
    
    @Override
    @Transactional
    public void deleteAssetsByPO(String poNumber) {
        log.info("Starting bulk delete for assets with PO number: {}", poNumber);
        
        if (poNumber == null || poNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("PO number cannot be null or empty");
        }
        
        List<Asset> assets = assetRepository.findByPoNumber(poNumber);
        
        if (assets.isEmpty()) {
            log.warn("No assets found for PO number: {}", poNumber);
            return;
        }
        
        log.info("Found {} assets to delete for PO number: {}", assets.size(), poNumber);
        
        // Perform soft delete on each asset
        for (Asset asset : assets) {
            try {
                asset.setDeleted(true);
                assetRepository.save(asset);
                
                // Log the soft deletion
                auditLogService.logAssetAction(
                    asset,
                    asset.getCurrentUser(),
                    "BULK_DELETE_BY_PO",
                    "Asset soft deleted via bulk PO operation for PO: " + poNumber
                );
            } catch (Exception e) {
                log.error("Error deleting asset {} for PO {}: {}", asset.getAssetId(), poNumber, e.getMessage(), e);
                // Continue with other assets instead of failing the entire operation
            }
        }
        
        log.info("Bulk delete completed for PO number: {}", poNumber);
    }
    
    private void updateAssetFromUpdateDTO(Asset asset, AssetUpdateDTO updateDTO) {
        log.debug("Updating asset {} with DTO: {}", asset.getAssetId(), updateDTO);
        
        boolean hasUpdates = false;
        
        // Only update fields that are provided (not null)
        if (updateDTO.getName() != null) {
            log.debug("Updating name from '{}' to '{}'", asset.getName(), updateDTO.getName());
            asset.setName(updateDTO.getName());
            hasUpdates = true;
        }
        if (updateDTO.getStatus() != null) {
            String normalizedStatus = normalizeStatus(updateDTO.getStatus());
            log.debug("Updating status from '{}' to '{}' (normalized from '{}')", asset.getStatus(), normalizedStatus, updateDTO.getStatus());
            asset.setStatus(normalizedStatus);
            hasUpdates = true;
        }
        if (updateDTO.getOwnerType() != null) {
            log.debug("Updating ownerType from '{}' to '{}'", asset.getOwnerType(), updateDTO.getOwnerType());
            asset.setOwnerType(updateDTO.getOwnerType());
            hasUpdates = true;
        }
        if (updateDTO.getAcquisitionType() != null) {
            log.debug("Updating acquisitionType from '{}' to '{}'", asset.getAcquisitionType(), updateDTO.getAcquisitionType());
            asset.setAcquisitionType(updateDTO.getAcquisitionType());
            hasUpdates = true;
        }
        if (updateDTO.getCurrentUserId() != null) {
            User user = userRepository.findById(updateDTO.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", updateDTO.getCurrentUserId()));
            log.debug("Updating currentUser from '{}' to '{}'", 
                asset.getCurrentUser() != null ? asset.getCurrentUser().getId() : null, user.getId());
            asset.setCurrentUser(user);
            hasUpdates = true;
        }
        if (updateDTO.getInventoryLocation() != null) {
            log.debug("Updating inventoryLocation from '{}' to '{}'", asset.getInventoryLocation(), updateDTO.getInventoryLocation());
            asset.setInventoryLocation(updateDTO.getInventoryLocation());
            hasUpdates = true;
        }
        if (updateDTO.getOsId() != null) {
            asset.setOs(osRepository.findById(updateDTO.getOsId())
                .orElseThrow(() -> new ResourceNotFoundException("OS", "id", updateDTO.getOsId())));
            hasUpdates = true;
        }
        if (updateDTO.getOsVersionId() != null) {
            asset.setOsVersion(osVersionRepository.findById(updateDTO.getOsVersionId())
                .orElseThrow(() -> new ResourceNotFoundException("OSVersion", "id", updateDTO.getOsVersionId())));
            hasUpdates = true;
        }
        if (updateDTO.getMacAddress() != null) {
            log.debug("Updating macAddress from '{}' to '{}'", asset.getMacAddress(), updateDTO.getMacAddress());
            asset.setMacAddress(updateDTO.getMacAddress());
            hasUpdates = true;
        }
        if (updateDTO.getIpv4Address() != null) {
            log.debug("Updating ipv4Address from '{}' to '{}'", asset.getIpv4Address(), updateDTO.getIpv4Address());
            asset.setIpv4Address(updateDTO.getIpv4Address());
            hasUpdates = true;
        }
        if (updateDTO.getAcquisitionDate() != null) {
            log.debug("Updating acquisitionDate from '{}' to '{}'", asset.getAcquisitionDate(), updateDTO.getAcquisitionDate());
            asset.setAcquisitionDate(updateDTO.getAcquisitionDate());
            hasUpdates = true;
        }
        if (updateDTO.getWarrantyExpiry() != null) {
            log.debug("Updating warrantyExpiry from '{}' to '{}'", asset.getWarrantyExpiry(), updateDTO.getWarrantyExpiry());
            asset.setWarrantyExpiry(updateDTO.getWarrantyExpiry());
            hasUpdates = true;
        }
        if (updateDTO.getExtendedWarrantyExpiry() != null) {
            log.debug("Updating extendedWarrantyExpiry from '{}' to '{}'", asset.getExtendedWarrantyExpiry(), updateDTO.getExtendedWarrantyExpiry());
            asset.setExtendedWarrantyExpiry(updateDTO.getExtendedWarrantyExpiry());
            hasUpdates = true;
        }
        if (updateDTO.getLeaseEndDate() != null) {
            log.debug("Updating leaseEndDate from '{}' to '{}'", asset.getLeaseEndDate(), updateDTO.getLeaseEndDate());
            asset.setLeaseEndDate(updateDTO.getLeaseEndDate());
            hasUpdates = true;
        }
        if (updateDTO.getVendorId() != null) {
            asset.setVendor(vendorRepository.findById(updateDTO.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", "id", updateDTO.getVendorId())));
            hasUpdates = true;
        }
        if (updateDTO.getExtendedWarrantyVendorId() != null) {
            asset.setExtendedWarrantyVendor(vendorRepository.findById(updateDTO.getExtendedWarrantyVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", "id", updateDTO.getExtendedWarrantyVendorId())));
            hasUpdates = true;
        }
        if (updateDTO.getRentalAmount() != null) {
            log.debug("Updating rentalAmount from '{}' to '{}'", asset.getRentalAmount(), updateDTO.getRentalAmount());
            asset.setRentalAmount(updateDTO.getRentalAmount());
            hasUpdates = true;
        }
        if (updateDTO.getAcquisitionPrice() != null) {
            log.debug("Updating acquisitionPrice from '{}' to '{}'", asset.getAcquisitionPrice(), updateDTO.getAcquisitionPrice());
            asset.setAcquisitionPrice(updateDTO.getAcquisitionPrice());
            hasUpdates = true;
        }
        if (updateDTO.getDepreciationPct() != null) {
            log.debug("Updating depreciationPct from '{}' to '{}'", asset.getDepreciationPct(), updateDTO.getDepreciationPct());
            asset.setDepreciationPct(updateDTO.getDepreciationPct());
            hasUpdates = true;
        }
        if (updateDTO.getCurrentPrice() != null) {
            log.debug("Updating currentPrice from '{}' to '{}'", asset.getCurrentPrice(), updateDTO.getCurrentPrice());
            asset.setCurrentPrice(updateDTO.getCurrentPrice());
            hasUpdates = true;
        }
        if (updateDTO.getMinContractPeriod() != null) {
            log.debug("Updating minContractPeriod from '{}' to '{}'", asset.getMinContractPeriod(), updateDTO.getMinContractPeriod());
            asset.setMinContractPeriod(updateDTO.getMinContractPeriod());
            hasUpdates = true;
        }
        if (updateDTO.getTags() != null) {
            log.debug("Updating tags from '{}' to '{}'", asset.getTags(), updateDTO.getTags());
            asset.setTags(updateDTO.getTags());
            hasUpdates = true;
        }
        
        if (!hasUpdates) {
            log.warn("No fields were updated for asset {} - all DTO fields were null", asset.getAssetId());
        } else {
            log.debug("Asset {} has {} pending updates", asset.getAssetId(), hasUpdates ? "some" : "no");
        }
    }

    @Override
    @Transactional
    public BulkUpdateResponse updateAssetsInBulk(AssetBulkUpdateDTO bulkUpdate) {
        log.info("Starting bulk update for {} assets", bulkUpdate.getAssets().size());
        
        BulkUpdateResponse.BulkUpdateResponseBuilder responseBuilder = BulkUpdateResponse.builder()
            .totalProcessed(bulkUpdate.getAssets().size())
            .successCount(0)
            .failureCount(0);
        
        List<BulkUpdateResponse.BulkUpdateError> errors = new ArrayList<>();
        List<AssetDTO> updatedAssets = new ArrayList<>();
        
        for (AssetIndividualUpdateDTO updateRequest : bulkUpdate.getAssets()) {
            try {
                log.debug("Processing asset update for ID: {}", updateRequest.getAssetId());
                
                // Find the asset
                Asset asset = assetRepository.findById(updateRequest.getAssetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", updateRequest.getAssetId()));
                
                // Check if asset is deleted
                if (asset.getDeleted()) {
                    throw new IllegalStateException("Cannot update deleted asset with ID: " + updateRequest.getAssetId());
                }
                
                // Store old values for audit
                String oldStatus = asset.getStatus();
                User oldUser = asset.getCurrentUser();
                
                // Update the asset with individual update data
                updateAssetFromIndividualUpdateDTO(asset, updateRequest);
                Asset updatedAsset = assetRepository.save(asset);
                
                log.debug("Successfully updated asset ID: {}", updatedAsset.getAssetId());
                
                // Log status change if applicable
                if (!oldStatus.equals(updatedAsset.getStatus())) {
                    auditLogService.logAssetAction(
                        updatedAsset,
                        updatedAsset.getCurrentUser(),
                        "BULK_STATUS_CHANGE",
                        String.format("Status changed from %s to %s via bulk update", oldStatus, updatedAsset.getStatus())
                    );
                }
                
                // Log user assignment change if applicable
                if (oldUser != updatedAsset.getCurrentUser()) {
                    auditLogService.logAssetAction(
                        updatedAsset,
                        updatedAsset.getCurrentUser(),
                        "BULK_USER_ASSIGNMENT",
                        String.format("Asset reassigned from %s to %s via bulk update",
                            oldUser != null ? oldUser.getId() : "none",
                            updatedAsset.getCurrentUser() != null ? updatedAsset.getCurrentUser().getId() : "none")
                    );
                }
                
                // Log the general update
                auditLogService.logAssetAction(
                    updatedAsset,
                    updatedAsset.getCurrentUser(),
                    "BULK_UPDATE",
                    "Asset updated via bulk operation"
                );
                
                updatedAssets.add(convertToDTO(updatedAsset));
                
            } catch (ResourceNotFoundException e) {
                log.error("Asset not found for ID {}: {}", updateRequest.getAssetId(), e.getMessage());
                errors.add(BulkUpdateResponse.BulkUpdateError.builder()
                    .assetId(updateRequest.getAssetId())
                    .field("assetId")
                    .message("Asset not found: " + e.getMessage())
                    .assetIdentifier(updateRequest.getAssetId().toString())
                    .build());
                    
            } catch (IllegalStateException e) {
                log.error("Invalid state for asset ID {}: {}", updateRequest.getAssetId(), e.getMessage());
                errors.add(BulkUpdateResponse.BulkUpdateError.builder()
                    .assetId(updateRequest.getAssetId())
                    .field("deleted")
                    .message(e.getMessage())
                    .assetIdentifier(updateRequest.getAssetId().toString())
                    .build());
                    
            } catch (Exception e) {
                log.error("Unexpected error updating asset ID {}: {}", updateRequest.getAssetId(), e.getMessage(), e);
                errors.add(BulkUpdateResponse.BulkUpdateError.builder()
                    .assetId(updateRequest.getAssetId())
                    .field("unexpected")
                    .message("Unexpected error: " + e.getMessage())
                    .assetIdentifier(updateRequest.getAssetId().toString())
                    .build());
            }
        }
        
        BulkUpdateResponse response = responseBuilder
            .successCount(updatedAssets.size())
            .failureCount(errors.size())
            .updatedAssets(updatedAssets)
            .errors(errors)
            .build();
        
        log.info("Bulk update completed - Success: {}, Failures: {}", 
            response.getSuccessCount(), response.getFailureCount());
        
        return response;
    }
    
    private void updateAssetFromIndividualUpdateDTO(Asset asset, AssetIndividualUpdateDTO updateDTO) {
        log.debug("Updating asset {} with individual update DTO", asset.getAssetId());
        
        boolean hasUpdates = false;
        
        // Update only non-null fields
        if (updateDTO.getName() != null) {
            log.debug("Updating name from '{}' to '{}'", asset.getName(), updateDTO.getName());
            asset.setName(updateDTO.getName());
            hasUpdates = true;
        }
        if (updateDTO.getSerialNumber() != null) {
            log.debug("Updating serialNumber from '{}' to '{}'", asset.getSerialNumber(), updateDTO.getSerialNumber());
            asset.setSerialNumber(updateDTO.getSerialNumber());
            hasUpdates = true;
        }
        if (updateDTO.getItAssetCode() != null) {
            log.debug("Updating itAssetCode from '{}' to '{}'", asset.getItAssetCode(), updateDTO.getItAssetCode());
            asset.setItAssetCode(updateDTO.getItAssetCode());
            hasUpdates = true;
        }
        if (updateDTO.getMacAddress() != null) {
            log.debug("Updating macAddress from '{}' to '{}'", asset.getMacAddress(), updateDTO.getMacAddress());
            asset.setMacAddress(updateDTO.getMacAddress());
            hasUpdates = true;
        }
        if (updateDTO.getIpv4Address() != null) {
            log.debug("Updating ipv4Address from '{}' to '{}'", asset.getIpv4Address(), updateDTO.getIpv4Address());
            asset.setIpv4Address(updateDTO.getIpv4Address());
            hasUpdates = true;
        }
        if (updateDTO.getStatus() != null) {
            String normalizedStatus = normalizeStatus(updateDTO.getStatus());
            log.debug("Updating status from '{}' to '{}' (normalized from '{}')", asset.getStatus(), normalizedStatus, updateDTO.getStatus());
            asset.setStatus(normalizedStatus);
            hasUpdates = true;
        }
        if (updateDTO.getOwnerType() != null) {
            log.debug("Updating ownerType from '{}' to '{}'", asset.getOwnerType(), updateDTO.getOwnerType());
            asset.setOwnerType(updateDTO.getOwnerType());
            hasUpdates = true;
        }
        if (updateDTO.getAcquisitionType() != null) {
            log.debug("Updating acquisitionType from '{}' to '{}'", asset.getAcquisitionType(), updateDTO.getAcquisitionType());
            asset.setAcquisitionType(updateDTO.getAcquisitionType());
            hasUpdates = true;
        }
        if (updateDTO.getCurrentUserId() != null) {
            User user = userRepository.findById(updateDTO.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", updateDTO.getCurrentUserId()));
            log.debug("Updating currentUser from '{}' to '{}'", 
                asset.getCurrentUser() != null ? asset.getCurrentUser().getId() : null, user.getId());
            asset.setCurrentUser(user);
            hasUpdates = true;
        }
        if (updateDTO.getInventoryLocation() != null) {
            log.debug("Updating inventoryLocation from '{}' to '{}'", asset.getInventoryLocation(), updateDTO.getInventoryLocation());
            asset.setInventoryLocation(updateDTO.getInventoryLocation());
            hasUpdates = true;
        }
        if (updateDTO.getOsId() != null) {
            asset.setOs(osRepository.findById(updateDTO.getOsId())
                .orElseThrow(() -> new ResourceNotFoundException("OS", "id", updateDTO.getOsId())));
            hasUpdates = true;
        }
        if (updateDTO.getOsVersionId() != null) {
            asset.setOsVersion(osVersionRepository.findById(updateDTO.getOsVersionId())
                .orElseThrow(() -> new ResourceNotFoundException("OSVersion", "id", updateDTO.getOsVersionId())));
            hasUpdates = true;
        }
        if (updateDTO.getPoNumber() != null) {
            log.debug("Updating poNumber from '{}' to '{}'", asset.getPoNumber(), updateDTO.getPoNumber());
            asset.setPoNumber(updateDTO.getPoNumber());
            hasUpdates = true;
        }
        if (updateDTO.getInvoiceNumber() != null) {
            log.debug("Updating invoiceNumber from '{}' to '{}'", asset.getInvoiceNumber(), updateDTO.getInvoiceNumber());
            asset.setInvoiceNumber(updateDTO.getInvoiceNumber());
            hasUpdates = true;
        }
        if (updateDTO.getAcquisitionDate() != null) {
            log.debug("Updating acquisitionDate from '{}' to '{}'", asset.getAcquisitionDate(), updateDTO.getAcquisitionDate());
            asset.setAcquisitionDate(updateDTO.getAcquisitionDate());
            hasUpdates = true;
        }
        if (updateDTO.getWarrantyExpiry() != null) {
            log.debug("Updating warrantyExpiry from '{}' to '{}'", asset.getWarrantyExpiry(), updateDTO.getWarrantyExpiry());
            asset.setWarrantyExpiry(updateDTO.getWarrantyExpiry());
            hasUpdates = true;
        }
        if (updateDTO.getExtendedWarrantyExpiry() != null) {
            log.debug("Updating extendedWarrantyExpiry from '{}' to '{}'", asset.getExtendedWarrantyExpiry(), updateDTO.getExtendedWarrantyExpiry());
            asset.setExtendedWarrantyExpiry(updateDTO.getExtendedWarrantyExpiry());
            hasUpdates = true;
        }
        if (updateDTO.getLeaseEndDate() != null) {
            log.debug("Updating leaseEndDate from '{}' to '{}'", asset.getLeaseEndDate(), updateDTO.getLeaseEndDate());
            asset.setLeaseEndDate(updateDTO.getLeaseEndDate());
            hasUpdates = true;
        }
        if (updateDTO.getVendorId() != null) {
            asset.setVendor(vendorRepository.findById(updateDTO.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", "id", updateDTO.getVendorId())));
            hasUpdates = true;
        }
        if (updateDTO.getExtendedWarrantyVendorId() != null) {
            asset.setExtendedWarrantyVendor(vendorRepository.findById(updateDTO.getExtendedWarrantyVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", "id", updateDTO.getExtendedWarrantyVendorId())));
            hasUpdates = true;
        }
        if (updateDTO.getRentalAmount() != null) {
            log.debug("Updating rentalAmount from '{}' to '{}'", asset.getRentalAmount(), updateDTO.getRentalAmount());
            asset.setRentalAmount(updateDTO.getRentalAmount());
            hasUpdates = true;
        }
        if (updateDTO.getAcquisitionPrice() != null) {
            log.debug("Updating acquisitionPrice from '{}' to '{}'", asset.getAcquisitionPrice(), updateDTO.getAcquisitionPrice());
            asset.setAcquisitionPrice(updateDTO.getAcquisitionPrice());
            hasUpdates = true;
        }
        if (updateDTO.getDepreciationPct() != null) {
            log.debug("Updating depreciationPct from '{}' to '{}'", asset.getDepreciationPct(), updateDTO.getDepreciationPct());
            asset.setDepreciationPct(updateDTO.getDepreciationPct());
            hasUpdates = true;
        }
        if (updateDTO.getCurrentPrice() != null) {
            log.debug("Updating currentPrice from '{}' to '{}'", asset.getCurrentPrice(), updateDTO.getCurrentPrice());
            asset.setCurrentPrice(updateDTO.getCurrentPrice());
            hasUpdates = true;
        }
        if (updateDTO.getMinContractPeriod() != null) {
            log.debug("Updating minContractPeriod from '{}' to '{}'", asset.getMinContractPeriod(), updateDTO.getMinContractPeriod());
            asset.setMinContractPeriod(updateDTO.getMinContractPeriod());
            hasUpdates = true;
        }
        if (updateDTO.getTags() != null) {
            log.debug("Updating tags from '{}' to '{}'", asset.getTags(), updateDTO.getTags());
            asset.setTags(updateDTO.getTags());
            hasUpdates = true;
        }
        
        if (!hasUpdates) {
            log.warn("No fields were updated for asset {} - all DTO fields were null", asset.getAssetId());
        } else {
            log.debug("Asset {} has pending updates", asset.getAssetId());
        }
    }

    @Override
    @Transactional
    public BulkAssetByPOResponse createAssetsByPO(String poNumber, List<AssetRequestDTO> requests) {
        log.info("=== SERVICE LAYER: Starting bulk asset creation for PO {} with {} assets ===", poNumber, requests.size());
        
        // Validate input
        if (requests == null || requests.isEmpty()) {
            throw new IllegalArgumentException("Asset request list cannot be null or empty");
        }
        
        if (poNumber == null || poNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("PO Number cannot be null or empty");
        }
        
        // Validate PO exists
        assetPORepository.findByPoNumber(poNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with PO Number: " + poNumber));
        
        // Set poNumber for all assets in the request
        requests.forEach(request -> {
            request.setPoNumber(poNumber);
            log.debug("Set PO Number {} for asset: {}", poNumber, request.getSerialNumber());
        });
        
        List<BulkAssetByPOResponse.BulkAssetError> errors = new ArrayList<>();
        List<AssetDTO> createdAssets = new ArrayList<>();
        
        // Process each asset request
        for (int i = 0; i < requests.size(); i++) {
            AssetRequestDTO request = requests.get(i);
            
            try {
                log.debug("Processing asset[{}] for PO {}: {}", i, poNumber, request.getSerialNumber());
                
                // Step 1: Validate the asset request
                AssetValidationService.AssetValidationResult validationResult = 
                    assetValidationService.validateAssetForCreation(request, i);
                
                if (!validationResult.isValid()) {
                    String errorMessage = String.join("; ", validationResult.getErrors());
                    log.warn("Validation failed for asset[{}] in PO {}: {}", i, poNumber, errorMessage);
                    errors.add(BulkAssetByPOResponse.BulkAssetError.builder()
                        .index(i)
                        .field("validation")
                        .message(errorMessage)
                        .assetIdentifier(request.getSerialNumber() != null ? request.getSerialNumber() : request.getName())
                        .build());
                    continue;
                }
                
                // Step 2: Create the asset using mapper with validation context
                Asset asset = assetMapper.toEntityWithContext(request, validationResult.getContext());
                Asset savedAsset = assetRepository.save(asset);
                
                log.debug("Successfully created asset[{}] with ID: {} for PO {}", i, savedAsset.getAssetId(), poNumber);
                
                // Log the creation
                auditLogService.logAssetAction(
                    savedAsset,
                    savedAsset.getCurrentUser(),
                    "BULK_CREATE_BY_PO",
                    String.format("Asset created via bulk operation for PO %s with name: %s", poNumber, savedAsset.getName())
                );
                
                createdAssets.add(assetMapper.toDTO(savedAsset));
                
            } catch (DataIntegrityViolationException e) {
                log.error("Data integrity violation for asset[{}] in PO {}: {}", i, poNumber, e.getMessage(), e);
                
                String errorMessage = parseDataIntegrityError(e, request);
                errors.add(BulkAssetByPOResponse.BulkAssetError.builder()
                    .index(i)
                    .field("dataIntegrity")
                    .message(errorMessage)
                    .assetIdentifier(request.getSerialNumber() != null ? request.getSerialNumber() : request.getName())
                    .build());
                    
            } catch (ResourceNotFoundException e) {
                log.error("Resource not found for asset[{}] in PO {}: {}", i, poNumber, e.getMessage(), e);
                errors.add(BulkAssetByPOResponse.BulkAssetError.builder()
                    .index(i)
                    .field("resourceNotFound")
                    .message("Referenced resource not found: " + e.getMessage())
                    .assetIdentifier(request.getSerialNumber() != null ? request.getSerialNumber() : request.getName())
                    .build());
                    
            } catch (IllegalArgumentException e) {
                log.error("Invalid argument for asset[{}] in PO {}: {}", i, poNumber, e.getMessage(), e);
                errors.add(BulkAssetByPOResponse.BulkAssetError.builder()
                    .index(i)
                    .field("invalidArgument")
                    .message("Invalid data provided: " + e.getMessage())
                    .assetIdentifier(request.getSerialNumber() != null ? request.getSerialNumber() : request.getName())
                    .build());
                    
            } catch (Exception e) {
                log.error("Unexpected error creating asset[{}] in PO {}: {}", i, poNumber, e.getMessage(), e);
                errors.add(BulkAssetByPOResponse.BulkAssetError.builder()
                    .index(i)
                    .field("unexpected")
                    .message("Unexpected error: " + e.getMessage())
                    .assetIdentifier(request.getSerialNumber() != null ? request.getSerialNumber() : request.getName())
                    .build());
            }
        }
        
        // Build response based on results
        BulkAssetByPOResponse response;
        if (errors.isEmpty()) {
            // All succeeded
            response = BulkAssetByPOResponse.success(poNumber, createdAssets);
        } else if (!createdAssets.isEmpty()) {
            // Partial success
            response = BulkAssetByPOResponse.partialSuccess(poNumber, createdAssets, errors, requests.size());
        } else {
            // All failed
            response = BulkAssetByPOResponse.failure(poNumber, errors, requests.size());
        }
        
        log.info("=== SERVICE LAYER: Bulk asset creation for PO {} completed - Success: {}, Failures: {} ===", 
            poNumber, response.getCreatedCount(), response.getFailedCount());
        
        return response;
    }
} 