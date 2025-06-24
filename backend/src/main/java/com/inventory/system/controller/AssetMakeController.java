package com.inventory.system.controller;

import com.inventory.system.dto.AssetMakeDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.service.AssetMakeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;

@RestController
@RequestMapping("/api/asset-makes")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class AssetMakeController {
    private final AssetMakeService assetMakeService;

    @PostMapping
    public ResponseEntity<AssetMakeDTO> createAssetMake(@Valid @RequestBody AssetMakeDTO assetMakeDTO) {
        return new ResponseEntity<>(assetMakeService.createAssetMake(assetMakeDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetMakeDTO> updateAssetMake(@PathVariable Long id, @Valid @RequestBody AssetMakeDTO assetMakeDTO) {
        return ResponseEntity.ok(assetMakeService.updateAssetMake(id, assetMakeDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetMakeDTO> getAssetMake(@PathVariable Long id) {
        return ResponseEntity.ok(assetMakeService.getAssetMake(id));
    }

    @GetMapping
    public ResponseEntity<PageResponse<AssetMakeDTO>> getAllAssetMakes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        PageResponse<AssetMakeDTO> assetMakes;
        if (status != null && !status.trim().isEmpty()) {
            assetMakes = assetMakeService.getAssetMakesByStatus(status, pageRequest);
        } else {
            assetMakes = assetMakeService.getAllAssetMakes(pageRequest);
        }
        return ResponseEntity.ok(assetMakes);
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<AssetMakeDTO>> searchAssetMakes(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(assetMakeService.searchAssetMakes(name, status, pageRequest));
    }

    @GetMapping("/by-type/{typeId}")
    public ResponseEntity<PageResponse<AssetMakeDTO>> getAssetMakesByType(
            @PathVariable Long typeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(assetMakeService.getAssetMakesByType(typeId, pageRequest));
    }

    @GetMapping("/by-type/{typeId}/all")
    public ResponseEntity<List<AssetMakeDTO>> getAllAssetMakesByType(@PathVariable Long typeId) {
        return ResponseEntity.ok(assetMakeService.getAllAssetMakesByType(typeId));
    }

    @GetMapping("/search-by-type")
    public ResponseEntity<PageResponse<AssetMakeDTO>> searchAssetMakesByType(
            @RequestParam String name,
            @RequestParam Long typeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(assetMakeService.searchAssetMakesByType(name, typeId, pageRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssetMake(@PathVariable Long id) {
        assetMakeService.deleteAssetMake(id);
        return ResponseEntity.noContent().build();
    }
} 