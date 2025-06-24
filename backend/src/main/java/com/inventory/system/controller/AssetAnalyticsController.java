package com.inventory.system.controller;

import com.inventory.system.dto.AssetAnalyticsSummaryDTO;
import com.inventory.system.dto.AssetReportDTO;
import com.inventory.system.service.AssetAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET})
public class AssetAnalyticsController {
    
    private final AssetAnalyticsService analyticsService;
    
    @GetMapping("/summary")
    public ResponseEntity<AssetAnalyticsSummaryDTO> getAnalyticsSummary() {
        log.info("Fetching comprehensive analytics summary");
        
        try {
            AssetAnalyticsSummaryDTO summary = analyticsService.getAnalyticsSummary();
            log.info("Successfully retrieved analytics summary");
            return ResponseEntity.ok(summary);
            
        } catch (Exception e) {
            log.error("Error fetching analytics summary: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/aging")
    public ResponseEntity<List<AssetAnalyticsSummaryDTO.AssetAgingDTO>> getAssetAging(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String assetType) {
        
        log.info("Fetching asset aging data with filters - department: {}, assetType: {}", department, assetType);
        
        try {
            List<AssetAnalyticsSummaryDTO.AssetAgingDTO> agingData = analyticsService.getAssetAging(department, assetType);
            log.info("Successfully retrieved {} aging records", agingData.size());
            return ResponseEntity.ok(agingData);
            
        } catch (Exception e) {
            log.error("Error fetching asset aging data: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/assets/age-range/{ageRange}")
    public ResponseEntity<List<AssetReportDTO>> getAssetsByAgeRange(
            @PathVariable String ageRange,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String assetType) {
        
        log.info("Fetching assets for age range: {} with filters - department: {}, assetType: {}", 
                ageRange, department, assetType);
        
        try {
            List<AssetReportDTO> assets = analyticsService.getAssetsByAgeRange(ageRange, department, assetType);
            log.info("Successfully retrieved {} assets for age range: {}", assets.size(), ageRange);
            return ResponseEntity.ok(assets);
            
        } catch (Exception e) {
            log.error("Error fetching assets by age range: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> generateCSVReport(
            @RequestParam(required = false) String ageRange,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String assetType) {
        
        log.info("Generating CSV report with filters - ageRange: {}, department: {}, assetType: {}", 
                ageRange, department, assetType);
        
        try {
            ByteArrayResource csvData = analyticsService.generateCSVReport(ageRange, department, assetType);
            
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
            String filename = "asset_report_" + timestamp + ".csv";
            
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename);
            headers.add(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8");
            
            log.info("Successfully generated CSV report: {}", filename);
            return ResponseEntity.ok()
                .headers(headers)
                .contentLength(csvData.contentLength())
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
                
        } catch (Exception e) {
            log.error("Error generating CSV report: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/export/csv/full")
    public ResponseEntity<ByteArrayResource> generateFullCSVReport() {
        log.info("Generating full CSV report");
        
        try {
            ByteArrayResource csvData = analyticsService.generateFullCSVReport();
            
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
            String filename = "full_asset_report_" + timestamp + ".csv";
            
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename);
            headers.add(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8");
            
            log.info("Successfully generated full CSV report: {}", filename);
            return ResponseEntity.ok()
                .headers(headers)
                .contentLength(csvData.contentLength())
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
                
        } catch (Exception e) {
            log.error("Error generating full CSV report: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/status-summary")
    public ResponseEntity<Object> getAssetStatusSummary() {
        log.info("Fetching asset status summary");
        
        try {
            AssetAnalyticsSummaryDTO summary = analyticsService.getAnalyticsSummary();
            return ResponseEntity.ok(summary.getAssetCountByStatus());
            
        } catch (Exception e) {
            log.error("Error fetching asset status summary: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/os-summary")
    public ResponseEntity<Object> getAssetOSSummary() {
        log.info("Fetching asset OS summary");
        
        try {
            AssetAnalyticsSummaryDTO summary = analyticsService.getAnalyticsSummary();
            return ResponseEntity.ok(summary.getAssetCountByOS());
            
        } catch (Exception e) {
            log.error("Error fetching asset OS summary: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/warranty-summary")
    public ResponseEntity<Object> getWarrantySummary() {
        log.info("Fetching warranty summary");
        
        try {
            AssetAnalyticsSummaryDTO summary = analyticsService.getAnalyticsSummary();
            return ResponseEntity.ok(summary.getWarrantyStatusByAssetType());
            
        } catch (Exception e) {
            log.error("Error fetching warranty summary: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/department-type-summary")
    public ResponseEntity<Object> getDepartmentTypeSummary() {
        log.info("Fetching department and type summary");
        
        try {
            AssetAnalyticsSummaryDTO summary = analyticsService.getAnalyticsSummary();
            return ResponseEntity.ok(summary.getAssetCountByDepartmentAndType());
            
        } catch (Exception e) {
            log.error("Error fetching department and type summary: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
