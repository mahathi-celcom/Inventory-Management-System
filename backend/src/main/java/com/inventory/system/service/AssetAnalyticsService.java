package com.inventory.system.service;

import com.inventory.system.dto.AssetAnalyticsSummaryDTO;
import com.inventory.system.dto.AssetReportDTO;
import org.springframework.core.io.ByteArrayResource;

import java.util.List;

public interface AssetAnalyticsService {
    
    /**
     * Get comprehensive analytics summary for dashboard
     * @return Analytics summary with all dashboard data
     */
    AssetAnalyticsSummaryDTO getAnalyticsSummary();
    
    /**
     * Get asset aging data with optional filters
     * @param department Optional department filter
     * @param assetType Optional asset type filter
     * @return List of asset aging data
     */
    List<AssetAnalyticsSummaryDTO.AssetAgingDTO> getAssetAging(String department, String assetType);
    
    /**
     * Get detailed asset list for a specific age range
     * @param ageRange The age range to filter by
     * @param department Optional department filter
     * @param assetType Optional asset type filter
     * @return List of detailed assets in the age range
     */
    List<AssetReportDTO> getAssetsByAgeRange(String ageRange, String department, String assetType);
    
    /**
     * Generate CSV report for assets
     * @param ageRange Optional age range filter
     * @param department Optional department filter
     * @param assetType Optional asset type filter
     * @return ByteArrayResource containing CSV data
     */
    ByteArrayResource generateCSVReport(String ageRange, String department, String assetType);
    
    /**
     * Get all assets for CSV export (no filters)
     * @return ByteArrayResource containing CSV data
     */
    ByteArrayResource generateFullCSVReport();
} 