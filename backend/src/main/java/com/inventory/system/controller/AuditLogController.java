package com.inventory.system.controller;

import com.inventory.system.dto.AuditLogDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.service.AuditLogService;
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
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             allowCredentials = "true",
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class AuditLogController {
    private final AuditLogService auditLogService;

    @PostMapping
    public ResponseEntity<AuditLogDTO> createLog(@Valid @RequestBody AuditLogDTO logDTO) {
        return new ResponseEntity<>(auditLogService.createLog(logDTO), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditLogDTO> getLog(@PathVariable Long id) {
        return ResponseEntity.ok(auditLogService.getLog(id));
    }

    @GetMapping
    public ResponseEntity<PageResponse<AuditLogDTO>> getAllLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "actionDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(auditLogService.getAllLogs(pageRequest));
    }

    @GetMapping("/asset/{assetId}")
    public ResponseEntity<List<AuditLogDTO>> getLogsByAssetId(@PathVariable Long assetId) {
        return ResponseEntity.ok(auditLogService.getLogsByAssetId(assetId));
    }

    @GetMapping("/asset/{assetId}/paged")
    public ResponseEntity<PageResponse<AuditLogDTO>> getLogsByAssetIdPaged(
            @PathVariable Long assetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "actionDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(auditLogService.getLogsByAssetId(assetId, pageRequest));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<PageResponse<AuditLogDTO>> getLogsByUserId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "actionDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(auditLogService.getLogsByUserId(userId, pageRequest));
    }

    @GetMapping("/action/{action}")
    public ResponseEntity<PageResponse<AuditLogDTO>> getLogsByAction(
            @PathVariable String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "actionDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(auditLogService.getLogsByAction(action, pageRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLog(@PathVariable Long id) {
        auditLogService.deleteLog(id);
        return ResponseEntity.noContent().build();
    }
} 