package com.inventory.system.service.impl;

import com.inventory.system.dto.*;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.model.*;
import com.inventory.system.repository.*;
import com.inventory.system.service.AssetAssignmentManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AssetAssignmentManagementServiceImpl implements AssetAssignmentManagementService {
    
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final AssetTagRepository assetTagRepository;
    private final AssetAssignmentHistoryRepository assignmentHistoryRepository;
    private final AssetTagAssignmentRepository tagAssignmentRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AssetDashboardDTO> getAssetDashboard(Pageable pageable) {
        log.info("Fetching asset dashboard with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        
        Page<Asset> assetPage = assetRepository.findByDeletedFalse(pageable);
        List<AssetDashboardDTO> dashboardDTOs = assetPage.getContent().stream()
                .map(this::convertToAssetDashboardDTO)
                .collect(Collectors.toList());
        
        return new PageResponse<>(
                dashboardDTOs,
                assetPage.getNumber(),
                assetPage.getSize(),
                assetPage.getTotalElements(),
                assetPage.getTotalPages(),
                assetPage.isLast(),
                assetPage.isFirst()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AssetDashboardDTO> searchAssetDashboard(String searchTerm, Pageable pageable) {
        log.info("Searching asset dashboard with term: '{}', page={}, size={}", searchTerm, pageable.getPageNumber(), pageable.getPageSize());
        
        Page<Asset> assetPage = assetRepository.findByDeletedFalseAndSearchTerm(searchTerm, pageable);
        List<AssetDashboardDTO> dashboardDTOs = assetPage.getContent().stream()
                .map(this::convertToAssetDashboardDTO)
                .collect(Collectors.toList());
        
        return new PageResponse<>(
                dashboardDTOs,
                assetPage.getNumber(),
                assetPage.getSize(),
                assetPage.getTotalElements(),
                assetPage.getTotalPages(),
                assetPage.isLast(),
                assetPage.isFirst()
        );
    }

    @Override
    public AssignmentResponseDTO assignUserToAsset(AssetUserAssignmentDTO assignmentDTO) {
        log.info("Assigning user {} to asset {}", assignmentDTO.getUserId(), assignmentDTO.getAssetId());
        
        try {
            // Validate asset exists
            Asset asset = assetRepository.findById(assignmentDTO.getAssetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", assignmentDTO.getAssetId()));
            
            // Validate user exists
            User user = userRepository.findById(assignmentDTO.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", assignmentDTO.getUserId()));
            
            // End previous assignment if exists
            if (asset.getCurrentUser() != null) {
                endCurrentUserAssignment(asset.getAssetId());
            }
            
            // Set new current user
            asset.setCurrentUser(user);
            assetRepository.save(asset);
            
            // Create assignment history record
            AssetAssignmentHistory history = new AssetAssignmentHistory();
            history.setAsset(asset);
            history.setUser(user);
            history.setAssignedDate(LocalDateTime.now());
            assignmentHistoryRepository.save(history);
            
            log.info("Successfully assigned user {} to asset {}", user.getFullNameOrOfficeName(), asset.getAssetId());
            
            return AssignmentResponseDTO.success(
                    String.format("Asset successfully assigned to %s", user.getFullNameOrOfficeName()),
                    asset.getAssetId(),
                    user.getId(),
                    "USER"
            );
            
        } catch (ResourceNotFoundException e) {
            log.error("Resource not found during user assignment: {}", e.getMessage());
            return AssignmentResponseDTO.error(e.getMessage(), assignmentDTO.getAssetId());
        } catch (Exception e) {
            log.error("Error assigning user to asset: {}", e.getMessage(), e);
            return AssignmentResponseDTO.error("Failed to assign user to asset: " + e.getMessage(), assignmentDTO.getAssetId());
        }
    }

    @Override
    public AssignmentResponseDTO unassignUserFromAsset(Long assetId) {
        log.info("Unassigning user from asset {}", assetId);
        
        try {
            Asset asset = assetRepository.findById(assetId)
                    .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", assetId));
            
            if (asset.getCurrentUser() == null) {
                return AssignmentResponseDTO.error("No user currently assigned to this asset", assetId);
            }
            
            String userName = asset.getCurrentUser().getFullNameOrOfficeName();
            
            // End current assignment
            endCurrentUserAssignment(assetId);
            
            // Remove current user
            asset.setCurrentUser(null);
            assetRepository.save(asset);
            
            log.info("Successfully unassigned user from asset {}", assetId);
            
            return AssignmentResponseDTO.success(
                    String.format("Asset successfully unassigned from %s", userName),
                    assetId,
                    null,
                    "USER"
            );
            
        } catch (ResourceNotFoundException e) {
            log.error("Asset not found during user unassignment: {}", e.getMessage());
            return AssignmentResponseDTO.error(e.getMessage(), assetId);
        } catch (Exception e) {
            log.error("Error unassigning user from asset: {}", e.getMessage(), e);
            return AssignmentResponseDTO.error("Failed to unassign user from asset: " + e.getMessage(), assetId);
        }
    }

    @Override
    @Transactional
    public AssignmentResponseDTO assignTagToAsset(AssetTagAssignmentRequestDTO assignmentDTO) {
        log.info("Assigning tag {} to asset {}", assignmentDTO.getTagId(), assignmentDTO.getAssetId());
        
        try {
            // Validate asset exists
            Asset asset = assetRepository.findById(assignmentDTO.getAssetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", assignmentDTO.getAssetId()));
            
            // Validate tag exists
            AssetTag tag = assetTagRepository.findById(assignmentDTO.getTagId())
                    .orElseThrow(() -> new ResourceNotFoundException("AssetTag", "id", assignmentDTO.getTagId()));
            
            // Remove previous tag assignments if exists
            removeCurrentTagAssignment(asset.getAssetId());
            
            // Update the tags column in asset table with the assigned tag name
            updateAssetTagsColumn(asset, tag);
            
            // Add new tag to assigned tags collection
            asset.getAssignedTags().add(tag);
            assetRepository.save(asset);
            
            // Create or update tag assignment record in asset_tag_assignment table
            // This ensures we always maintain a mapping record for reporting and history
            saveTagAssignmentRecord(asset.getAssetId(), tag.getId());
            
            log.info("Successfully assigned tag '{}' (ID: {}) to asset {} - Created mapping record in asset_tag_assignment table", 
                    tag.getName(), tag.getId(), asset.getAssetId());
            
            return AssignmentResponseDTO.success(
                    String.format("Tag '%s' successfully assigned to asset", tag.getName()),
                    asset.getAssetId(),
                    tag.getId(),
                    "TAG"
            );
            
        } catch (ResourceNotFoundException e) {
            log.error("Resource not found during tag assignment: {}", e.getMessage());
            return AssignmentResponseDTO.error(e.getMessage(), assignmentDTO.getAssetId());
        } catch (Exception e) {
            log.error("Error assigning tag to asset: {}", e.getMessage(), e);
            return AssignmentResponseDTO.error("Failed to assign tag to asset: " + e.getMessage(), assignmentDTO.getAssetId());
        }
    }

    @Override
    public AssignmentResponseDTO unassignTagFromAsset(Long assetId) {
        log.info("Unassigning tag from asset {}", assetId);
        
        try {
            Asset asset = assetRepository.findById(assetId)
                    .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", assetId));
            
            if (asset.getAssignedTags() == null || asset.getAssignedTags().isEmpty()) {
                return AssignmentResponseDTO.error("No tag currently assigned to this asset", assetId);
            }
            
            // Get the current tag name for the response
            String tagName = asset.getAssignedTags().iterator().next().getName();
            
            // Remove tag assignments
            removeCurrentTagAssignment(assetId);
            
            // Clear the tags column in asset table
            asset.setTags(null);
            
            // Clear assigned tags from asset
            asset.getAssignedTags().clear();
            assetRepository.save(asset);
            
            log.info("Successfully unassigned tag from asset {}", assetId);
            
            return AssignmentResponseDTO.success(
                    String.format("Tag '%s' successfully unassigned from asset", tagName),
                    assetId,
                    null,
                    "TAG"
            );
            
        } catch (ResourceNotFoundException e) {
            log.error("Asset not found during tag unassignment: {}", e.getMessage());
            return AssignmentResponseDTO.error(e.getMessage(), assetId);
        } catch (Exception e) {
            log.error("Error unassigning tag from asset: {}", e.getMessage(), e);
            return AssignmentResponseDTO.error("Failed to unassign tag from asset: " + e.getMessage(), assetId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AssetUserAssignmentDTO getCurrentUserAssignment(Long assetId) {
        log.info("Fetching current user assignment for asset {}", assetId);
        
        try {
            Asset asset = assetRepository.findById(assetId)
                    .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", assetId));
            
            if (asset.getCurrentUser() == null) {
                log.info("No user currently assigned to asset {}", assetId);
                return null;
            }
            
            User currentUser = asset.getCurrentUser();
            AssetUserAssignmentDTO assignmentDTO = AssetUserAssignmentDTO.builder()
                    .assetId(assetId)
                    .userId(currentUser.getId())
                    .remarks("Current assignment")
                    .build();
            
            log.info("Found current user assignment for asset {}: user {} ({})", 
                assetId, currentUser.getId(), currentUser.getFullNameOrOfficeName());
            
            return assignmentDTO;
            
        } catch (ResourceNotFoundException e) {
            log.error("Asset not found when fetching current user assignment: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error fetching current user assignment for asset {}: {}", assetId, e.getMessage(), e);
            throw e;
        }
    }

    private void endCurrentUserAssignment(Long assetId) {
        List<AssetAssignmentHistory> currentAssignments = assignmentHistoryRepository
                .findByAsset_AssetIdAndUnassignedDateIsNull(assetId);
        
        for (AssetAssignmentHistory assignment : currentAssignments) {
            assignment.setUnassignedDate(LocalDateTime.now());
            assignmentHistoryRepository.save(assignment);
        }
    }

    private void removeCurrentTagAssignment(Long assetId) {
        List<AssetTagAssignment> currentTagAssignments = tagAssignmentRepository.findByAsset_AssetId(assetId);
        tagAssignmentRepository.deleteAll(currentTagAssignments);
    }

    /**
     * Update the tags column in asset table with assigned tag name
     * @param asset Asset entity
     * @param tag AssetTag entity
     */
    private void updateAssetTagsColumn(Asset asset, AssetTag tag) {
        log.debug("Updating tags column for asset {}: setting to '{}'", asset.getAssetId(), tag.getName());
        
        // Update the tags column with the assigned tag name
        // This provides a quick reference without needing to join tables
        asset.setTags(tag.getName());
        
        log.debug("Updated asset {} tags column to: '{}'", asset.getAssetId(), tag.getName());
    }

    /**
     * Save tag assignment record to asset_tag_assignment table
     * Prevents duplicate entries by checking if assignment already exists
     * @param assetId Asset ID
     * @param tagId Tag ID
     */
    private void saveTagAssignmentRecord(Long assetId, Long tagId) {
        log.debug("Saving tag assignment record: assetId={}, tagId={}", assetId, tagId);
        
        // Check if assignment already exists to prevent duplicates
        if (!tagAssignmentRepository.existsByAssetIdAndTagId(assetId, tagId)) {
            Asset asset = assetRepository.findById(assetId)
                    .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", assetId));
            
            AssetTag tag = assetTagRepository.findById(tagId)
                    .orElseThrow(() -> new ResourceNotFoundException("AssetTag", "id", tagId));
            
            AssetTagAssignment tagAssignment = new AssetTagAssignment();
            tagAssignment.setAsset(asset);
            tagAssignment.setTag(tag);
            
            tagAssignmentRepository.save(tagAssignment);
            
            log.debug("Successfully created new tag assignment record: asset_id={}, tag_id={}", assetId, tagId);
        } else {
            log.debug("Tag assignment record already exists: asset_id={}, tag_id={} - skipping duplicate creation", assetId, tagId);
        }
    }

    private AssetDashboardDTO convertToAssetDashboardDTO(Asset asset) {
        AssetDashboardDTO.AssetDashboardDTOBuilder builder = AssetDashboardDTO.builder()
                .assetId(asset.getAssetId())
                .name(asset.getName())
                .status(asset.getStatus())
                .serialNumber(asset.getSerialNumber())
                .itAssetCode(asset.getItAssetCode())
                .poNumber(asset.getPoNumber())
                .invoiceNumber(asset.getInvoiceNumber())
                .inventoryLocation(asset.getInventoryLocation())
                .ownerType(asset.getOwnerType())
                .acquisitionType(asset.getAcquisitionType());

        // Asset Type Information
        if (asset.getAssetType() != null) {
            builder.assetTypeId(asset.getAssetType().getId())
                   .assetTypeName(asset.getAssetType().getName());
        }

        // Make Information
        if (asset.getMake() != null) {
            builder.makeId(asset.getMake().getId())
                   .makeName(asset.getMake().getName());
        }

        // Model Information
        if (asset.getModel() != null) {
            builder.modelId(asset.getModel().getId())
                   .modelName(asset.getModel().getName());
        }

        // Current User Information
        if (asset.getCurrentUser() != null) {
            User user = asset.getCurrentUser();
            builder.currentUserId(user.getId())
                   .currentUserName(user.getFullNameOrOfficeName())
                   .currentUserEmail(user.getEmail())
                   .currentUserDepartment(user.getDepartment());
        }

        // Current Tag Information (use first tag if multiple are assigned)
        if (asset.getAssignedTags() != null && !asset.getAssignedTags().isEmpty()) {
            AssetTag firstTag = asset.getAssignedTags().iterator().next();
            builder.currentTagId(firstTag.getId())
                   .currentTagName(firstTag.getName());
        }

        return builder.build();
    }
} 