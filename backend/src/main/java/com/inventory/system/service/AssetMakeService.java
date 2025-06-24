package com.inventory.system.service;

import com.inventory.system.dto.AssetMakeDTO;
import com.inventory.system.dto.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AssetMakeService {
    AssetMakeDTO createAssetMake(AssetMakeDTO assetMakeDTO);
    AssetMakeDTO updateAssetMake(Long id, AssetMakeDTO assetMakeDTO);
    AssetMakeDTO getAssetMake(Long id);
    PageResponse<AssetMakeDTO> getAllAssetMakes(Pageable pageable);
    PageResponse<AssetMakeDTO> searchAssetMakes(String name, Pageable pageable);
    PageResponse<AssetMakeDTO> searchAssetMakes(String name, String status, Pageable pageable);
    void deleteAssetMake(Long id);
    
    // New methods for asset type filtering
    PageResponse<AssetMakeDTO> getAssetMakesByType(Long typeId, Pageable pageable);
    PageResponse<AssetMakeDTO> searchAssetMakesByType(String name, Long typeId, Pageable pageable);
    List<AssetMakeDTO> getAllAssetMakesByType(Long typeId);
    
    // Status filtering methods
    PageResponse<AssetMakeDTO> getAssetMakesByStatus(String status, Pageable pageable);
} 