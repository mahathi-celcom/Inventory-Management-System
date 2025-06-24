package com.inventory.system.controller;

import com.inventory.system.dto.OSVersionDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.service.OSVersionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api/os-versions")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             allowCredentials = "true",
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class OSVersionController {
    private final OSVersionService osVersionService;

    @PostMapping
    public ResponseEntity<OSVersionDTO> createOSVersion(@Valid @RequestBody OSVersionDTO osVersionDTO) {
        return new ResponseEntity<>(osVersionService.createOSVersion(osVersionDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OSVersionDTO> updateOSVersion(
            @PathVariable Long id,
            @Valid @RequestBody OSVersionDTO osVersionDTO) {
        return ResponseEntity.ok(osVersionService.updateOSVersion(id, osVersionDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OSVersionDTO> getOSVersion(@PathVariable Long id) {
        return ResponseEntity.ok(osVersionService.getOSVersion(id));
    }

    @GetMapping
    public ResponseEntity<PageResponse<OSVersionDTO>> getAllOSVersions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        PageResponse<OSVersionDTO> osVersions;
        if (status != null && !status.trim().isEmpty()) {
            osVersions = osVersionService.getOSVersionsByStatus(status, pageRequest);
        } else {
            osVersions = osVersionService.getAllOSVersions(pageRequest);
        }
        return ResponseEntity.ok(osVersions);
    }

    @GetMapping("/os/{osId}")
    public ResponseEntity<PageResponse<OSVersionDTO>> getOSVersionsByOSId(
            @PathVariable Long osId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        PageResponse<OSVersionDTO> osVersions;
        if (status != null && !status.trim().isEmpty()) {
            osVersions = osVersionService.getOSVersionsByOSIdAndStatus(osId, status, pageRequest);
        } else {
            osVersions = osVersionService.getOSVersionsByOSId(osId, pageRequest);
        }
        return ResponseEntity.ok(osVersions);
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<OSVersionDTO>> searchOSVersions(
            @RequestParam String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(osVersionService.searchOSVersions(searchTerm, status, pageRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOSVersion(@PathVariable Long id) {
        osVersionService.deleteOSVersion(id);
        return ResponseEntity.noContent().build();
    }
} 