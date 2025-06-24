package com.inventory.system.repository;

import com.inventory.system.model.AssetStatusHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AssetStatusHistoryRepository extends JpaRepository<AssetStatusHistory, Long> {
    List<AssetStatusHistory> findByAsset_AssetId(Long assetId);
    Page<AssetStatusHistory> findByAsset_AssetId(Long assetId, Pageable pageable);
    Page<AssetStatusHistory> findByChangedBy_Id(Long userId, Pageable pageable);
    Page<AssetStatusHistory> findByStatus(String status, Pageable pageable);
    Page<AssetStatusHistory> findByChangeDateBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    List<AssetStatusHistory> findByAsset_AssetIdOrderByChangeDateDesc(Long assetId);
    AssetStatusHistory findTopByAsset_AssetIdOrderByChangeDateDesc(Long assetId);
} 