package com.inventory.system.controller;

import com.inventory.system.dto.AssetAssignmentHistoryDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.service.AssetAssignmentHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/asset-assignment-history")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             allowCredentials = "true",
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class AssetAssignmentHistoryController {
    private final AssetAssignmentHistoryService assignmentHistoryService;

    @PostMapping
    public ResponseEntity<AssetAssignmentHistoryDTO> createAssignmentHistory(@Valid @RequestBody AssetAssignmentHistoryDTO assignmentHistoryDTO) {
        return new ResponseEntity<>(assignmentHistoryService.createAssignmentHistory(assignmentHistoryDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetAssignmentHistoryDTO> updateAssignmentHistory(
            @PathVariable Long id,
            @Valid @RequestBody AssetAssignmentHistoryDTO assignmentHistoryDTO) {
        return ResponseEntity.ok(assignmentHistoryService.updateAssignmentHistory(id, assignmentHistoryDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetAssignmentHistoryDTO> getAssignmentHistory(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentHistoryService.getAssignmentHistory(id));
    }

    @GetMapping
    public ResponseEntity<PageResponse<AssetAssignmentHistoryDTO>> getAllAssignmentHistories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "assignedDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(assignmentHistoryService.getAllAssignmentHistories(pageRequest));
    }

    @GetMapping("/asset/{assetId}")
    public ResponseEntity<PageResponse<AssetAssignmentHistoryDTO>> getAssignmentHistoriesByAsset(
            @PathVariable Long assetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "assignedDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(assignmentHistoryService.getAssignmentHistoriesByAsset(assetId, pageRequest));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<PageResponse<AssetAssignmentHistoryDTO>> getAssignmentHistoriesByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "assignedDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(assignmentHistoryService.getAssignmentHistoriesByUser(userId, pageRequest));
    }

    @GetMapping("/current")
    public ResponseEntity<PageResponse<AssetAssignmentHistoryDTO>> getCurrentAssignments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "assignedDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(assignmentHistoryService.getCurrentAssignments(pageRequest));
    }
} 