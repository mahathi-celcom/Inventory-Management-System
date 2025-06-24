package com.inventory.system.repository;

import com.inventory.system.model.AssetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetTypeRepository extends BaseRepository<AssetType, Long> {
    boolean existsByNameIgnoreCase(String name);
    
    // Status-related methods
    List<AssetType> findByStatus(String status);
    Page<AssetType> findByStatus(String status, Pageable pageable);
    List<AssetType> findByStatusOrderByNameAsc(String status);

    // Category-related methods
    List<AssetType> findByAssetCategoryIgnoreCase(String assetCategory);
    Page<AssetType> findByAssetCategoryIgnoreCase(String assetCategory, Pageable pageable);
    
    // Combined filters
    List<AssetType> findByAssetCategoryIgnoreCaseAndStatus(String assetCategory, String status);
    Page<AssetType> findByAssetCategoryIgnoreCaseAndStatus(String assetCategory, String status, Pageable pageable);
    List<AssetType> findByAssetCategoryIgnoreCaseAndStatusOrderByNameAsc(String assetCategory, String status);

    // Custom query for case-insensitive category search with LIKE
    @Query("SELECT at FROM AssetType at WHERE " +
           "LOWER(at.assetCategory) LIKE LOWER(CONCAT('%', :category, '%'))")
    Page<AssetType> findByAssetCategoryContainingIgnoreCase(@Param("category") String category, Pageable pageable);
    
    // Count by category
    long countByAssetCategoryIgnoreCase(String assetCategory);
    long countByAssetCategoryIgnoreCaseAndStatus(String assetCategory, String status);
} 