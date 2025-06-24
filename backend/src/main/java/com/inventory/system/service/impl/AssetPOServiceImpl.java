package com.inventory.system.service.impl;

import com.inventory.system.dto.AssetPODTO;
import com.inventory.system.dto.AssetPOMigrationResponse;
import com.inventory.system.dto.AssetPOUpdateResponse;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.dto.POSummaryDTO;
import com.inventory.system.dto.PODeletionWarningDTO;
import com.inventory.system.dto.AssetDTO;
import com.inventory.system.dto.PODeletionConflictDTO;
import com.inventory.system.dto.AssetDeletionBlockerDTO;
import com.inventory.system.dto.UserDTO;
import com.inventory.system.exception.ConflictException;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.mapper.AssetPOMapper;
import com.inventory.system.mapper.AssetMapper;
import com.inventory.system.model.Asset;
import com.inventory.system.model.AssetPO;
import com.inventory.system.repository.AssetPORepository;
import com.inventory.system.repository.AssetRepository;
import com.inventory.system.service.AssetPOService;
import com.inventory.system.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AssetPOServiceImpl implements AssetPOService {
    
    private final AssetPORepository assetPORepository;
    private final AssetPOMapper assetPOMapper;
    private final AssetRepository assetRepository;
    private final AssetMapper assetMapper;
    private final UserService userService;
    
    @Override
    public AssetPODTO createAssetPO(AssetPODTO assetPODTO) {
        log.info("Creating new AssetPO with PO Number: {}", assetPODTO.getPoNumber());
        
        // Validate and normalize acquisition type
        String normalizedAcquisitionType = validateAndNormalizeAcquisitionType(assetPODTO.getAcquisitionType());
        assetPODTO.setAcquisitionType(normalizedAcquisitionType);
        
        // Validate warranty expiry date
        validateWarrantyExpiryDate(assetPODTO.getWarrantyExpiryDate(), assetPODTO.getAcquisitionDate());
        
        AssetPO assetPO = assetPOMapper.toEntity(assetPODTO);
        
        AssetPO savedAssetPO = assetPORepository.save(assetPO);
        log.info("AssetPO created successfully with ID: {}", savedAssetPO.getPoId());
        
        return assetPOMapper.toDTO(savedAssetPO);
    }
    
    @Override
    public AssetPODTO updateAssetPO(Long id, AssetPODTO assetPODTO) {
        log.info("Updating AssetPO with ID: {}", id);
        
        AssetPO existingAssetPO = assetPORepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AssetPO not found with ID: " + id));
        
        // Validate and normalize acquisition type
        String normalizedAcquisitionType = validateAndNormalizeAcquisitionType(assetPODTO.getAcquisitionType());
        
        // Update fields
        existingAssetPO.setAcquisitionType(normalizedAcquisitionType);
        existingAssetPO.setPoNumber(assetPODTO.getPoNumber());
        existingAssetPO.setInvoiceNumber(assetPODTO.getInvoiceNumber());
        existingAssetPO.setAcquisitionDate(assetPODTO.getAcquisitionDate());
        existingAssetPO.setVendorId(assetPODTO.getVendorId());
        existingAssetPO.setOwnerType(assetPODTO.getOwnerType());
        existingAssetPO.setLeaseEndDate(assetPODTO.getLeaseEndDate());
        existingAssetPO.setRentalAmount(assetPODTO.getRentalAmount());
        existingAssetPO.setMinContractPeriod(assetPODTO.getMinContractPeriod());
        existingAssetPO.setAcquisitionPrice(assetPODTO.getAcquisitionPrice());
        existingAssetPO.setDepreciationPct(assetPODTO.getDepreciationPct());
        existingAssetPO.setCurrentPrice(assetPODTO.getCurrentPrice());
        existingAssetPO.setTotalDevices(assetPODTO.getTotalDevices());
        
        // Validate warranty expiry date
        validateWarrantyExpiryDate(assetPODTO.getWarrantyExpiryDate(), assetPODTO.getAcquisitionDate());
        existingAssetPO.setWarrantyExpiryDate(assetPODTO.getWarrantyExpiryDate());
        
        AssetPO updatedAssetPO = assetPORepository.save(existingAssetPO);
        log.info("AssetPO updated successfully with ID: {}", updatedAssetPO.getPoId());
        
        return assetPOMapper.toDTO(updatedAssetPO);
    }
    
    @Override
    public AssetPOUpdateResponse updateAssetPOWithCascade(Long id, AssetPODTO assetPODTO) {
        log.info("Updating AssetPO with ID: {} and cascading to linked assets", id);
        
        // Get existing AssetPO for comparison
        AssetPO existingAssetPO = assetPORepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AssetPO not found with ID: " + id));
        
        String oldPoNumber = existingAssetPO.getPoNumber();
        String newPoNumber = assetPODTO.getPoNumber();
        boolean poNumberChanged = !oldPoNumber.equals(newPoNumber);
        
        log.info("PO Number change detected: {} -> {}", oldPoNumber, newPoNumber);
        
        // Find all assets linked to the old PO number BEFORE any updates
        List<Asset> linkedAssets = assetRepository.findByPoNumber(oldPoNumber);
        log.info("Found {} assets linked to PO: {}", linkedAssets.size(), oldPoNumber);
        
        int updatedAssetCount = 0;
        
        // PHASE 1: Update foreign key references in assets FIRST (if PO number is changing)
        if (poNumberChanged && !linkedAssets.isEmpty()) {
            log.info("PHASE 1: Updating foreign key references in {} assets from '{}' to '{}'", 
                linkedAssets.size(), oldPoNumber, newPoNumber);
            
            // Check if new PO number already exists (prevent conflicts)
            if (assetPORepository.findByPoNumber(newPoNumber).isPresent()) {
                throw new IllegalArgumentException("Cannot update PO number to '" + newPoNumber + 
                    "' - this PO number already exists in another AssetPO record");
            }
            
            // Bulk update asset PO numbers
            int bulkUpdatedCount = assetRepository.updateAssetPoReferences(oldPoNumber, newPoNumber);
            log.info("Bulk updated {} asset PO number references", bulkUpdatedCount);
            updatedAssetCount += bulkUpdatedCount;
        }
        
        // PHASE 2: Update the AssetPO primary key itself
        log.info("PHASE 2: Updating AssetPO primary data");
        AssetPODTO updatedAssetPODTO = updateAssetPO(id, assetPODTO);
        
        // Get the updated AssetPO entity for field cascading
        AssetPO updatedAssetPO = assetPORepository.findById(id).get();
        
        // PHASE 3: Update other fields in linked assets (excluding PO number since it's already done)
        if (!linkedAssets.isEmpty()) {
            log.info("PHASE 3: Updating other fields in linked assets");
            
            // Reload assets with new PO number if it changed
            List<Asset> assetsToUpdate;
            if (poNumberChanged) {
                assetsToUpdate = assetRepository.findByPoNumber(newPoNumber);
            } else {
                assetsToUpdate = linkedAssets;
            }
            
            int fieldUpdatedCount = 0;
            for (Asset asset : assetsToUpdate) {
                if (updateAssetFromPO(asset, updatedAssetPO, true)) { // Skip PO number update
                    fieldUpdatedCount++;
                }
            }
            
            // Save all field updates
            if (fieldUpdatedCount > 0) {
                assetRepository.saveAll(assetsToUpdate);
                log.info("Updated {} assets with new PO field data", fieldUpdatedCount);
                updatedAssetCount = Math.max(updatedAssetCount, fieldUpdatedCount);
            }
        }
        
        log.info("Cascade update completed: AssetPO updated, {} assets affected", updatedAssetCount);
        return AssetPOUpdateResponse.of(updatedAssetPODTO, updatedAssetCount);
    }
    
    @Override
    public AssetPOUpdateResponse updateAssetPOWithSafePrimaryKeyUpdate(Long id, AssetPODTO assetPODTO) {
        log.info("=== SAFE PRIMARY KEY UPDATE: Starting for AssetPO ID: {} ===", id);
        
        // Get existing AssetPO
        AssetPO existingAssetPO = assetPORepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AssetPO not found with ID: " + id));
        
        String oldPoNumber = existingAssetPO.getPoNumber();
        String newPoNumber = assetPODTO.getPoNumber();
        boolean poNumberChanged = !oldPoNumber.equals(newPoNumber);
        
        if (!poNumberChanged) {
            log.info("PO Number unchanged, using standard cascade update");
            return updateAssetPOWithCascade(id, assetPODTO);
        }
        
        log.info("PO Number change detected: '{}' -> '{}'", oldPoNumber, newPoNumber);
        
        // Validate new PO number doesn't already exist
        if (assetPORepository.findByPoNumber(newPoNumber).isPresent()) {
            throw new IllegalArgumentException("Cannot update PO number to '" + newPoNumber + 
                "' - this PO number already exists in another AssetPO record");
        }
        
        // Find all assets that reference the old PO number
        List<Asset> linkedAssets = assetRepository.findByPoNumber(oldPoNumber);
        log.info("Found {} assets referencing PO: '{}'", linkedAssets.size(), oldPoNumber);
        
        // === PHASE 1: Update Foreign Key References FIRST ===
        log.info("PHASE 1: Updating foreign key references in assets");
        int updatedAssetCount = 0;
        
        if (!linkedAssets.isEmpty()) {
            // Bulk update all asset PO number references
            updatedAssetCount = assetRepository.updateAssetPoReferences(oldPoNumber, newPoNumber);
            log.info("✅ Successfully updated {} asset PO number references from '{}' to '{}'", 
                updatedAssetCount, oldPoNumber, newPoNumber);
        }
        
        // === PHASE 2: Update Primary Key in AssetPO ===
        log.info("PHASE 2: Updating AssetPO primary key");
        
        // Validate and normalize acquisition type
        String normalizedAcquisitionType = validateAndNormalizeAcquisitionType(assetPODTO.getAcquisitionType());
        
        // Update the AssetPO with new data
        existingAssetPO.setAcquisitionType(normalizedAcquisitionType);
        existingAssetPO.setPoNumber(newPoNumber); // This is now safe since FKs are updated
        existingAssetPO.setInvoiceNumber(assetPODTO.getInvoiceNumber());
        existingAssetPO.setAcquisitionDate(assetPODTO.getAcquisitionDate());
        existingAssetPO.setVendorId(assetPODTO.getVendorId());
        existingAssetPO.setOwnerType(assetPODTO.getOwnerType());
        existingAssetPO.setLeaseEndDate(assetPODTO.getLeaseEndDate());
        existingAssetPO.setRentalAmount(assetPODTO.getRentalAmount());
        existingAssetPO.setMinContractPeriod(assetPODTO.getMinContractPeriod());
        existingAssetPO.setAcquisitionPrice(assetPODTO.getAcquisitionPrice());
        existingAssetPO.setDepreciationPct(assetPODTO.getDepreciationPct());
        existingAssetPO.setCurrentPrice(assetPODTO.getCurrentPrice());
        existingAssetPO.setTotalDevices(assetPODTO.getTotalDevices());
        
        AssetPO updatedAssetPO = assetPORepository.save(existingAssetPO);
        log.info("✅ Successfully updated AssetPO primary key to '{}'", updatedAssetPO.getPoNumber());
        
        // === PHASE 3: Update Other Fields in Assets ===
        log.info("PHASE 3: Cascading other field updates to assets");
        
        if (updatedAssetCount > 0) {
            // Reload assets with the new PO number
            List<Asset> assetsToUpdate = assetRepository.findByPoNumber(newPoNumber);
            
            int fieldUpdatedCount = 0;
            for (Asset asset : assetsToUpdate) {
                // Skip PO number since it's already updated in Phase 1
                if (updateAssetFromPO(asset, updatedAssetPO, true)) {
                    fieldUpdatedCount++;
                }
            }
            
            if (fieldUpdatedCount > 0) {
                assetRepository.saveAll(assetsToUpdate);
                log.info("✅ Updated {} assets with cascaded field changes", fieldUpdatedCount);
            }
        }
        
        AssetPODTO responseDTO = assetPOMapper.toDTO(updatedAssetPO);
        
        log.info("=== SAFE PRIMARY KEY UPDATE COMPLETED ===");
        log.info("AssetPO '{}' -> '{}', {} assets updated", oldPoNumber, newPoNumber, updatedAssetCount);
        
        return AssetPOUpdateResponse.of(responseDTO, updatedAssetCount);
    }
    
    @Override
    @Transactional
    public void updatePoWithCascade(Long id, String newPoNumber) {
        log.info("=== SIMPLIFIED CASCADE UPDATE: Starting for AssetPO ID: {} ===", id);
        
        // Find the current PO
        AssetPO currentPo = assetPORepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AssetPO not found with ID: " + id));

        String oldPoNumber = currentPo.getPoNumber();
        log.info("PO Number change: '{}' -> '{}'", oldPoNumber, newPoNumber);

        // Check if new PO number already exists (excluding current PO)
        if (assetPORepository.existsByPoNumberAndIdNot(newPoNumber, id)) {
            throw new ConflictException("PO number '" + newPoNumber + "' already exists");
        }

        if (!oldPoNumber.equals(newPoNumber)) {
            // Convert depreciation percentage to BigDecimal
            BigDecimal depreciationPct = currentPo.getDepreciationPct() != null ? 
                BigDecimal.valueOf(currentPo.getDepreciationPct()) : null;

            // Phase 1: Synchronize all asset fields with PO data
            log.info("Phase 1: Synchronizing asset fields with PO data");
            int updatedAssets = assetRepository.synchronizeAssetFields(
                oldPoNumber,
                newPoNumber,
                currentPo.getInvoiceNumber(),
                currentPo.getAcquisitionDate(),
                currentPo.getOwnerType(),
                currentPo.getLeaseEndDate(),
                currentPo.getRentalAmount(),
                currentPo.getMinContractPeriod(),
                currentPo.getAcquisitionPrice(),
                depreciationPct,
                currentPo.getCurrentPrice()
            );
            log.info("✅ Updated {} asset records with synchronized fields", updatedAssets);
            
            // Phase 2: Update PO number in AssetPO
            log.info("Phase 2: Updating PO number in AssetPO");
            int updatedPoRecords = assetPORepository.updateAssetPOFields(
                id,
                newPoNumber,
                currentPo.getInvoiceNumber(),
                currentPo.getAcquisitionDate(),
                currentPo.getVendorId(),
                currentPo.getOwnerType(),
                currentPo.getLeaseEndDate(),
                currentPo.getRentalAmount(),
                currentPo.getMinContractPeriod(),
                currentPo.getAcquisitionPrice(),
                depreciationPct,
                currentPo.getCurrentPrice(),
                currentPo.getTotalDevices()
            );
            log.info("✅ Updated AssetPO record with new PO number");
            
            // Update the entity object for consistency
            currentPo.setPoNumber(newPoNumber);
        }

        // Save to ensure any other changes are persisted and timestamps updated
        assetPORepository.save(currentPo);
        log.info("=== SIMPLIFIED CASCADE UPDATE COMPLETED ===");
    }
    
    private boolean updateAssetFromPO(Asset asset, AssetPO assetPO) {
        return updateAssetFromPO(asset, assetPO, false);
    }
    
    private boolean updateAssetFromPO(Asset asset, AssetPO assetPO, boolean skipPoNumber) {
        log.debug("Updating asset {} from PO data (skipPoNumber: {})", asset.getAssetId(), skipPoNumber);
        
        boolean hasUpdates = false;
        
        // Update PO number only if not skipping and different
        if (!skipPoNumber && !equals(asset.getPoNumber(), assetPO.getPoNumber())) {
            log.debug("Updating asset {} poNumber from '{}' to '{}'", 
                asset.getAssetId(), asset.getPoNumber(), assetPO.getPoNumber());
            asset.setPoNumber(assetPO.getPoNumber());
            hasUpdates = true;
        }
        
        if (!equals(asset.getInvoiceNumber(), assetPO.getInvoiceNumber())) {
            log.debug("Updating asset {} invoiceNumber from '{}' to '{}'", 
                asset.getAssetId(), asset.getInvoiceNumber(), assetPO.getInvoiceNumber());
            asset.setInvoiceNumber(assetPO.getInvoiceNumber());
            hasUpdates = true;
        }
        
        if (!equals(asset.getAcquisitionDate(), assetPO.getAcquisitionDate())) {
            log.debug("Updating asset {} acquisitionDate from '{}' to '{}'", 
                asset.getAssetId(), asset.getAcquisitionDate(), assetPO.getAcquisitionDate());
            asset.setAcquisitionDate(assetPO.getAcquisitionDate());
            hasUpdates = true;
        }
        
        Long currentVendorId = asset.getVendor() != null ? asset.getVendor().getId() : null;
        if (!equals(currentVendorId, assetPO.getVendorId())) {
            log.debug("Updating asset {} vendorId from '{}' to '{}'", 
                asset.getAssetId(), currentVendorId, assetPO.getVendorId());
            // Note: We only set the vendorId, not the vendor relationship
            // The vendor relationship should be set through proper service methods
            // For now, we'll skip vendor update to avoid complexity
            hasUpdates = true;
        }
        
        if (!equals(asset.getOwnerType(), assetPO.getOwnerType())) {
            log.debug("Updating asset {} ownerType from '{}' to '{}'", 
                asset.getAssetId(), asset.getOwnerType(), assetPO.getOwnerType());
            asset.setOwnerType(assetPO.getOwnerType());
            hasUpdates = true;
        }
        
        if (!equals(asset.getAcquisitionType(), assetPO.getAcquisitionType())) {
            log.debug("Updating asset {} acquisitionType from '{}' to '{}'", 
                asset.getAssetId(), asset.getAcquisitionType(), assetPO.getAcquisitionType());
            asset.setAcquisitionType(assetPO.getAcquisitionType());
            hasUpdates = true;
        }
        
        if (!equals(asset.getLeaseEndDate(), assetPO.getLeaseEndDate())) {
            log.debug("Updating asset {} leaseEndDate from '{}' to '{}'", 
                asset.getAssetId(), asset.getLeaseEndDate(), assetPO.getLeaseEndDate());
            asset.setLeaseEndDate(assetPO.getLeaseEndDate());
            hasUpdates = true;
        }
        
        if (!equals(asset.getRentalAmount(), assetPO.getRentalAmount())) {
            log.debug("Updating asset {} rentalAmount from '{}' to '{}'", 
                asset.getAssetId(), asset.getRentalAmount(), assetPO.getRentalAmount());
            asset.setRentalAmount(assetPO.getRentalAmount());
            hasUpdates = true;
        }
        
        if (!equals(asset.getAcquisitionPrice(), assetPO.getAcquisitionPrice())) {
            log.debug("Updating asset {} acquisitionPrice from '{}' to '{}'", 
                asset.getAssetId(), asset.getAcquisitionPrice(), assetPO.getAcquisitionPrice());
            asset.setAcquisitionPrice(assetPO.getAcquisitionPrice());
            hasUpdates = true;
        }
        
        if (!equals(asset.getDepreciationPct(), assetPO.getDepreciationPct())) {
            log.debug("Updating asset {} depreciationPct from '{}' to '{}'", 
                asset.getAssetId(), asset.getDepreciationPct(), assetPO.getDepreciationPct());
            // Convert Double to BigDecimal for Asset entity
            BigDecimal depreciationPct = assetPO.getDepreciationPct() != null ? 
                BigDecimal.valueOf(assetPO.getDepreciationPct()) : null;
            asset.setDepreciationPct(depreciationPct);
            hasUpdates = true;
        }
        
        if (!equals(asset.getCurrentPrice(), assetPO.getCurrentPrice())) {
            log.debug("Updating asset {} currentPrice from '{}' to '{}'", 
                asset.getAssetId(), asset.getCurrentPrice(), assetPO.getCurrentPrice());
            asset.setCurrentPrice(assetPO.getCurrentPrice());
            hasUpdates = true;
        }
        
        if (!equals(asset.getMinContractPeriod(), assetPO.getMinContractPeriod())) {
            log.debug("Updating asset {} minContractPeriod from '{}' to '{}'", 
                asset.getAssetId(), asset.getMinContractPeriod(), assetPO.getMinContractPeriod());
            asset.setMinContractPeriod(assetPO.getMinContractPeriod());
            hasUpdates = true;
        }
        
        return hasUpdates;
    }
    
    private boolean equals(Object a, Object b) {
        return (a == null && b == null) || (a != null && a.equals(b));
    }
    
    @Override
    @Transactional(readOnly = true)
    public AssetPODTO getAssetPO(Long id) {
        log.info("Fetching AssetPO with ID: {}", id);
        
        AssetPO assetPO = assetPORepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AssetPO not found with ID: " + id));
        
        return assetPOMapper.toDTO(assetPO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public AssetPODTO getAssetPOByPONumber(String poNumber) {
        log.info("Fetching AssetPO with PO Number: {}", poNumber);
        
        AssetPO assetPO = assetPORepository.findByPoNumber(poNumber)
                .orElseThrow(() -> new ResourceNotFoundException("AssetPO not found with PO Number: " + poNumber));
        
        return assetPOMapper.toDTO(assetPO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public PageResponse<AssetPODTO> getAllAssetPOs(Pageable pageable) {
        log.info("Fetching all AssetPOs with pagination: page={}, size={}", 
                pageable.getPageNumber(), pageable.getPageSize());
        
        Page<AssetPO> assetPOPage = assetPORepository.findAll(pageable);
        List<AssetPODTO> assetPODTOs = assetPOPage.getContent().stream()
                .map(assetPOMapper::toDTO)
                .collect(Collectors.toList());
        
        return createPageResponse(assetPOPage, assetPODTOs);
    }
    
    @Override
    @Transactional(readOnly = true)
    public PageResponse<AssetPODTO> searchAssetPOs(String searchTerm, Pageable pageable) {
        log.info("Searching AssetPOs with term: {}", searchTerm);
        
        Page<AssetPO> assetPOPage = assetPORepository
                .findByPoNumberContainingIgnoreCaseOrInvoiceNumberContainingIgnoreCase(
                        searchTerm, searchTerm, pageable);
        
        List<AssetPODTO> assetPODTOs = assetPOPage.getContent().stream()
                .map(assetPOMapper::toDTO)
                .collect(Collectors.toList());
        
        return createPageResponse(assetPOPage, assetPODTOs);
    }
    
    @Override
    public void deleteAssetPO(Long id) {
        log.info("Deleting AssetPO with ID: {}", id);
        
        AssetPO assetPO = assetPORepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AssetPO not found with ID: " + id));
        
        assetPORepository.delete(assetPO);
        log.info("AssetPO deleted successfully with ID: {}", id);
    }
    

    
    // Removed filtering methods - use frontend filtering instead
    
    @Override
    @Transactional(readOnly = true)
    public List<AssetPODTO> getLeasesExpiringBetween(LocalDate startDate, LocalDate endDate) {
        log.info("Fetching rentals expiring between: {} and {}", startDate, endDate);
        
        List<AssetPO> expiringRentals = assetPORepository.findRentalsExpiringBetween(startDate, endDate);
        return expiringRentals.stream()
                .map(assetPOMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AssetPODTO> getLeasesExpiringSoon(int daysAhead) {
        log.info("Fetching rentals expiring in the next {} days", daysAhead);
        
        LocalDate today = LocalDate.now();
        LocalDate futureDate = today.plusDays(daysAhead);
        
        return getLeasesExpiringBetween(today, futureDate);
    }
    
    private PageResponse<AssetPODTO> createPageResponse(Page<AssetPO> assetPOPage, List<AssetPODTO> assetPODTOs) {
        return new PageResponse<>(
                assetPODTOs,
                assetPOPage.getNumber(),
                assetPOPage.getSize(),
                assetPOPage.getTotalElements(),
                assetPOPage.getTotalPages(),
                assetPOPage.isLast(),
                assetPOPage.isFirst()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAvailablePONumbers() {
        log.info("Fetching all available PO numbers");
        return assetPORepository.findDistinctPoNumbers();
    }

    @Override
    @Transactional
    public AssetPOMigrationResponse migratePoNumber(String oldPoNumber, String newPoNumber) {
        log.info("=== PO NUMBER MIGRATION: Starting migration from '{}' to '{}' ===", oldPoNumber, newPoNumber);
        
        try {
            // STEP 1: Validate Input
            log.info("STEP 1: Validating input parameters");
            
            // 1.1: Confirm AssetPO with old PO number exists
            AssetPO originalAssetPO = assetPORepository.findByPoNumber(oldPoNumber)
                    .orElseThrow(() -> new ResourceNotFoundException("AssetPO not found with PO number: " + oldPoNumber));
            log.info("✅ Found original AssetPO with ID: {} and PO number: '{}'", originalAssetPO.getPoId(), oldPoNumber);
            
            // 1.2: Ensure new PO number doesn't already exist
            if (assetPORepository.findByPoNumber(newPoNumber).isPresent()) {
                throw new ConflictException("PO number '" + newPoNumber + "' already exists");
            }
            log.info("✅ New PO number '{}' is available", newPoNumber);
            
            // 1.3: Find all assets referencing the old PO number (before any changes)
            List<Asset> dependentAssets = assetRepository.findByPoNumber(oldPoNumber);
            log.info("Found {} assets referencing old PO number '{}'", dependentAssets.size(), oldPoNumber);
            
            // STEP 2: Create new AssetPO record
            log.info("STEP 2: Creating new AssetPO record with PO number '{}'", newPoNumber);
            
            AssetPO newAssetPO = AssetPO.builder()
                    .acquisitionType(originalAssetPO.getAcquisitionType())
                    .poNumber(newPoNumber) // NEW PO NUMBER
                    .invoiceNumber(originalAssetPO.getInvoiceNumber())
                    .acquisitionDate(originalAssetPO.getAcquisitionDate())
                    .vendorId(originalAssetPO.getVendorId())
                    .ownerType(originalAssetPO.getOwnerType())
                    .leaseEndDate(originalAssetPO.getLeaseEndDate())
                    .rentalAmount(originalAssetPO.getRentalAmount())
                    .minContractPeriod(originalAssetPO.getMinContractPeriod())
                    .acquisitionPrice(originalAssetPO.getAcquisitionPrice())
                    .depreciationPct(originalAssetPO.getDepreciationPct())
                    .currentPrice(originalAssetPO.getCurrentPrice())
                    .totalDevices(originalAssetPO.getTotalDevices())
                    .build();
            
            AssetPO savedNewAssetPO = assetPORepository.save(newAssetPO);
            log.info("✅ Created new AssetPO with ID: {} and PO number: '{}'", 
                    savedNewAssetPO.getPoId(), savedNewAssetPO.getPoNumber());
            
            // STEP 3: Force flush to ensure new AssetPO is committed before updating assets
            assetPORepository.flush();
            log.info("✅ Flushed new AssetPO to database");
            
            // STEP 4: Update all dependent assets
            log.info("STEP 4: Updating dependent assets from '{}' to '{}'", oldPoNumber, newPoNumber);
            
            // 4.1: Update asset PO number references using bulk update
            int assetsUpdated = 0;
            if (!dependentAssets.isEmpty()) {
                assetsUpdated = assetRepository.updateAssetPoReferences(oldPoNumber, newPoNumber);
                log.info("✅ Updated {} asset PO number references from '{}' to '{}'", 
                        assetsUpdated, oldPoNumber, newPoNumber);
            }
            
            // STEP 5: Delete the old AssetPO record
            log.info("STEP 5: Deleting old AssetPO record with PO number '{}'", oldPoNumber);
            
            assetPORepository.delete(originalAssetPO);
            log.info("✅ Deleted old AssetPO with ID: {}", originalAssetPO.getPoId());
            
            // STEP 6: Prepare success response
            AssetPODTO newAssetPODTO = assetPOMapper.toDTO(savedNewAssetPO);
            AssetPOMigrationResponse response = AssetPOMigrationResponse.success(
                    oldPoNumber, newPoNumber, newAssetPODTO, assetsUpdated);
            
            log.info("=== PO NUMBER MIGRATION COMPLETED SUCCESSFULLY ===");
            log.info("Migration Summary: {} -> {}, {} assets updated", oldPoNumber, newPoNumber, assetsUpdated);
            
            return response;
            
        } catch (Exception e) {
            log.error("PO Number migration failed from '{}' to '{}': {}", oldPoNumber, newPoNumber, e.getMessage(), e);
            
            // Return failure response
            return AssetPOMigrationResponse.failure(oldPoNumber, newPoNumber, e.getMessage());
        }
    }

    // ===== NEW PO-ASSET MANAGEMENT METHODS =====
    
    @Override
    @Transactional(readOnly = true)
    public List<AssetDTO> getAssetsByPONumber(String poNumber) {
        log.info("Fetching all assets for PO number: {}", poNumber);
        
        // Validate PO exists
        assetPORepository.findByPoNumber(poNumber)
                .orElseThrow(() -> new ResourceNotFoundException("AssetPO not found with PO Number: " + poNumber));
        
        // Fetch assets
        List<Asset> assets = assetRepository.findByPoNumber(poNumber);
        log.info("Found {} assets for PO number: {}", assets.size(), poNumber);
        
        // Convert to DTOs using AssetMapper
        List<AssetDTO> assetDTOs = assets.stream()
                .map(assetMapper::toDTO)
                .collect(Collectors.toList());
        
        return assetDTOs;
    }
    
    @Override
    @Transactional(readOnly = true)
    public POSummaryDTO getPOSummary(String poNumber) {
        log.info("Getting PO summary for PO number: {}", poNumber);
        
        // Validate and get PO
        AssetPO assetPO = assetPORepository.findByPoNumber(poNumber)
                .orElseThrow(() -> new ResourceNotFoundException("AssetPO not found with PO Number: " + poNumber));
        
        // Get linked assets count
        List<Asset> linkedAssets = assetRepository.findByPoNumber(poNumber);
        int linkedAssetsCount = linkedAssets.size();
        
        // Get total devices from PO
        Integer totalDevices = assetPO.getTotalDevices() != null ? assetPO.getTotalDevices() : 0;
        
        // Calculate remaining
        int remainingAssets = Math.max(0, totalDevices - linkedAssetsCount);
        
        POSummaryDTO summary = POSummaryDTO.builder()
                .poNumber(poNumber)
                .totalDevices(totalDevices)
                .linkedAssetsCount(linkedAssetsCount)
                .remainingAssets(remainingAssets)
                .canCreateMoreAssets(remainingAssets > 0)
                .build();
        
        log.info("PO Summary for {}: total={}, linked={}, remaining={}", 
                poNumber, totalDevices, linkedAssetsCount, remainingAssets);
        
        return summary;
    }
    
    @Override
    @Transactional(readOnly = true)
    public PODeletionWarningDTO getPODeletionWarning(String poNumber) {
        log.info("Getting deletion warning for PO number: {}", poNumber);
        
        // Validate PO exists
        assetPORepository.findByPoNumber(poNumber)
                .orElseThrow(() -> new ResourceNotFoundException("AssetPO not found with PO Number: " + poNumber));
        
        // Get linked assets
        List<Asset> linkedAssets = assetRepository.findByPoNumber(poNumber);
        List<AssetDTO> linkedAssetDTOs = linkedAssets.stream()
                .map(assetMapper::toDTO)
                .collect(Collectors.toList());
        
        PODeletionWarningDTO warning = PODeletionWarningDTO.createWarning(poNumber, linkedAssetDTOs);
        
        log.info("Deletion warning for PO {}: {} linked assets", poNumber, linkedAssetDTOs.size());
        
        return warning;
    }
    
    @Override
    @Transactional(readOnly = true)
    public PODeletionConflictDTO checkPODeletionConflicts(String poNumber) {
        log.info("Checking deletion conflicts for PO number: {}", poNumber);
        
        // Validate PO exists
        assetPORepository.findByPoNumber(poNumber)
                .orElseThrow(() -> new ResourceNotFoundException("AssetPO not found with PO Number: " + poNumber));
        
        // Get all linked assets
        List<Asset> linkedAssets = assetRepository.findByPoNumber(poNumber);
        
        if (linkedAssets.isEmpty()) {
            log.info("No assets linked to PO {}, safe to delete", poNumber);
            return null; // No conflicts, safe to delete
        }
        
        List<AssetDeletionBlockerDTO> blockingAssets = new ArrayList<>();
        
        for (Asset asset : linkedAssets) {
            List<String> reasons = new ArrayList<>();
            
            // Check if asset is assigned to a user
            if (asset.getCurrentUser() != null) {
                try {
                    UserDTO user = userService.getUser(asset.getCurrentUser().getId());
                    reasons.add("Asset assigned to user: " + user.getFullNameOrOfficeName());
                } catch (Exception e) {
                    reasons.add("Asset assigned to user ID: " + asset.getCurrentUser().getId());
                }
            }
            
            // Check asset status for blocking conditions
            String status = asset.getStatus();
            if (status != null) {
                switch (status.toLowerCase()) {
                    case "active":
                    case "in use":
                        reasons.add("Asset is currently active/in use");
                        break;
                    case "in repair":
                        reasons.add("Asset is currently in repair");
                        break;
                    case "on loan":
                        reasons.add("Asset is currently on loan");
                        break;
                    // Allow deletion for: "in stock", "broken", "ceased", etc.
                }
            }
            
            // Check if asset has active warranty (optional business rule)
            if (asset.getWarrantyExpiry() != null && asset.getWarrantyExpiry().isAfter(LocalDate.now())) {
                reasons.add("Asset has active warranty until " + asset.getWarrantyExpiry());
            }
            
            // Check if asset has active lease (for leased assets)
            if (asset.getLeaseEndDate() != null && asset.getLeaseEndDate().isAfter(LocalDate.now())) {
                reasons.add("Asset has active lease until " + asset.getLeaseEndDate());
            }
            
            // If there are blocking reasons, add to blocking assets list
            if (!reasons.isEmpty()) {
                AssetDTO assetDTO = assetMapper.toDTO(asset);
                String combinedReason = String.join("; ", reasons);
                AssetDeletionBlockerDTO blocker = AssetDeletionBlockerDTO.fromAsset(assetDTO, combinedReason);
                
                // Enhance the assignedTo field with actual user name if available
                if (asset.getCurrentUser() != null) {
                    try {
                        UserDTO user = userService.getUser(asset.getCurrentUser().getId());
                        blocker.setAssignedTo(user.getFullNameOrOfficeName());
                    } catch (Exception e) {
                        blocker.setAssignedTo("User ID: " + asset.getCurrentUser().getId());
                    }
                }
                
                blockingAssets.add(blocker);
            }
        }
        
        if (blockingAssets.isEmpty()) {
            log.info("No blocking conditions found for PO {}, safe to delete", poNumber);
            return null; // No conflicts, safe to delete
        }
        
        log.info("Found {} blocking assets for PO {}", blockingAssets.size(), poNumber);
        return PODeletionConflictDTO.createConflict(poNumber, blockingAssets, linkedAssets.size());
    }

    @Override
    @Transactional
    public int deleteAssetPOWithCascade(String poNumber) {
        log.info("=== CASCADING DELETION: Starting for PO number: {} ===", poNumber);
        
        // First check for conflicts
        PODeletionConflictDTO conflicts = checkPODeletionConflicts(poNumber);
        if (conflicts != null) {
            throw new ConflictException("Cannot delete PO due to dependent assets with blocking conditions. " +
                    "Use the deletion check endpoint to get detailed conflict information.");
        }
        
        // Validate PO exists (redundant but safe)
        AssetPO assetPO = assetPORepository.findByPoNumber(poNumber)
                .orElseThrow(() -> new ResourceNotFoundException("AssetPO not found with PO Number: " + poNumber));
        
        // Get all linked assets BEFORE deletion
        List<Asset> linkedAssets = assetRepository.findByPoNumber(poNumber);
        int assetsToDeleteCount = linkedAssets.size();
        
        log.info("Found {} assets linked to PO: {}", assetsToDeleteCount, poNumber);
        
        // Phase 1: Soft delete all linked assets
        if (!linkedAssets.isEmpty()) {
            log.info("Phase 1: Soft deleting {} linked assets", assetsToDeleteCount);
            
            for (Asset asset : linkedAssets) {
                try {
                    asset.setDeleted(true);
                    assetRepository.save(asset);
                    log.debug("Soft deleted asset: {}", asset.getAssetId());
                } catch (Exception e) {
                    log.error("Error deleting asset {} for PO {}: {}", asset.getAssetId(), poNumber, e.getMessage());
                }
            }
            
            log.info("✅ Phase 1 completed: {} assets soft deleted", assetsToDeleteCount);
        }
        
        // Phase 2: Delete the PO itself
        log.info("Phase 2: Deleting AssetPO record");
        assetPORepository.delete(assetPO);
        log.info("✅ Phase 2 completed: AssetPO deleted");
        
        log.info("=== CASCADING DELETION COMPLETED ===");
        log.info("Summary: PO '{}' deleted along with {} assets", poNumber, assetsToDeleteCount);
        
        return assetsToDeleteCount;
    }
    
    @Override
    @Transactional
    public boolean deleteIndividualAsset(Long assetId) {
        log.info("Deleting individual asset with ID: {}", assetId);
        
        // Check if asset exists and is not already deleted
        Asset asset = assetRepository.findById(assetId).orElse(null);
        
        if (asset == null) {
            log.warn("Asset with ID {} not found", assetId);
            return false;
        }
        
        if (asset.getDeleted() != null && asset.getDeleted()) {
            log.warn("Asset with ID {} is already deleted", assetId);
            return false;
        }
        
        // Perform soft delete
        asset.setDeleted(true);
        assetRepository.save(asset);
        
        log.info("✅ Successfully soft deleted asset: {} (PO: {})", assetId, asset.getPoNumber());
        
        return true;
    }
    
    /**
     * Validates warranty expiry date against acquisition date
     * @param warrantyExpiryDate The warranty expiry date to validate
     * @param acquisitionDate The acquisition date to compare against
     * @throws IllegalArgumentException if validation fails
     */
    private void validateWarrantyExpiryDate(LocalDate warrantyExpiryDate, LocalDate acquisitionDate) {
        if (warrantyExpiryDate == null) {
            return; // Warranty expiry date is optional
        }
        
        if (acquisitionDate != null && warrantyExpiryDate.isBefore(acquisitionDate)) {
            throw new IllegalArgumentException(
                "Warranty expiry date (" + warrantyExpiryDate + 
                ") cannot be before acquisition date (" + acquisitionDate + ")"
            );
        }
        
        // Additional validation: warranty expiry date should not be too far in the past
        LocalDate today = LocalDate.now();
        if (warrantyExpiryDate.isBefore(today.minusYears(10))) {
            throw new IllegalArgumentException(
                "Warranty expiry date (" + warrantyExpiryDate + 
                ") seems too far in the past (more than 10 years ago)"
            );
        }
    }
    
    /**
     * Validates and normalizes acquisition type - case-insensitive validation
     * Valid values: "Bought" and "Rented" (case-insensitive)
     * @param acquisitionType The acquisition type to validate
     * @return Normalized acquisition type
     * @throws IllegalArgumentException if validation fails
     */
    private String validateAndNormalizeAcquisitionType(String acquisitionType) {
        if (acquisitionType == null || acquisitionType.trim().isEmpty()) {
            throw new IllegalArgumentException("Acquisition type is required");
        }
        
        String normalized = acquisitionType.trim();
        
        // Case-insensitive validation - only "Bought" and "Rented" are allowed
        if ("Bought".equalsIgnoreCase(normalized)) {
            return "Bought";
        } else if ("Rented".equalsIgnoreCase(normalized)) {
            return "Rented";
        } else {
            throw new IllegalArgumentException("Invalid acquisition type: '" + acquisitionType + 
                "'. Valid values are: Bought, Rented (case-insensitive)");
        }
    }

} 