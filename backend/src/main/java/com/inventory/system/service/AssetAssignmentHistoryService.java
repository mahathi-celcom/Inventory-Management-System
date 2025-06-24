package com.inventory.system.service;

import com.inventory.system.dto.AssetAssignmentHistoryDTO;
import com.inventory.system.dto.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AssetAssignmentHistoryService {
    AssetAssignmentHistoryDTO createAssignmentHistory(AssetAssignmentHistoryDTO assignmentHistoryDTO);
    AssetAssignmentHistoryDTO updateAssignmentHistory(Long id, AssetAssignmentHistoryDTO assignmentHistoryDTO);
    AssetAssignmentHistoryDTO getAssignmentHistory(Long id);
    List<AssetAssignmentHistoryDTO> getAssignmentHistoriesByAssetId(Long assetId);
    List<AssetAssignmentHistoryDTO> getAssignmentHistoriesByUserId(Long userId);
    PageResponse<AssetAssignmentHistoryDTO> getAllAssignmentHistories(Pageable pageable);
    PageResponse<AssetAssignmentHistoryDTO> getAssignmentHistoriesByAsset(Long assetId, Pageable pageable);
    PageResponse<AssetAssignmentHistoryDTO> getAssignmentHistoriesByUser(Long userId, Pageable pageable);
    PageResponse<AssetAssignmentHistoryDTO> getCurrentAssignments(Pageable pageable);
    void deleteAssignmentHistory(Long id);
} 