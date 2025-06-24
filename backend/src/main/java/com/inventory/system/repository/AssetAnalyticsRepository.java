package com.inventory.system.repository;

import com.inventory.system.model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AssetAnalyticsRepository extends JpaRepository<Asset, Long> {
    
    // Asset count by status
    @Query("SELECT a.status, COUNT(a) FROM Asset a WHERE a.deleted = false GROUP BY a.status")
    List<Object[]> countAssetsByStatus();
    
    // Asset count by OS type
    @Query("SELECT COALESCE(os.osType, 'No OS'), COUNT(a) FROM Asset a " +
           "LEFT JOIN a.os os WHERE a.deleted = false GROUP BY os.osType")
    List<Object[]> countAssetsByOS();
    
    // Asset count by department and asset type
    @Query("SELECT COALESCE(u.department, 'Unassigned'), COALESCE(at.name, 'Unknown'), COUNT(a) " +
           "FROM Asset a " +
           "LEFT JOIN a.currentUser u " +
           "LEFT JOIN a.assetType at " +
           "WHERE a.deleted = false " +
           "GROUP BY u.department, at.name")
    List<Object[]> countAssetsByDepartmentAndType();
    
    // Warranty status by asset type
    @Query("SELECT at.name, " +
           "SUM(CASE WHEN a.warrantyExpiry IS NOT NULL AND a.warrantyExpiry > CURRENT_DATE THEN 1 ELSE 0 END) as inWarranty, " +
           "SUM(CASE WHEN a.warrantyExpiry IS NOT NULL AND a.warrantyExpiry <= CURRENT_DATE THEN 1 ELSE 0 END) as outOfWarranty, " +
           "SUM(CASE WHEN a.warrantyExpiry IS NULL THEN 1 ELSE 0 END) as noWarranty, " +
           "COUNT(a) as totalAssets " +
           "FROM Asset a " +
           "LEFT JOIN a.assetType at " +
           "WHERE a.deleted = false " +
           "GROUP BY at.name")
    List<Object[]> getWarrantyStatusByAssetType();
    
    // Asset aging based on acquisition date
    @Query("SELECT " +
           "CASE " +
           "WHEN a.acquisitionDate IS NULL THEN 'Unknown' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 365 THEN '<1 year' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 730 THEN '1-2 years' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 1095 THEN '2-3 years' " +
           "ELSE '>3 years' " +
           "END as ageRange, " +
           "COUNT(a) " +
           "FROM Asset a " +
           "WHERE a.deleted = false " +
           "GROUP BY " +
           "CASE " +
           "WHEN a.acquisitionDate IS NULL THEN 'Unknown' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 365 THEN '<1 year' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 730 THEN '1-2 years' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 1095 THEN '2-3 years' " +
           "ELSE '>3 years' " +
           "END")
    List<Object[]> getAssetAging();
    
    // Asset aging filtered by department
    @Query("SELECT " +
           "CASE " +
           "WHEN a.acquisitionDate IS NULL THEN 'Unknown' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 365 THEN '<1 year' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 730 THEN '1-2 years' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 1095 THEN '2-3 years' " +
           "ELSE '>3 years' " +
           "END as ageRange, " +
           "COUNT(a), " +
           "COALESCE(u.department, 'Unassigned') " +
           "FROM Asset a " +
           "LEFT JOIN a.currentUser u " +
           "WHERE a.deleted = false AND (:department IS NULL OR u.department = :department) " +
           "GROUP BY " +
           "CASE " +
           "WHEN a.acquisitionDate IS NULL THEN 'Unknown' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 365 THEN '<1 year' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 730 THEN '1-2 years' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 1095 THEN '2-3 years' " +
           "ELSE '>3 years' " +
           "END, u.department")
    List<Object[]> getAssetAgingByDepartment(@Param("department") String department);
    
    // Asset aging filtered by asset type
    @Query("SELECT " +
           "CASE " +
           "WHEN a.acquisitionDate IS NULL THEN 'Unknown' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 365 THEN '<1 year' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 730 THEN '1-2 years' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 1095 THEN '2-3 years' " +
           "ELSE '>3 years' " +
           "END as ageRange, " +
           "COUNT(a), " +
           "COALESCE(at.name, 'Unknown') " +
           "FROM Asset a " +
           "LEFT JOIN a.assetType at " +
           "WHERE a.deleted = false AND (:assetTypeName IS NULL OR at.name = :assetTypeName) " +
           "GROUP BY " +
           "CASE " +
           "WHEN a.acquisitionDate IS NULL THEN 'Unknown' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 365 THEN '<1 year' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 730 THEN '1-2 years' " +
           "WHEN (CURRENT_DATE - a.acquisitionDate) < 1095 THEN '2-3 years' " +
           "ELSE '>3 years' " +
           "END, at.name")
    List<Object[]> getAssetAgingByAssetType(@Param("assetTypeName") String assetTypeName);
    
    // Get detailed assets for a specific age range
    @Query("SELECT a FROM Asset a " +
           "LEFT JOIN FETCH a.assetType " +
           "LEFT JOIN FETCH a.make " +
           "LEFT JOIN FETCH a.model " +
           "LEFT JOIN FETCH a.currentUser " +
           "LEFT JOIN FETCH a.os " +
           "LEFT JOIN FETCH a.osVersion " +
           "LEFT JOIN FETCH a.vendor " +
           "WHERE a.deleted = false AND " +
           "(:ageRange = 'Unknown' AND a.acquisitionDate IS NULL) OR " +
           "(:ageRange = '<1 year' AND a.acquisitionDate IS NOT NULL AND (CURRENT_DATE - a.acquisitionDate) < 365) OR " +
           "(:ageRange = '1-2 years' AND a.acquisitionDate IS NOT NULL AND (CURRENT_DATE - a.acquisitionDate) >= 365 AND (CURRENT_DATE - a.acquisitionDate) < 730) OR " +
           "(:ageRange = '2-3 years' AND a.acquisitionDate IS NOT NULL AND (CURRENT_DATE - a.acquisitionDate) >= 730 AND (CURRENT_DATE - a.acquisitionDate) < 1095) OR " +
           "(:ageRange = '>3 years' AND a.acquisitionDate IS NOT NULL AND (CURRENT_DATE - a.acquisitionDate) >= 1095)")
    List<Asset> getAssetsByAgeRange(@Param("ageRange") String ageRange);
    
    // Get detailed assets for a specific age range filtered by department
    @Query("SELECT a FROM Asset a " +
           "LEFT JOIN FETCH a.assetType " +
           "LEFT JOIN FETCH a.make " +
           "LEFT JOIN FETCH a.model " +
           "LEFT JOIN FETCH a.currentUser u " +
           "LEFT JOIN FETCH a.os " +
           "LEFT JOIN FETCH a.osVersion " +
           "LEFT JOIN FETCH a.vendor " +
           "WHERE a.deleted = false AND " +
           "(:department IS NULL OR u.department = :department) AND " +
           "((:ageRange = 'Unknown' AND a.acquisitionDate IS NULL) OR " +
           "(:ageRange = '<1 year' AND a.acquisitionDate IS NOT NULL AND (CURRENT_DATE - a.acquisitionDate) < 365) OR " +
           "(:ageRange = '1-2 years' AND a.acquisitionDate IS NOT NULL AND (CURRENT_DATE - a.acquisitionDate) >= 365 AND (CURRENT_DATE - a.acquisitionDate) < 730) OR " +
           "(:ageRange = '2-3 years' AND a.acquisitionDate IS NOT NULL AND (CURRENT_DATE - a.acquisitionDate) >= 730 AND (CURRENT_DATE - a.acquisitionDate) < 1095) OR " +
           "(:ageRange = '>3 years' AND a.acquisitionDate IS NOT NULL AND (CURRENT_DATE - a.acquisitionDate) >= 1095))")
    List<Asset> getAssetsByAgeRangeAndDepartment(@Param("ageRange") String ageRange, @Param("department") String department);
    
    // Get detailed assets for a specific age range filtered by asset type
    @Query("SELECT a FROM Asset a " +
           "LEFT JOIN FETCH a.assetType at " +
           "LEFT JOIN FETCH a.make " +
           "LEFT JOIN FETCH a.model " +
           "LEFT JOIN FETCH a.currentUser " +
           "LEFT JOIN FETCH a.os " +
           "LEFT JOIN FETCH a.osVersion " +
           "LEFT JOIN FETCH a.vendor " +
           "WHERE a.deleted = false AND " +
           "(:assetTypeName IS NULL OR at.name = :assetTypeName) AND " +
           "((:ageRange = 'Unknown' AND a.acquisitionDate IS NULL) OR " +
           "(:ageRange = '<1 year' AND a.acquisitionDate IS NOT NULL AND (CURRENT_DATE - a.acquisitionDate) < 365) OR " +
           "(:ageRange = '1-2 years' AND a.acquisitionDate IS NOT NULL AND (CURRENT_DATE - a.acquisitionDate) >= 365 AND (CURRENT_DATE - a.acquisitionDate) < 730) OR " +
           "(:ageRange = '2-3 years' AND a.acquisitionDate IS NOT NULL AND (CURRENT_DATE - a.acquisitionDate) >= 730 AND (CURRENT_DATE - a.acquisitionDate) < 1095) OR " +
           "(:ageRange = '>3 years' AND a.acquisitionDate IS NOT NULL AND (CURRENT_DATE - a.acquisitionDate) >= 1095))")
    List<Asset> getAssetsByAgeRangeAndAssetType(@Param("ageRange") String ageRange, @Param("assetTypeName") String assetTypeName);
    
    // Asset count by category (Hardware/Software classification)
    @Query("SELECT COALESCE(a.assetCategory, 'Unknown'), COUNT(a) " +
           "FROM Asset a WHERE a.deleted = false " +
           "GROUP BY a.assetCategory ORDER BY COUNT(a) DESC")
    List<Object[]> countAssetsByCategory();
} 