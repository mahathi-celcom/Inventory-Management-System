package com.inventory.system.repository;

import com.inventory.system.model.AssetTagAssignment;
import com.inventory.system.model.AssetTagAssignmentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetTagAssignmentRepository extends JpaRepository<AssetTagAssignment, AssetTagAssignmentId> {
    List<AssetTagAssignment> findByAsset_AssetId(Long assetId);
    List<AssetTagAssignment> findByTag_Id(Long tagId);
    void deleteByAsset_AssetId(Long assetId);
    void deleteByTag_Id(Long tagId);
    
    /**
     * Check if an asset-tag assignment already exists
     * @param assetId Asset ID
     * @param tagId Tag ID
     * @return true if assignment exists, false otherwise
     */
    @Query("SELECT COUNT(ata) > 0 FROM AssetTagAssignment ata WHERE ata.asset.assetId = :assetId AND ata.tag.id = :tagId")
    boolean existsByAssetIdAndTagId(@Param("assetId") Long assetId, @Param("tagId") Long tagId);
} 