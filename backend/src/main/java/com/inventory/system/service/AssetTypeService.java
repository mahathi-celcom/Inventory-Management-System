package com.inventory.system.service;

import com.inventory.system.dto.AssetTypeDTO;
import com.inventory.system.dto.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AssetTypeService {
    AssetTypeDTO createAssetType(AssetTypeDTO assetTypeDTO);
    AssetTypeDTO updateAssetType(Long id, AssetTypeDTO assetTypeDTO);
    AssetTypeDTO getAssetType(Long id);
    PageResponse<AssetTypeDTO> getAllAssetTypes(Pageable pageable);
    List<AssetTypeDTO> getAllAssetTypesSimple();
    void deleteAssetType(Long id);
    
    // Status-related methods
    PageResponse<AssetTypeDTO> getAssetTypesByStatus(String status, Pageable pageable);
    List<AssetTypeDTO> getActiveAssetTypes();
    void deactivateAssetType(Long id);
    void activateAssetType(Long id);

    // Category-related methods
    PageResponse<AssetTypeDTO> getAssetTypesByCategory(String assetCategory, Pageable pageable);
    List<AssetTypeDTO> getAssetTypesByCategory(String assetCategory);
    List<AssetTypeDTO> getActiveAssetTypesByCategory(String assetCategory);
    
    // Combined filters
    PageResponse<AssetTypeDTO> getAssetTypesByCategoryAndStatus(String assetCategory, String status, Pageable pageable);
    List<AssetTypeDTO> getAssetTypesByCategoryAndStatus(String assetCategory, String status);
} 