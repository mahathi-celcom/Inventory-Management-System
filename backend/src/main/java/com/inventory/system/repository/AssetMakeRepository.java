package com.inventory.system.repository;

import com.inventory.system.model.AssetMake;
import com.inventory.system.model.AssetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetMakeRepository extends BaseRepository<AssetMake, Long> {
    
    // Search makes by name containing text
    Page<AssetMake> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    // Find makes by asset type
    Page<AssetMake> findByAssetType(AssetType assetType, Pageable pageable);
    
    // Find makes by asset type id
    Page<AssetMake> findByAssetTypeId(Long typeId, Pageable pageable);
    List<AssetMake> findByAssetTypeId(Long typeId);
    
    // Search makes by name and asset type
    Page<AssetMake> findByNameContainingIgnoreCaseAndAssetType(String name, AssetType assetType, Pageable pageable);
    
    // Search makes by name and asset type id
    Page<AssetMake> findByNameContainingIgnoreCaseAndAssetTypeId(String name, Long typeId, Pageable pageable);
    
    // Status-related methods
    List<AssetMake> findByStatus(String status);
    Page<AssetMake> findByStatus(String status, Pageable pageable);
    Page<AssetMake> findByStatusAndNameContainingIgnoreCase(String status, String name, Pageable pageable);
    List<AssetMake> findByStatusAndAssetTypeId(String status, Long typeId);
    Page<AssetMake> findByStatusAndAssetTypeId(String status, Long typeId, Pageable pageable);
    List<AssetMake> findByStatusOrderByNameAsc(String status);
} 