package com.inventory.system.controller;

import com.inventory.system.dto.AssetPODTO;
import com.inventory.system.dto.AssetPOMigrationResponse;
import com.inventory.system.dto.AssetPOUpdateResponse;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.dto.POSummaryDTO;
import com.inventory.system.dto.PODeletionWarningDTO;
import com.inventory.system.dto.PODeletionConflictDTO;
import com.inventory.system.dto.AssetDTO;
import com.inventory.system.exception.ConflictException;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.service.AssetPOService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/asset-pos")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             allowCredentials = "true",
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
public class AssetPOController {
    
    private final AssetPOService assetPOService;
    
    @PostMapping
    public ResponseEntity<AssetPODTO> createAssetPO(@Valid @RequestBody AssetPODTO assetPODTO) {
        return new ResponseEntity<>(assetPOService.createAssetPO(assetPODTO), HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AssetPODTO> updateAssetPO(@PathVariable Long id, @Valid @RequestBody AssetPODTO assetPODTO) {
        return ResponseEntity.ok(assetPOService.updateAssetPO(id, assetPODTO));
    }
    
    @PutMapping("/{id}/cascade")
    public ResponseEntity<AssetPOUpdateResponse> updateAssetPOWithCascade(@PathVariable Long id, @Valid @RequestBody AssetPODTO assetPODTO) {
        return ResponseEntity.ok(assetPOService.updateAssetPOWithCascade(id, assetPODTO));
    }
    
    @PutMapping("/{id}/safe-pk-update")
    public ResponseEntity<AssetPOUpdateResponse> updateAssetPOWithSafePrimaryKeyUpdate(@PathVariable Long id, @Valid @RequestBody AssetPODTO assetPODTO) {
        return ResponseEntity.ok(assetPOService.updateAssetPOWithSafePrimaryKeyUpdate(id, assetPODTO));
    }
    
    @PutMapping("/{id}/simple-cascade")
    public ResponseEntity<Void> cascadeUpdate(@PathVariable Long id, @RequestBody Map<String, String> req) {
        assetPOService.updatePoWithCascade(id, req.get("poNumber"));
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/migrate-po-number")
    public ResponseEntity<AssetPOMigrationResponse> migratePoNumber(@RequestBody Map<String, String> request) {
        String oldPoNumber = request.get("oldPoNumber");
        String newPoNumber = request.get("newPoNumber");
        
        AssetPOMigrationResponse response = assetPOService.migratePoNumber(oldPoNumber, newPoNumber);
        
        if ("SUCCESS".equals(response.getStatus())) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AssetPODTO> getAssetPO(@PathVariable Long id) {
        return ResponseEntity.ok(assetPOService.getAssetPO(id));
    }
    
    @GetMapping
    public ResponseEntity<PageResponse<AssetPODTO>> getAllAssetPOs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "poNumber") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(assetPOService.getAllAssetPOs(pageRequest));
    }
    
    @GetMapping("/search")
    public ResponseEntity<PageResponse<AssetPODTO>> searchAssetPOs(
            @RequestParam String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "poNumber") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(assetPOService.searchAssetPOs(searchTerm, pageRequest));
    }
    
    // Removed filtering endpoints - use frontend filtering with GET /api/asset-pos
    
    @GetMapping("/available-po-numbers")
    public ResponseEntity<List<String>> getAvailablePONumbers() {
        return ResponseEntity.ok(assetPOService.getAvailablePONumbers());
    }

    // Removed date range filtering endpoint - use frontend filtering with GET /api/asset-pos
    
    @GetMapping("/leases/expiring")
    public ResponseEntity<List<AssetPODTO>> getLeasesExpiringSoon(
            @RequestParam(defaultValue = "30") int daysAhead) {
        return ResponseEntity.ok(assetPOService.getLeasesExpiringSoon(daysAhead));
    }
    
    @GetMapping("/leases/expiring-between")
    public ResponseEntity<List<AssetPODTO>> getLeasesExpiringBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(assetPOService.getLeasesExpiringBetween(startDate, endDate));
    }
    
