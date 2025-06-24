package com.inventory.system.controller;

import com.inventory.system.dto.AssetDTO;
import com.inventory.system.dto.AssetRequestDTO;
import com.inventory.system.dto.AssetUpdateDTO;
import com.inventory.system.dto.AssetStatusHistoryDTO;
import com.inventory.system.dto.BulkAssetResponse;
import com.inventory.system.dto.BulkAssetByPOResponse;
import com.inventory.system.dto.BulkAssetByPORequest;
import com.inventory.system.dto.BulkUpdateResponse;
import com.inventory.system.dto.AssetBulkUpdateDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.service.AssetService;
import com.inventory.system.service.AssetStatusHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import org.springframework.web.bind.annotation.CrossOrigin;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;

@Slf4j
@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             allowCredentials = "true",
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RequiredArgsConstructor
public class AssetController {
    private final AssetService assetService;
    private final AssetStatusHistoryService assetStatusHistoryService;

    @PostMapping
    public ResponseEntity<AssetDTO> createAsset(@Valid @RequestBody AssetDTO assetDTO) {
        AssetDTO savedAsset = assetService.createAsset(assetDTO);
        return new ResponseEntity<>(savedAsset, HttpStatus.CREATED);
    }

    @PutMapping("/{assetId}")
    public ResponseEntity<AssetDTO> updateAsset(
            @PathVariable Long assetId,
            @Valid @RequestBody AssetDTO assetDTO) {
        AssetDTO updatedAsset = assetService.updateAsset(assetId, assetDTO);
        return ResponseEntity.ok(updatedAsset);
    }

