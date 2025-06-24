package com.inventory.system.controller;

import com.inventory.system.dto.VendorDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.service.VendorService;
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
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             allowCredentials = "true",
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
public class VendorController {
    private final VendorService vendorService;

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<VendorDTO> createVendor(@Valid @RequestBody VendorDTO vendorDTO) {
        log.info("Creating vendor with name: {}", vendorDTO.getName());
        VendorDTO createdVendor = vendorService.createVendor(vendorDTO);
        log.info("Vendor created successfully with ID: {}", createdVendor.getId());
        return new ResponseEntity<>(createdVendor, HttpStatus.CREATED);
    }

    @PutMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<VendorDTO> updateVendor(@PathVariable Long id, @Valid @RequestBody VendorDTO vendorDTO) {
        log.info("Updating vendor with ID: {}", id);
        VendorDTO updatedVendor = vendorService.updateVendor(id, vendorDTO);
        log.info("Vendor updated successfully with ID: {}", updatedVendor.getId());
        return ResponseEntity.ok(updatedVendor);
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<VendorDTO> getVendor(@PathVariable Long id) {
        log.debug("Fetching vendor with ID: {}", id);
        VendorDTO vendor = vendorService.getVendor(id);
        return ResponseEntity.ok(vendor);
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PageResponse<VendorDTO>> getAllVendors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status) {
        
        log.debug("Fetching vendors: page={}, size={}, sortBy={}, sortDir={}, status={}", 
                 page, size, sortBy, sortDir, status);
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        // Use new enhanced status filtering that supports multi-status and ALL
        PageResponse<VendorDTO> vendors = vendorService.getVendorsByStatuses(status, pageRequest);
        return ResponseEntity.ok(vendors);
    }

    @GetMapping(value = "/active", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<VendorDTO>> getActiveVendors() {
        log.info("Fetching all active vendors - DEBUG");
        List<VendorDTO> activeVendors = vendorService.getActiveVendors();
        log.info("Found {} active vendors - DEBUG", activeVendors.size());
        
        // Debug logging for each vendor
        activeVendors.forEach(vendor -> 
            log.info("Vendor ID: {}, Name: '{}', Status: '{}'", 
                vendor.getId(), vendor.getName(), vendor.getStatus())
        );
        
        return ResponseEntity.ok(activeVendors);
    }

    @GetMapping(value = "/search", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PageResponse<VendorDTO>> searchVendors(
            @RequestParam String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status) {
        
        log.debug("Searching vendors with term: {}, status: {}", searchTerm, status);
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        // Use new enhanced status filtering that supports multi-status and ALL
        PageResponse<VendorDTO> vendors = vendorService.searchVendorsByStatuses(searchTerm, status, pageRequest);
        return ResponseEntity.ok(vendors);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVendor(@PathVariable Long id) {
        log.info("Deleting vendor with ID: {}", id);
        vendorService.deleteVendor(id);
        log.info("Vendor deleted successfully with ID: {}", id);
        // Return 204 No Content with no body to avoid serialization issues
        return ResponseEntity.noContent().build();
    }

    @PatchMapping(value = "/{id}/activate", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<VendorDTO> activateVendor(@PathVariable Long id) {
        log.info("Activating vendor with ID: {}", id);
        vendorService.activateVendor(id);
        
        // Return the updated vendor to provide feedback
        VendorDTO updatedVendor = vendorService.getVendor(id);
        log.info("Vendor activated successfully with ID: {}", id);
        return ResponseEntity.ok(updatedVendor);
    }

    @PatchMapping(value = "/{id}/deactivate", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<VendorDTO> deactivateVendor(@PathVariable Long id) {
        log.info("Deactivating vendor with ID: {}", id);
        vendorService.deactivateVendor(id);
        
        // Return the updated vendor to provide feedback
        VendorDTO updatedVendor = vendorService.getVendor(id);
        log.info("Vendor deactivated successfully with ID: {}", id);
        return ResponseEntity.ok(updatedVendor);
    }
} 