    @GetMapping("/po/{poNumber}")
    public ResponseEntity<AssetPODTO> getAssetPOByPONumber(@PathVariable String poNumber) {
        return ResponseEntity.ok(assetPOService.getAssetPOByPONumber(poNumber));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssetPO(@PathVariable Long id) {
        assetPOService.deleteAssetPO(id);
        return ResponseEntity.noContent().build();
    }
    
    // ===== NEW PO-ASSET MANAGEMENT ENDPOINTS =====
    
    /**
     * 1. Fetch All Assets for a Given PO (via PO Number)
     * GET /api/asset-pos/{poNumber}/assets
     */
    @GetMapping("/{poNumber}/assets")
    public ResponseEntity<List<AssetDTO>> getAssetsByPONumber(@PathVariable String poNumber) {
        List<AssetDTO> assets = assetPOService.getAssetsByPONumber(poNumber);
        return ResponseEntity.ok(assets);
    }
    
    /**
     * 2. Get Summary for a PO: Total Devices, Linked Assets, and Remaining
     * GET /api/asset-pos/{poNumber}/summary
     */
    @GetMapping("/{poNumber}/summary")
    public ResponseEntity<POSummaryDTO> getPOSummary(@PathVariable String poNumber) {
        POSummaryDTO summary = assetPOService.getPOSummary(poNumber);
        return ResponseEntity.ok(summary);
    }
    
    /**
     * 3a. Get deletion warning for a PO
     * GET /api/asset-pos/{poNumber}/deletion-warning
     */
    @GetMapping("/{poNumber}/deletion-warning")
    public ResponseEntity<PODeletionWarningDTO> getPODeletionWarning(@PathVariable String poNumber) {
        PODeletionWarningDTO warning = assetPOService.getPODeletionWarning(poNumber);
        return ResponseEntity.ok(warning);
    }
    
    /**
     * 3a-enhanced. Check for deletion conflicts before attempting cascade deletion
     * GET /api/asset-pos/{poNumber}/deletion-conflicts
     */
    @GetMapping("/{poNumber}/deletion-conflicts")
    public ResponseEntity<PODeletionConflictDTO> checkPODeletionConflicts(@PathVariable String poNumber) {
        PODeletionConflictDTO conflicts = assetPOService.checkPODeletionConflicts(poNumber);
        
        if (conflicts != null) {
            // Return 409 Conflict with detailed blocking information
            return ResponseEntity.status(HttpStatus.CONFLICT).body(conflicts);
        } else {
            // Return 200 OK with null body indicating safe to delete
            return ResponseEntity.ok().build();
        }
    }
    
    /**
     * 3b. Delete PO with Cascading Asset Deletion (Enhanced with Conflict Detection)
     * DELETE /api/asset-pos/{poNumber}/cascade
     */
    @DeleteMapping("/{poNumber}/cascade")
    public ResponseEntity<?> deleteAssetPOWithCascade(@PathVariable String poNumber) {
        try {
            // First check for conflicts
            PODeletionConflictDTO conflicts = assetPOService.checkPODeletionConflicts(poNumber);
            
            if (conflicts != null) {
                // Return 409 Conflict with detailed blocking information
                return ResponseEntity.status(HttpStatus.CONFLICT).body(conflicts);
            }
            
            // Proceed with deletion if no conflicts
            int deletedAssetsCount = assetPOService.deleteAssetPOWithCascade(poNumber);
            
            Map<String, Object> response = Map.of(
                    "message", "PO and linked assets deleted successfully",
                    "poNumber", poNumber,
                    "deletedAssetsCount", deletedAssetsCount
            );
            
            return ResponseEntity.ok(response);
            
        } catch (ConflictException e) {
            // Handle any conflicts that might have been missed
            Map<String, Object> errorResponse = Map.of(
                    "message", "Cannot delete PO due to conflicts",
                    "error", e.getMessage(),
                    "poNumber", poNumber
            );
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
            
        } catch (ResourceNotFoundException e) {
            Map<String, Object> errorResponse = Map.of(
                    "message", "PO not found",
                    "error", e.getMessage(),
                    "poNumber", poNumber
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = Map.of(
                    "message", "Unexpected error during PO deletion",
                    "error", e.getMessage(),
                    "poNumber", poNumber
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * 4. Delete Individual Asset from PO
     * DELETE /api/asset-pos/assets/{assetId}
     */
    @DeleteMapping("/assets/{assetId}")
    public ResponseEntity<Map<String, Object>> deleteIndividualAsset(@PathVariable Long assetId) {
        boolean deleted = assetPOService.deleteIndividualAsset(assetId);
        
        if (deleted) {
            Map<String, Object> response = Map.of(
                    "message", "Asset deleted successfully",
                    "assetId", assetId,
                    "deleted", true
            );
            return ResponseEntity.ok(response);
        } else {
            Map<String, Object> response = Map.of(
                    "message", "Asset not found or already deleted",
                    "assetId", assetId,
                    "deleted", false
            );
            return ResponseEntity.status(404).body(response);
        }
    }
    
} 