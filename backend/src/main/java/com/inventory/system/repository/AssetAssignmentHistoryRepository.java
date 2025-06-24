package com.inventory.system.repository;

import com.inventory.system.model.AssetAssignmentHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AssetAssignmentHistoryRepository extends JpaRepository<AssetAssignmentHistory, Long> {
    List<AssetAssignmentHistory> findByAsset_AssetId(Long assetId);
    Page<AssetAssignmentHistory> findByAsset_AssetId(Long assetId, Pageable pageable);
    List<AssetAssignmentHistory> findByUser_Id(Long userId);
    Page<AssetAssignmentHistory> findByUser_Id(Long userId, Pageable pageable);
    Page<AssetAssignmentHistory> findByAssignedDateBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    Page<AssetAssignmentHistory> findByUnassignedDateBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    Page<AssetAssignmentHistory> findByUnassignedDateIsNull(Pageable pageable);
    List<AssetAssignmentHistory> findByAsset_AssetIdOrderByAssignedDateDesc(Long assetId);
    List<AssetAssignmentHistory> findByAsset_AssetIdAndUnassignedDateIsNull(Long assetId);
} 