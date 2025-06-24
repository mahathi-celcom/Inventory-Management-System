package com.inventory.system.controller;

import com.inventory.system.dto.AssetStatusHistoryDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.service.AssetStatusHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/asset-status-histories")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             allowCredentials = "true",
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class AssetStatusHistoryController {
    private final AssetStatusHistoryService statusHistoryService;

    @PostMapping
    public ResponseEntity<AssetStatusHistoryDTO> createStatusHistory(@Valid @RequestBody AssetStatusHistoryDTO statusHistoryDTO) {
        return new ResponseEntity<>(statusHistoryService.createStatusHistory(statusHistoryDTO), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetStatusHistoryDTO> getStatusHistory(@PathVariable Long id) {
        return ResponseEntity.ok(statusHistoryService.getStatusHistory(id));
    }

    @GetMapping(value = "/asset/{assetId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PageResponse<AssetStatusHistoryDTO>> getStatusHistoriesByAssetId(
            @PathVariable Long assetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "changeDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        log.info("Fetching status history for asset ID: {} with page: {}, size: {}", assetId, page, size);
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        try {
            PageResponse<AssetStatusHistoryDTO> statusHistories = statusHistoryService.getStatusHistoriesByAssetId(assetId, pageRequest);
            log.info("Successfully retrieved {} status history records for asset ID: {}", 
                statusHistories.getTotalElements(), assetId);
            return ResponseEntity.ok(statusHistories);
        } catch (Exception e) {
            log.error("Error fetching status history for asset ID: {}", assetId, e);
            throw e;
        }
    }

    @GetMapping(value = "/asset/{assetId}/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<AssetStatusHistoryDTO>> getAllStatusHistoriesByAssetId(@PathVariable Long assetId) {
        log.info("Fetching all status history records for asset ID: {}", assetId);
        
        try {
            List<AssetStatusHistoryDTO> statusHistories = statusHistoryService.getStatusHistoriesByAssetId(assetId);
            log.info("Successfully retrieved {} status history records for asset ID: {}", 
                statusHistories.size(), assetId);
            return ResponseEntity.ok(statusHistories);
        } catch (Exception e) {
            log.error("Error fetching all status history for asset ID: {}", assetId, e);
            throw e;
        }
    }

    @GetMapping
    public ResponseEntity<PageResponse<AssetStatusHistoryDTO>> getAllStatusHistories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "changeDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(statusHistoryService.getAllStatusHistories(pageRequest));
    }
} 