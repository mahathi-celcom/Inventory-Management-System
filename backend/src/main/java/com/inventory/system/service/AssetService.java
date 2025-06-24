package com.inventory.system.service;

import com.inventory.system.dto.AssetDTO;
import com.inventory.system.dto.AssetRequestDTO;
import com.inventory.system.dto.AssetUpdateDTO;
import com.inventory.system.dto.AssetStatusHistoryDTO;
import com.inventory.system.dto.BulkAssetResponse;
import com.inventory.system.dto.BulkUpdateResponse;
import com.inventory.system.dto.AssetBulkUpdateDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.dto.BulkAssetByPOResponse;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;

public interface AssetService {
    AssetDTO createAsset(AssetDTO assetDTO);
    AssetDTO updateAsset(Long assetId, AssetDTO assetDTO);
    AssetDTO updateAssetStatus(Long assetId, AssetStatusHistoryDTO statusHistoryDTO);
    AssetDTO getAsset(Long assetId);
    PageResponse<AssetDTO> getAllAssets(Pageable pageable);
    PageResponse<AssetDTO> searchAssets(String search, Pageable pageable);
    void deleteAsset(Long assetId);
    
    // Removed filtering methods - use frontend filtering instead
    
    PageResponse<AssetDTO> getDeletedAssets(Pageable pageable);
    PageResponse<AssetDTO> getAllAssetsIncludingDeleted(Pageable pageable);
    void restoreAsset(Long assetId);
    void permanentlyDeleteAsset(Long assetId);
    
    // Bulk operations
    BulkAssetResponse createAssetsInBulk(List<AssetRequestDTO> requests);
    BulkAssetByPOResponse createAssetsByPO(String poNumber, List<AssetRequestDTO> requests);
    void updateAssetsByPO(String poNumber, AssetUpdateDTO updates);
    void deleteAssetsByPO(String poNumber);
    List<AssetDTO> getAssetsByPONumber(String poNumber);
    
    // Individual asset bulk updates
    BulkUpdateResponse updateAssetsInBulk(AssetBulkUpdateDTO bulkUpdate);
} 