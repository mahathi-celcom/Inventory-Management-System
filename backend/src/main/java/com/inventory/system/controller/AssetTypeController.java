package com.inventory.system.controller;

import com.inventory.system.dto.AssetTypeDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.service.AssetTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/asset-types")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
public class AssetTypeController {
    private final AssetTypeService assetTypeService;

    @PostMapping
    public ResponseEntity<AssetTypeDTO> createAssetType(@Valid @RequestBody AssetTypeDTO assetTypeDTO) {
        return new ResponseEntity<>(assetTypeService.createAssetType(assetTypeDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetTypeDTO> updateAssetType(@PathVariable Long id, @Valid @RequestBody AssetTypeDTO assetTypeDTO) {
        return ResponseEntity.ok(assetTypeService.updateAssetType(id, assetTypeDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetTypeDTO> getAssetType(@PathVariable Long id) {
        return ResponseEntity.ok(assetTypeService.getAssetType(id));
    }

    @GetMapping
    public ResponseEntity<PageResponse<AssetTypeDTO>> getAllAssetTypes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        PageResponse<AssetTypeDTO> assetTypes;
        
        // Handle combined filters
        if (category != null && !category.trim().isEmpty() && status != null && !status.trim().isEmpty()) {
            assetTypes = assetTypeService.getAssetTypesByCategoryAndStatus(category, status, pageRequest);
        } else if (category != null && !category.trim().isEmpty()) {
            assetTypes = assetTypeService.getAssetTypesByCategory(category, pageRequest);
        } else if (status != null && !status.trim().isEmpty()) {
            assetTypes = assetTypeService.getAssetTypesByStatus(status, pageRequest);
        } else {
            assetTypes = assetTypeService.getAllAssetTypes(pageRequest);
        }
        return ResponseEntity.ok(assetTypes);
    }

    @GetMapping("/all")
    public ResponseEntity<List<AssetTypeDTO>> getAllAssetTypesSimple() {
        return ResponseEntity.ok(assetTypeService.getActiveAssetTypes());
    }

    @GetMapping("/active")
    public ResponseEntity<List<AssetTypeDTO>> getActiveAssetTypes() {
        return ResponseEntity.ok(assetTypeService.getActiveAssetTypes());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<PageResponse<AssetTypeDTO>> getAssetTypesByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        PageResponse<AssetTypeDTO> assetTypes;
        if (status != null && !status.trim().isEmpty()) {
            assetTypes = assetTypeService.getAssetTypesByCategoryAndStatus(category, status, pageRequest);
        } else {
            assetTypes = assetTypeService.getAssetTypesByCategory(category, pageRequest);
        }
        return ResponseEntity.ok(assetTypes);
    }

    @GetMapping("/category/{category}/active")
    public ResponseEntity<List<AssetTypeDTO>> getActiveAssetTypesByCategory(@PathVariable String category) {
        return ResponseEntity.ok(assetTypeService.getActiveAssetTypesByCategory(category));
    }

    @GetMapping("/category/{category}/all")
    public ResponseEntity<List<AssetTypeDTO>> getAssetTypesByCategorySimple(@PathVariable String category) {
        return ResponseEntity.ok(assetTypeService.getAssetTypesByCategory(category));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssetType(@PathVariable Long id) {
        assetTypeService.deleteAssetType(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activateAssetType(@PathVariable Long id) {
        assetTypeService.activateAssetType(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateAssetType(@PathVariable Long id) {
        assetTypeService.deactivateAssetType(id);
        return ResponseEntity.ok().build();
    }
} 