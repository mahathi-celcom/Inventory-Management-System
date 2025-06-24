package com.inventory.system.repository;

import com.inventory.system.model.AssetModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetModelRepository extends JpaRepository<AssetModel, Long> {
    Page<AssetModel> findByMakeId(Long makeId, Pageable pageable);
    List<AssetModel> findByMakeId(Long makeId);
    Page<AssetModel> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    // Status-related methods
    List<AssetModel> findByStatus(String status);
    Page<AssetModel> findByStatus(String status, Pageable pageable);
    Page<AssetModel> findByStatusAndNameContainingIgnoreCase(String status, String name, Pageable pageable);
    List<AssetModel> findByStatusAndMakeId(String status, Long makeId);
    Page<AssetModel> findByStatusAndMakeId(String status, Long makeId, Pageable pageable);
    List<AssetModel> findByStatusOrderByNameAsc(String status);
} 