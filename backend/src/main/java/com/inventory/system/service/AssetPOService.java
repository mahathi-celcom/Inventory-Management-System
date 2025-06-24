package com.inventory.system.service;

import com.inventory.system.dto.AssetPODTO;
import com.inventory.system.dto.AssetPOMigrationResponse;
import com.inventory.system.dto.AssetPOUpdateResponse;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.dto.POSummaryDTO;
import com.inventory.system.dto.PODeletionWarningDTO;
import com.inventory.system.dto.PODeletionConflictDTO;
import com.inventory.system.dto.AssetDTO;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public interface AssetPOService {
    AssetPODTO createAssetPO(AssetPODTO assetPODTO);
    AssetPODTO updateAssetPO(Long id, AssetPODTO assetPODTO);
    AssetPOUpdateResponse updateAssetPOWithCascade(Long id, AssetPODTO assetPODTO);
    AssetPOUpdateResponse updateAssetPOWithSafePrimaryKeyUpdate(Long id, AssetPODTO assetPODTO);
    void updatePoWithCascade(Long id, String newPoNumber);
    AssetPODTO getAssetPO(Long id);
    AssetPODTO getAssetPOByPONumber(String poNumber);
    PageResponse<AssetPODTO> getAllAssetPOs(Pageable pageable);
    PageResponse<AssetPODTO> searchAssetPOs(String searchTerm, Pageable pageable);
    void deleteAssetPO(Long id);
    
    // Removed filtering methods - use frontend filtering instead
    
    // Lease management
    List<AssetPODTO> getLeasesExpiringBetween(LocalDate startDate, LocalDate endDate);
    List<AssetPODTO> getLeasesExpiringSoon(int daysAhead);
    
    // PO Number utility
    List<String> getAvailablePONumbers();

    /**
     * Safely updates a PO number by creating a new AssetPO record, updating all references,
     * and removing the old record. This ensures referential integrity throughout the process.
     *
     * @param oldPoNumber The current PO number to be replaced
     * @param newPoNumber The new PO number to migrate to
     * @return Migration response with summary of changes
     * @throws ResourceNotFoundException if the old PO number is not found
     * @throws ConflictException if the new PO number already exists
     */
    @Transactional
    AssetPOMigrationResponse migratePoNumber(String oldPoNumber, String newPoNumber);

    // New PO-Asset management methods
    
    /**
     * Get all assets linked to a given PO by PO Number
     * @param poNumber The PO number to fetch assets for
     * @return List of assets linked to the PO
     */
    List<AssetDTO> getAssetsByPONumber(String poNumber);
    
    /**
     * Get summary information for a PO including total devices, linked assets, and remaining count
     * @param poNumber The PO number to get summary for
     * @return Summary information about the PO
     */
    POSummaryDTO getPOSummary(String poNumber);
    
    /**
     * Get deletion warning information for a PO, including linked assets
     * @param poNumber The PO number to check for deletion
     * @return Warning information about what will be deleted
     */
    PODeletionWarningDTO getPODeletionWarning(String poNumber);
    
    /**
     * Check if a PO can be safely deleted by analyzing dependent assets
     * @param poNumber The PO number to check for deletion conflicts
     * @return Conflict information if deletion is blocked, null if safe to delete
     */
    PODeletionConflictDTO checkPODeletionConflicts(String poNumber);
    
    /**
     * Delete a PO with cascading deletion of all linked assets in a single transaction
     * @param poNumber The PO number to delete
     * @return Number of assets that were deleted along with the PO
     */
    @Transactional
    int deleteAssetPOWithCascade(String poNumber);
    
    /**
     * Delete an individual asset by asset ID (used when removing assets from a PO)
     * @param assetId The asset ID to delete
     * @return true if asset was deleted, false if asset was not found
     */
    @Transactional
    boolean deleteIndividualAsset(Long assetId);
} 