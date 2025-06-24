package com.inventory.system.repository;

import com.inventory.system.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByAsset_AssetId(Long assetId);
    Page<AuditLog> findByAsset_AssetId(Long assetId, Pageable pageable);
    Page<AuditLog> findByUser_Id(Long userId, Pageable pageable);
    Page<AuditLog> findByAction(String action, Pageable pageable);
    Page<AuditLog> findByActionDateBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    List<AuditLog> findByAsset_AssetIdOrderByActionDateDesc(Long assetId);
    Page<AuditLog> findByAsset_AssetIdAndAction(Long assetId, String action, Pageable pageable);
} 