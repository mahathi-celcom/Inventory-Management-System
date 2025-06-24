package com.inventory.system.controller;

import com.inventory.system.dto.*;
import com.inventory.system.service.AssetAssignmentManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/asset-assignment")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             allowCredentials = "true",
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
public class AssetAssignmentManagementController {
    
    private final AssetAssignmentManagementService assignmentService;
    
    /**
     * Get Asset Dashboard - Fetch all assets with current user and tag information
     * GET /api/asset-assignment/dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<PageResponse<AssetDashboardDTO>> getAssetDashboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "assetId") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        log.info("Fetching asset dashboard: page={}, size={}, sortBy={}, sortDir={}", page, size, sortBy, sortDir);
        
        try {
            Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            
            PageResponse<AssetDashboardDTO> dashboard = assignmentService.getAssetDashboard(pageable);
            
            log.info("Successfully fetched {} assets for dashboard", dashboard.getTotalElements());
            return ResponseEntity.ok(dashboard);
            
        } catch (Exception e) {
            log.error("Error fetching asset dashboard: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Search Asset Dashboard - Search assets with current user and tag information
     * GET /api/asset-assignment/dashboard/search
     */
    @GetMapping("/dashboard/search")
    public ResponseEntity<PageResponse<AssetDashboardDTO>> searchAssetDashboard(
            @RequestParam String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "assetId") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        log.info("Searching asset dashboard with term: '{}', page={}, size={}", searchTerm, page, size);
        
        try {
            Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            
            PageResponse<AssetDashboardDTO> dashboard = assignmentService.searchAssetDashboard(searchTerm, pageable);
            
            log.info("Search returned {} assets for term: '{}'", dashboard.getTotalElements(), searchTerm);
            return ResponseEntity.ok(dashboard);
            
        } catch (Exception e) {
            log.error("Error searching asset dashboard: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get current user assignment for an asset
     * GET /api/asset-assignment/asset/{assetId}
     */
    @GetMapping("/asset/{assetId}")
    public ResponseEntity<AssetUserAssignmentDTO> getCurrentUserAssignment(@PathVariable Long assetId) {
        log.info("Fetching current user assignment for asset {}", assetId);
        
        try {
            AssetUserAssignmentDTO assignment = assignmentService.getCurrentUserAssignment(assetId);
            
            if (assignment != null) {
                log.info("Successfully fetched user assignment for asset {}: user {}", assetId, assignment.getUserId());
                return ResponseEntity.ok(assignment);
            } else {
                log.info("No user assignment found for asset {}", assetId);
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            log.error("Error fetching current user assignment for asset {}: {}", assetId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Assign User to Asset
     * POST /api/asset-assignment/assign-user
     */
    @PostMapping("/assign-user")
    public ResponseEntity<AssignmentResponseDTO> assignUserToAsset(@Valid @RequestBody AssetUserAssignmentDTO assignmentDTO) {
        log.info("Assigning user {} to asset {}", assignmentDTO.getUserId(), assignmentDTO.getAssetId());
        
        try {
            AssignmentResponseDTO response = assignmentService.assignUserToAsset(assignmentDTO);
            
            if (response.isSuccess()) {
                log.info("Successfully assigned user to asset: {}", response.getMessage());
                return ResponseEntity.ok(response);
            } else {
                log.warn("Failed to assign user to asset: {}", response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            log.error("Error assigning user to asset: {}", e.getMessage(), e);
            AssignmentResponseDTO errorResponse = AssignmentResponseDTO.error(
                    "Unexpected error during user assignment: " + e.getMessage(),
                    assignmentDTO.getAssetId()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Unassign User from Asset
     * DELETE /api/asset-assignment/unassign-user/{assetId}
     */
    @DeleteMapping("/unassign-user/{assetId}")
    public ResponseEntity<AssignmentResponseDTO> unassignUserFromAsset(@PathVariable Long assetId) {
        log.info("Unassigning user from asset {}", assetId);
        
        try {
            AssignmentResponseDTO response = assignmentService.unassignUserFromAsset(assetId);
            
            if (response.isSuccess()) {
                log.info("Successfully unassigned user from asset: {}", response.getMessage());
                return ResponseEntity.ok(response);
            } else {
                log.warn("Failed to unassign user from asset: {}", response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            log.error("Error unassigning user from asset: {}", e.getMessage(), e);
            AssignmentResponseDTO errorResponse = AssignmentResponseDTO.error(
                    "Unexpected error during user unassignment: " + e.getMessage(),
                    assetId
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Assign Tag to Asset
     * POST /api/asset-assignment/assign-tag
     */
    @PostMapping("/assign-tag")
    public ResponseEntity<AssignmentResponseDTO> assignTagToAsset(@Valid @RequestBody AssetTagAssignmentRequestDTO assignmentDTO) {
        log.info("Assigning tag {} to asset {}", assignmentDTO.getTagId(), assignmentDTO.getAssetId());
        
        try {
            AssignmentResponseDTO response = assignmentService.assignTagToAsset(assignmentDTO);
            
            if (response.isSuccess()) {
                log.info("Successfully assigned tag to asset: {}", response.getMessage());
                return ResponseEntity.ok(response);
            } else {
                log.warn("Failed to assign tag to asset: {}", response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            log.error("Error assigning tag to asset: {}", e.getMessage(), e);
            AssignmentResponseDTO errorResponse = AssignmentResponseDTO.error(
                    "Unexpected error during tag assignment: " + e.getMessage(),
                    assignmentDTO.getAssetId()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Unassign Tag from Asset
     * DELETE /api/asset-assignment/unassign-tag/{assetId}
     */
    @DeleteMapping("/unassign-tag/{assetId}")
    public ResponseEntity<AssignmentResponseDTO> unassignTagFromAsset(@PathVariable Long assetId) {
        log.info("Unassigning tag from asset {}", assetId);
        
        try {
            AssignmentResponseDTO response = assignmentService.unassignTagFromAsset(assetId);
            
            if (response.isSuccess()) {
                log.info("Successfully unassigned tag from asset: {}", response.getMessage());
                return ResponseEntity.ok(response);
            } else {
                log.warn("Failed to unassign tag from asset: {}", response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            log.error("Error unassigning tag from asset: {}", e.getMessage(), e);
            AssignmentResponseDTO errorResponse = AssignmentResponseDTO.error(
                    "Unexpected error during tag unassignment: " + e.getMessage(),
                    assetId
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
} 