package com.inventory.system.controller;

import com.inventory.system.dto.OSDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.service.OSService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;
@RestController
@RequestMapping("/api/os")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class OSController {
    private final OSService osService;

    @PostMapping
    public ResponseEntity<OSDTO> createOS(@Valid @RequestBody OSDTO osDTO) {
        return new ResponseEntity<>(osService.createOS(osDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OSDTO> updateOS(@PathVariable Long id, @Valid @RequestBody OSDTO osDTO) {
        return ResponseEntity.ok(osService.updateOS(id, osDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OSDTO> getOS(@PathVariable Long id) {
        return ResponseEntity.ok(osService.getOS(id));
    }

    @GetMapping
    public ResponseEntity<PageResponse<OSDTO>> getAllOS(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "osType") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        PageResponse<OSDTO> osList;
        if (status != null && !status.trim().isEmpty()) {
            osList = osService.getOSByStatus(status, pageRequest);
        } else {
            osList = osService.getAllOS(pageRequest);
        }
        return ResponseEntity.ok(osList);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOS(@PathVariable Long id) {
        osService.deleteOS(id);
        return ResponseEntity.noContent().build();
    }
} 