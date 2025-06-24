package com.inventory.system.controller;

import com.inventory.system.dto.AssetTagDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.service.AssetTagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api/asset-tags")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             allowCredentials = "true",
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class AssetTagController {
    private final AssetTagService assetTagService;

    @PostMapping
    public ResponseEntity<AssetTagDTO> createTag(@Valid @RequestBody AssetTagDTO tagDTO) {
        return new ResponseEntity<>(assetTagService.createTag(tagDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetTagDTO> updateTag(@PathVariable Long id, @Valid @RequestBody AssetTagDTO tagDTO) {
        return ResponseEntity.ok(assetTagService.updateTag(id, tagDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetTagDTO> getTag(@PathVariable Long id) {
        return ResponseEntity.ok(assetTagService.getTag(id));
    }

    @GetMapping
    public ResponseEntity<PageResponse<AssetTagDTO>> getAllTags(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(assetTagService.getAllTags(pageRequest));
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<AssetTagDTO>> searchTags(
            @RequestParam String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(assetTagService.searchTags(searchTerm, pageRequest));
    }

    @GetMapping("/exists")
    public ResponseEntity<Boolean> existsByName(@RequestParam String name) {
        return ResponseEntity.ok(assetTagService.existsByName(name));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        assetTagService.deleteTag(id);
        return ResponseEntity.noContent().build();
    }
} 