    @PutMapping(value = "/{id}/status", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AssetDTO> updateAssetStatus(
            @PathVariable Long id,
            @Valid @RequestBody AssetStatusHistoryDTO statusHistoryDTO) {
        
        // Enhanced debugging - log everything
        log.info("=== ASSET STATUS UPDATE REQUEST ===");
        log.info("Asset ID: {}", id);
        log.info("Raw Status Input: '{}'", statusHistoryDTO.getStatus());
        log.info("Status Class: {}", statusHistoryDTO.getStatus() != null ? statusHistoryDTO.getStatus().getClass().getSimpleName() : "null");
        log.info("Status Length: {}", statusHistoryDTO.getStatus() != null ? statusHistoryDTO.getStatus().length() : 0);
        log.info("Changed By ID: {}", statusHistoryDTO.getChangedById());
        log.info("Remarks: {}", statusHistoryDTO.getRemarks());
        
        // Log character codes for debugging invisible characters
        if (statusHistoryDTO.getStatus() != null) {
            StringBuilder charCodes = new StringBuilder();
            for (char c : statusHistoryDTO.getStatus().toCharArray()) {
                charCodes.append((int) c).append(",");
            }
            log.info("Status Character Codes: [{}]", charCodes.toString());
        }
        
        try {
            // Test our normalization logic before calling service
            if (statusHistoryDTO.getStatus() != null) {
                String testNormalized = normalizeStatusForDebugging(statusHistoryDTO.getStatus());
                log.info("Controller Test Normalization: '{}' -> '{}'", statusHistoryDTO.getStatus(), testNormalized);
            }
            
            AssetDTO updatedAsset = assetService.updateAssetStatus(id, statusHistoryDTO);
            log.info("=== STATUS UPDATE SUCCESS ===");
            log.info("Final Asset Status: {}", updatedAsset.getStatus());
            return ResponseEntity.ok(updatedAsset);
            
        } catch (jakarta.validation.ConstraintViolationException e) {
            log.error("=== VALIDATION CONSTRAINT VIOLATION ===");
            log.error("Constraint violations:");
            e.getConstraintViolations().forEach(violation -> {
                log.error("  - Field '{}': {}", violation.getPropertyPath(), violation.getMessage());
                log.error("  - Invalid value: '{}'", violation.getInvalidValue());
            });
            throw e;
            
        } catch (IllegalArgumentException e) {
            log.error("=== ILLEGAL ARGUMENT EXCEPTION ===");
            log.error("Message: {}", e.getMessage());
            log.error("Stack trace:", e);
            throw e;
            
        } catch (Exception e) {
            log.error("=== UNEXPECTED ERROR IN STATUS UPDATE ===");
            log.error("Exception type: {}", e.getClass().getSimpleName());
            log.error("Message: {}", e.getMessage());
            log.error("Full stack trace:", e);
            throw e;
        }
    }
    
    /**
     * Debug method to test status normalization at controller level
     */
    private String normalizeStatusForDebugging(String status) {
        if (status == null) return null;
        
        String trimmedStatus = status.trim();
        
        // Convert frontend values to backend values - same logic as service
        switch (trimmedStatus.toLowerCase()) {
            case "in stock": 
            case "in_stock": 
                return "IN_STOCK";
            case "active": 
                return "ACTIVE";
            case "in repair": 
            case "in_repair": 
                return "IN_REPAIR";
            case "broken": 
                return "BROKEN";
            case "ceased": 
                return "CEASED";
            default: 
                // Check if it's already in backend format (case-insensitive)
                String upperStatus = trimmedStatus.toUpperCase();
                if (upperStatus.equals("IN_STOCK") || 
                    upperStatus.equals("ACTIVE") || 
                    upperStatus.equals("IN_REPAIR") || 
                    upperStatus.equals("BROKEN") || 
                    upperStatus.equals("CEASED")) {
                    return upperStatus;
                }
                // If we reach here, it's an invalid status
                return trimmedStatus.toUpperCase();
        }
    }

    @GetMapping(value = "/{id}/status", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PageResponse<AssetStatusHistoryDTO>> getAssetStatusHistory(
            @PathVariable Long id,
            Pageable pageable) {
        log.info("Fetching status history for asset ID: {}", id);
        try {
            PageResponse<AssetStatusHistoryDTO> statusHistory = assetStatusHistoryService.getStatusHistoriesByAssetId(id, pageable);
            log.info("Successfully retrieved {} status history records for asset ID: {}", statusHistory.getTotalElements(), id);
            return ResponseEntity.ok(statusHistory);
        } catch (Exception e) {
            log.error("Error fetching status history for asset ID: {}", id, e);
            throw e;
        }
    }

    @GetMapping("/{assetId}")
    public ResponseEntity<AssetDTO> getAsset(@PathVariable Long assetId) {
        AssetDTO asset = assetService.getAsset(assetId);
        return ResponseEntity.ok(asset);
    }

    @GetMapping
    public ResponseEntity<PageResponse<AssetDTO>> getAllAssets(Pageable pageable) {
        PageResponse<AssetDTO> assets = assetService.getAllAssets(pageable);
        return ResponseEntity.ok(assets);
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<AssetDTO>> searchAssets(
            @RequestParam String search,
            Pageable pageable) {
        PageResponse<AssetDTO> assets = assetService.searchAssets(search, pageable);
        return ResponseEntity.ok(assets);
    }

    @DeleteMapping("/{assetId}")
    public ResponseEntity<Void> deleteAsset(@PathVariable Long assetId) {
        assetService.deleteAsset(assetId);
        return ResponseEntity.noContent().build();
    }

    // Removed filtering endpoints - use frontend filtering with GET /api/assets

    // Soft delete management endpoints
    @GetMapping("/deleted")
    public ResponseEntity<PageResponse<AssetDTO>> getDeletedAssets(Pageable pageable) {
        PageResponse<AssetDTO> assets = assetService.getDeletedAssets(pageable);
        return ResponseEntity.ok(assets);
    }

    @GetMapping("/all-including-deleted")
    public ResponseEntity<PageResponse<AssetDTO>> getAllAssetsIncludingDeleted(Pageable pageable) {
        PageResponse<AssetDTO> assets = assetService.getAllAssetsIncludingDeleted(pageable);
        return ResponseEntity.ok(assets);
    }

    @PostMapping("/{assetId}/restore")
    public ResponseEntity<Void> restoreAsset(@PathVariable Long assetId) {
        assetService.restoreAsset(assetId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{assetId}/permanent")
    public ResponseEntity<Void> permanentlyDeleteAsset(@PathVariable Long assetId) {
        assetService.permanentlyDeleteAsset(assetId);
        return ResponseEntity.noContent().build();
    }
    
    // Bulk operations endpoints
    @GetMapping(value = "/by-po/{poNumber}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<AssetDTO>> getAssetsByPONumber(@PathVariable String poNumber) {
        log.info("Fetching assets for PO: {}", poNumber);
        List<AssetDTO> assets = assetService.getAssetsByPONumber(poNumber);
        return ResponseEntity.ok(assets);
    }

    @PostMapping(value = "/bulk", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<BulkAssetResponse> createAssetsInBulk(
            @Valid @RequestBody List<AssetRequestDTO> requests) {
        
        // Enhanced logging - log the complete request payload for debugging
        log.info("=== BULK ASSET CREATION REQUEST ===");
        log.info("Received bulk asset creation request for {} assets", requests.size());
        
        if (log.isDebugEnabled()) {
            log.debug("Complete request payload:");
            for (int i = 0; i < requests.size(); i++) {
                AssetRequestDTO request = requests.get(i);
                log.debug("Asset[{}]: SerialNumber={}, Name={}, Status={}, ModelId={}, AssetTypeId={}, VendorId={}", 
                    i, request.getSerialNumber(), request.getName(), request.getStatus(), 
                    request.getModelId(), request.getAssetTypeId(), request.getVendorId());
            }
        }
        
        // Validate request list
        if (requests == null || requests.isEmpty()) {
            log.warn("Empty or null request list received");
            throw new IllegalArgumentException("Request list cannot be null or empty");
        }
        
        try {
            BulkAssetResponse response = assetService.createAssetsInBulk(requests);
            
            // Enhanced success logging
            log.info("=== BULK ASSET CREATION COMPLETED ===");
            log.info("Total Processed: {}, Success: {}, Failures: {}", 
                response.getTotalProcessed(), response.getSuccessCount(), response.getFailureCount());
            
            // Log errors if any
            if (response.getFailureCount() > 0) {
                log.warn("Bulk creation had {} failures:", response.getFailureCount());
                response.getErrors().forEach(error -> 
                    log.warn("  - Asset[{}] ({}): {} in field '{}'", 
                        error.getIndex(), error.getAssetIdentifier(), 
                        error.getMessage(), error.getField() != null ? error.getField() : "N/A"));
            }
            
            // Return appropriate HTTP status based on results
            if (response.getFailureCount() == 0) {
                // All succeeded
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
            } else if (response.getSuccessCount() > 0) {
                // Partial success
                return ResponseEntity.status(HttpStatus.MULTI_STATUS).body(response);
            } else {
                // All failed
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid request parameters for bulk asset creation: {}", e.getMessage(), e);
            throw e; // Will be handled by GlobalExceptionHandler
        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation during bulk asset creation: {}", e.getMessage(), e);
            throw e; // Will be handled by GlobalExceptionHandler
        } catch (Exception e) {
            log.error("Unexpected error during bulk asset creation", e);
            throw new RuntimeException("Bulk asset creation failed: " + e.getMessage(), e);
        }
    }
    
    @PutMapping(value = "/by-po/{poNumber}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> updateAssetsByPO(
            @PathVariable String poNumber,
            @Valid @RequestBody AssetUpdateDTO updateData) {
        log.info("Received bulk update request for PO: {}", poNumber);
        try {
            assetService.updateAssetsByPO(poNumber, updateData);
            log.info("Successfully completed bulk update for PO: {}", poNumber);
            return ResponseEntity.ok().body("{\"message\": \"Assets updated successfully for PO: " + poNumber + "\"}");
        } catch (Exception e) {
            log.error("Error in bulk update for PO: {}", poNumber, e);
            throw e;
        }
    }
    
    @DeleteMapping(value = "/by-po/{poNumber}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> deleteAssetsByPO(@PathVariable String poNumber) {
        log.info("Received bulk delete request for PO: {}", poNumber);
        try {
            assetService.deleteAssetsByPO(poNumber);
            log.info("Successfully completed bulk delete for PO: {}", poNumber);
            return ResponseEntity.ok().body("{\"message\": \"Assets deleted successfully for PO: " + poNumber + "\"}");
        } catch (Exception e) {
            log.error("Error in bulk delete for PO: {}", poNumber, e);
            throw e;
        }
    }
    
    // Individual asset bulk updates endpoint
    @PutMapping(value = "/bulk-update", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<BulkUpdateResponse> updateAssetsInBulk(
            @Valid @RequestBody AssetBulkUpdateDTO bulkUpdateRequest) {
        log.info("Received individual asset bulk update request for {} assets", 
            bulkUpdateRequest.getAssets().size());
        try {
            BulkUpdateResponse response = assetService.updateAssetsInBulk(bulkUpdateRequest);
            log.info("Successfully completed bulk update - Success: {}, Failures: {}", 
                response.getSuccessCount(), response.getFailureCount());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error in individual asset bulk update", e);
            throw e;
        }
    }

    /**
     * NEW ENDPOINT: Bulk Asset Creation by PO Number
     * POST /api/assets/by-po/{poNumber}
     */
    @PostMapping(value = "/by-po/{poNumber}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<BulkAssetByPOResponse> createAssetsByPO(
            @PathVariable String poNumber,
            @Valid @RequestBody BulkAssetByPORequest request) {
        
        log.info("=== BULK ASSET CREATION BY PO REQUEST ===");
        log.info("Received bulk asset creation request for PO {} with {} assets", poNumber, request.getAssets().size());
        
        if (log.isDebugEnabled()) {
            log.debug("Complete request payload for PO {}:", poNumber);
            for (int i = 0; i < request.getAssets().size(); i++) {
                AssetRequestDTO asset = request.getAssets().get(i);
                log.debug("Asset[{}]: SerialNumber={}, Name={}, Status={}, ModelId={}, AssetTypeId={}, VendorId={}", 
                    i, asset.getSerialNumber(), asset.getName(), asset.getStatus(), 
                    asset.getModelId(), asset.getAssetTypeId(), asset.getVendorId());
            }
        }
        
        // Validate request
        if (request.getAssets() == null || request.getAssets().isEmpty()) {
            log.warn("Empty or null asset list received for PO: {}", poNumber);
            throw new IllegalArgumentException("Asset list cannot be null or empty");
        }
        
        try {
            BulkAssetByPOResponse response = assetService.createAssetsByPO(poNumber, request.getAssets());
            
            // Enhanced success logging
            log.info("=== BULK ASSET CREATION BY PO COMPLETED ===");
            log.info("PO: {}, Total Processed: {}, Created: {}, Failed: {}", 
                poNumber, response.getTotalProcessed(), response.getCreatedCount(), response.getFailedCount());
            
            // Log errors if any
            if (response.getFailedCount() > 0) {
                log.warn("Bulk creation for PO {} had {} failures:", poNumber, response.getFailedCount());
                response.getErrors().forEach(error -> 
                    log.warn("  - Asset[{}] ({}): {} in field '{}'", 
                        error.getIndex(), error.getAssetIdentifier(), 
                        error.getMessage(), error.getField() != null ? error.getField() : "N/A"));
            }
            
            // Return appropriate HTTP status based on results
            if (response.getFailedCount() == 0) {
                // All succeeded
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
            } else if (response.getCreatedCount() > 0) {
                // Partial success
                return ResponseEntity.status(HttpStatus.MULTI_STATUS).body(response);
            } else {
                // All failed
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid request parameters for bulk asset creation by PO {}: {}", poNumber, e.getMessage(), e);
            throw e; // Will be handled by GlobalExceptionHandler
        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation during bulk asset creation by PO {}: {}", poNumber, e.getMessage(), e);
            throw e; // Will be handled by GlobalExceptionHandler
        } catch (Exception e) {
            log.error("Unexpected error during bulk asset creation by PO {}", poNumber, e);
            throw new RuntimeException("Bulk asset creation by PO failed: " + e.getMessage(), e);
        }
    }

    /**
     * DEBUG ENDPOINT: Test status validation and normalization
     * POST /api/assets/debug/test-status
     */
    @PostMapping(value = "/debug/test-status", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> testStatusValidation(@Valid @RequestBody AssetStatusHistoryDTO statusTest) {
        log.info("=== STATUS VALIDATION TEST ===");
        log.info("Input Status: '{}'", statusTest.getStatus());
        
        try {
            // Test normalization
            String normalized = normalizeStatusForDebugging(statusTest.getStatus());
            log.info("Normalized Status: '{}'", normalized);
            
            // Test the pattern validation (it will run automatically due to @Valid)
            String result = String.format("{\"input\":\"%s\",\"normalized\":\"%s\",\"status\":\"VALIDATION_PASSED\"}", 
                statusTest.getStatus(), normalized);
            
            log.info("=== STATUS TEST SUCCESS ===");
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("=== STATUS TEST FAILED ===", e);
            String result = String.format("{\"input\":\"%s\",\"error\":\"%s\",\"status\":\"VALIDATION_FAILED\"}", 
                statusTest.getStatus(), e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }
} 