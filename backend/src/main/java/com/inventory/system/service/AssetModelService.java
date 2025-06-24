package com.inventory.system.service;

import com.inventory.system.dto.AssetModelDTO;
import com.inventory.system.dto.AssetModelDetailsDTO;
import com.inventory.system.dto.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AssetModelService {
    AssetModelDTO createAssetModel(AssetModelDTO assetModelDTO);
    AssetModelDTO updateAssetModel(Long id, AssetModelDTO assetModelDTO);
    AssetModelDTO getAssetModel(Long id);
    AssetModelDetailsDTO getAssetModelDetails(Long id);
    PageResponse<AssetModelDTO> getAllAssetModels(Pageable pageable);
    PageResponse<AssetModelDTO> getAssetModelsByMake(Long makeId, Pageable pageable);
    List<AssetModelDTO> getAllAssetModelsByMake(Long makeId);
    PageResponse<AssetModelDTO> searchAssetModels(String modelName, Pageable pageable);
    PageResponse<AssetModelDTO> searchAssetModels(String modelName, String status, Pageable pageable);
    void deleteAssetModel(Long id);
    
    // Status filtering methods
    PageResponse<AssetModelDTO> getAssetModelsByStatus(String status, Pageable pageable);
    PageResponse<AssetModelDTO> getAssetModelsByMakeAndStatus(Long makeId, String status, Pageable pageable);
} 