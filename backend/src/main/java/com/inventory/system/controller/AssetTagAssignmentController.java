package com.inventory.system.controller;

import com.inventory.system.dto.AssetTagAssignmentDTO;
import com.inventory.system.dto.AssetTagAssignmentByNameDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.service.AssetTagAssignmentService;
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
@RequestMapping("/api/asset-tag-assignments")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             allowCredentials = "true",
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class AssetTagAssignmentController {
    private final AssetTagAssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<AssetTagAssignmentDTO> assignTag(@Valid @RequestBody AssetTagAssignmentDTO assignmentDTO) {
        return new ResponseEntity<>(assignmentService.assignTag(assignmentDTO), HttpStatus.CREATED);
    }

    @PostMapping("/by-name")
    public ResponseEntity<AssetTagAssignmentDTO> assignTagByName(@Valid @RequestBody AssetTagAssignmentByNameDTO assignmentDTO) {
        return new ResponseEntity<>(assignmentService.assignTagByName(assignmentDTO), HttpStatus.CREATED);
    }

    @DeleteMapping("/asset/{assetId}/tag/{tagId}")
    public ResponseEntity<Void> unassignTag(@PathVariable Long assetId, @PathVariable Long tagId) {
        assignmentService.unassignTag(assetId, tagId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<PageResponse<AssetTagAssignmentDTO>> getAllAssignments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "asset") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(assignmentService.getAllAssignments(pageRequest));
    }

    @GetMapping("/asset/{assetId}")
    public ResponseEntity<List<AssetTagAssignmentDTO>> getAssignmentsByAssetId(@PathVariable Long assetId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByAssetId(assetId));
    }

    @GetMapping("/asset/{assetId}/paged")
    public ResponseEntity<PageResponse<AssetTagAssignmentDTO>> getAssignmentsByAssetIdPaged(
            @PathVariable Long assetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "tag") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(assignmentService.getAssignmentsByAssetId(assetId, pageRequest));
    }

    @GetMapping("/tag/{tagId}")
    public ResponseEntity<List<AssetTagAssignmentDTO>> getAssignmentsByTagId(@PathVariable Long tagId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByTagId(tagId));
    }

    @GetMapping("/tag/{tagId}/paged")
    public ResponseEntity<PageResponse<AssetTagAssignmentDTO>> getAssignmentsByTagIdPaged(
            @PathVariable Long tagId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "asset") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(assignmentService.getAssignmentsByTagId(tagId, pageRequest));
    }

    @DeleteMapping("/asset/{assetId}")
    public ResponseEntity<Void> deleteAssignmentsByAssetId(@PathVariable Long assetId) {
        assignmentService.deleteAssignmentsByAssetId(assetId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/tag/{tagId}")
    public ResponseEntity<Void> deleteAssignmentsByTagId(@PathVariable Long tagId) {
        assignmentService.deleteAssignmentsByTagId(tagId);
        return ResponseEntity.noContent().build();
    }
} 