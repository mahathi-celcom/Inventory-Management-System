package com.inventory.system.service;

import com.inventory.system.dto.AssetDashboardDTO;
import com.inventory.system.dto.AssetUserAssignmentDTO;
import com.inventory.system.dto.AssetTagAssignmentRequestDTO;
import com.inventory.system.dto.AssignmentResponseDTO;
import com.inventory.system.dto.PageResponse;
import org.springframework.data.domain.Pageable;

public interface AssetAssignmentManagementService {
    
    /**
     * Fetch paginated asset list with current user and tag information for dashboard
     * @param pageable Pagination information
     * @return Paginated list of assets with assignment details
     */
    PageResponse<AssetDashboardDTO> getAssetDashboard(Pageable pageable);
    
    /**
     * Assign a user to an asset
     * @param assignmentDTO Assignment details
     * @return Assignment response with success/error information
     */
    AssignmentResponseDTO assignUserToAsset(AssetUserAssignmentDTO assignmentDTO);
    
    /**
     * Unassign current user from an asset
     * @param assetId Asset ID to unassign user from
     * @return Assignment response with success/error information
     */
    AssignmentResponseDTO unassignUserFromAsset(Long assetId);
    
    /**
     * Assign a tag to an asset
     * @param assignmentDTO Tag assignment details
     * @return Assignment response with success/error information
     */
    AssignmentResponseDTO assignTagToAsset(AssetTagAssignmentRequestDTO assignmentDTO);
    
    /**
     * Unassign current tag from an asset
     * @param assetId Asset ID to unassign tag from
     * @return Assignment response with success/error information
     */
    AssignmentResponseDTO unassignTagFromAsset(Long assetId);
    
    /**
     * Get current user assignment for an asset
     * @param assetId Asset ID to get current user assignment for
     * @return Current user assignment details, or null if no user is assigned
     */
    AssetUserAssignmentDTO getCurrentUserAssignment(Long assetId);
    
    /**
     * Get asset dashboard with search/filter capabilities
     * @param searchTerm Search term for asset name, serial number, or asset code
     * @param pageable Pagination information
     * @return Filtered paginated list of assets
     */
    PageResponse<AssetDashboardDTO> searchAssetDashboard(String searchTerm, Pageable pageable);
} 