package com.inventory.system.controller;

import com.inventory.system.dto.AssetModelDTO;
import com.inventory.system.dto.AssetModelDetailsDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.service.AssetModelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/asset-models")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class AssetModelController {
    private final AssetModelService assetModelService;

    @PostMapping
    public ResponseEntity<?> createAssetModel(@Valid @RequestBody AssetModelDTO assetModelDTO, BindingResult bindingResult) {
        log.info("Creating asset model with data: {}", assetModelDTO);
        
        // Check for validation errors
        if (bindingResult.hasErrors()) {
            String errors = bindingResult.getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
            log.error("Validation errors: {}", errors);
            return ResponseEntity.badRequest().body("Validation errors: " + errors);
        }
        
        try {
            AssetModelDTO createdModel = assetModelService.createAssetModel(assetModelDTO);
            log.info("Successfully created asset model with ID: {}", createdModel.getId());
            return new ResponseEntity<>(createdModel, HttpStatus.CREATED);
        } catch (ResourceNotFoundException e) {
            log.error("Resource not found when creating asset model: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Invalid reference: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error creating asset model: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("An unexpected error occurred: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAssetModel(@PathVariable Long id, @Valid @RequestBody AssetModelDTO assetModelDTO, BindingResult bindingResult) {
        log.info("Updating asset model with ID: {} and data: {}", id, assetModelDTO);
        
        if (bindingResult.hasErrors()) {
            String errors = bindingResult.getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
            log.error("Validation errors: {}", errors);
            return ResponseEntity.badRequest().body("Validation errors: " + errors);
        }
        
        try {
            AssetModelDTO updatedModel = assetModelService.updateAssetModel(id, assetModelDTO);
            return ResponseEntity.ok(updatedModel);
        } catch (ResourceNotFoundException e) {
            log.error("Resource not found when updating asset model: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Invalid reference: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error updating asset model: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("An unexpected error occurred: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetModelDTO> getAssetModel(@PathVariable Long id) {
        return ResponseEntity.ok(assetModelService.getAssetModel(id));
    }

    @GetMapping(value = "/{id}/details", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AssetModelDetailsDTO> getAssetModelDetails(@PathVariable Long id) {
        log.info("Fetching asset model details for ID: {}", id);
        try {
            AssetModelDetailsDTO assetModelDetails = assetModelService.getAssetModelDetails(id);
            log.info("Successfully retrieved asset model details for ID: {}", id);
            return ResponseEntity.ok(assetModelDetails);
        } catch (Exception e) {
            log.error("Error fetching asset model details for ID: {}", id, e);
            throw e;
        }
    }

    @GetMapping
    public ResponseEntity<PageResponse<AssetModelDTO>> getAllAssetModels(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        PageResponse<AssetModelDTO> assetModels;
        if (status != null && !status.trim().isEmpty()) {
            assetModels = assetModelService.getAssetModelsByStatus(status, pageRequest);
        } else {
            assetModels = assetModelService.getAllAssetModels(pageRequest);
        }
        return ResponseEntity.ok(assetModels);
    }

    @GetMapping("/make/{makeId}")
    public ResponseEntity<PageResponse<AssetModelDTO>> getAssetModelsByMake(
            @PathVariable Long makeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        PageResponse<AssetModelDTO> assetModels;
        if (status != null && !status.trim().isEmpty()) {
            assetModels = assetModelService.getAssetModelsByMakeAndStatus(makeId, status, pageRequest);
        } else {
            assetModels = assetModelService.getAssetModelsByMake(makeId, pageRequest);
        }
        return ResponseEntity.ok(assetModels);
    }

    @GetMapping("/make/{makeId}/all")
    public ResponseEntity<List<AssetModelDTO>> getAllAssetModelsByMake(@PathVariable Long makeId) {
        return ResponseEntity.ok(assetModelService.getAllAssetModelsByMake(makeId));
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<AssetModelDTO>> searchAssetModels(
            @RequestParam String modelName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(assetModelService.searchAssetModels(modelName, status, pageRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssetModel(@PathVariable Long id) {
        assetModelService.deleteAssetModel(id);
        return ResponseEntity.noContent().build();
    }
} 