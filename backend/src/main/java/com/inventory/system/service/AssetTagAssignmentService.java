package com.inventory.system.service;

import com.inventory.system.dto.AssetTagAssignmentDTO;
import com.inventory.system.dto.AssetTagAssignmentByNameDTO;
import com.inventory.system.dto.PageResponse;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface AssetTagAssignmentService {
    AssetTagAssignmentDTO assignTag(AssetTagAssignmentDTO assignmentDTO);
    AssetTagAssignmentDTO assignTagByName(AssetTagAssignmentByNameDTO assignmentDTO);
    void unassignTag(Long assetId, Long tagId);
    AssetTagAssignmentDTO getAssignment(Long id);
    List<AssetTagAssignmentDTO> getAssignmentsByAssetId(Long assetId);
    List<AssetTagAssignmentDTO> getAssignmentsByTagId(Long tagId);
    PageResponse<AssetTagAssignmentDTO> getAllAssignments(Pageable pageable);
    PageResponse<AssetTagAssignmentDTO> getAssignmentsByAssetId(Long assetId, Pageable pageable);
    PageResponse<AssetTagAssignmentDTO> getAssignmentsByTagId(Long tagId, Pageable pageable);
    void deleteAssignment(Long id);
    void deleteAssignmentsByAssetId(Long assetId);
    void deleteAssignmentsByTagId(Long tagId);
} 