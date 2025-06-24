package com.inventory.system.repository;

import com.inventory.system.model.Asset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface AssetRepository extends BaseRepository<Asset, Long> {
    @Query("SELECT a FROM Asset a WHERE a.deleted = false")
    Page<Asset> findAllActive(Pageable pageable);

    @Query("SELECT a FROM Asset a WHERE a.deleted = false AND " +
           "(LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.serialNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.itAssetCode) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Asset> searchAssets(@Param("search") String search, Pageable pageable);
    
    // Removed filtering queries - use frontend filtering instead
    
    @Query("SELECT COUNT(a) > 0 FROM Asset a WHERE a.deleted = false AND a.serialNumber = :serialNumber")
    boolean existsBySerialNumber(@Param("serialNumber") String serialNumber);
    
    @Query("SELECT COUNT(a) > 0 FROM Asset a WHERE a.deleted = false AND a.itAssetCode = :itAssetCode")
    boolean existsByItAssetCode(@Param("itAssetCode") String itAssetCode);
    
    @Query("SELECT COUNT(a) > 0 FROM Asset a WHERE a.deleted = false AND LOWER(a.serialNumber) = LOWER(:serialNumber)")
    boolean existsBySerialNumberIgnoreCase(@Param("serialNumber") String serialNumber);
    
    @Query("SELECT COUNT(a) > 0 FROM Asset a WHERE a.deleted = false AND LOWER(a.itAssetCode) = LOWER(:itAssetCode)")
    boolean existsByItAssetCodeIgnoreCase(@Param("itAssetCode") String itAssetCode);
    
    @Query("SELECT COUNT(a) > 0 FROM Asset a WHERE a.deleted = false AND LOWER(a.macAddress) = LOWER(:macAddress)")
    boolean existsByMacAddressIgnoreCase(@Param("macAddress") String macAddress);
    
    // Removed warranty filtering queries - use frontend filtering instead
    
    @Query("SELECT a FROM Asset a WHERE a.deleted = true")
    Page<Asset> findAllDeleted(Pageable pageable);
    
    @Override
    @NonNull Page<Asset> findAll(@NonNull Pageable pageable);
    
    @Modifying
    @Transactional
    @Query("UPDATE Asset a SET a.deleted = true, a.updatedAt = CURRENT_TIMESTAMP WHERE a.assetId = :assetId")
    void softDeleteByAssetId(@Param("assetId") Long assetId);
    
    @Modifying
    @Transactional
    @Query("UPDATE Asset a SET a.deleted = false, a.updatedAt = CURRENT_TIMESTAMP WHERE a.assetId = :assetId")
    void restoreByAssetId(@Param("assetId") Long assetId);
    
    // Bulk operations by PO number
    @Query("SELECT a FROM Asset a WHERE a.deleted = false AND a.poNumber = :poNumber")
    List<Asset> findByPoNumber(@Param("poNumber") String poNumber);
    
    @Modifying
    @Query("UPDATE Asset a SET a.poNumber = :newPoNumber WHERE a.poNumber = :oldPoNumber")
    int updateAssetPoReferences(@Param("oldPoNumber") String oldPoNumber, @Param("newPoNumber") String newPoNumber);
    
    @Modifying
    @Query("UPDATE Asset a SET " +
           "a.poNumber = :newPoNumber, " +
           "a.invoiceNumber = :invoiceNumber, " +
           "a.acquisitionDate = :acquisitionDate, " +
           "a.ownerType = :ownerType, " +
           "a.leaseEndDate = :leaseEndDate, " +
           "a.rentalAmount = :rentalAmount, " +
           "a.minContractPeriod = :minContractPeriod, " +
           "a.acquisitionPrice = :acquisitionPrice, " +
           "a.depreciationPct = :depreciationPct, " +
           "a.currentPrice = :currentPrice " +
           "WHERE a.poNumber = :oldPoNumber")
    int synchronizeAssetFields(
        @Param("oldPoNumber") String oldPoNumber,
        @Param("newPoNumber") String newPoNumber,
        @Param("invoiceNumber") String invoiceNumber,
        @Param("acquisitionDate") LocalDate acquisitionDate,
        @Param("ownerType") String ownerType,
        @Param("leaseEndDate") LocalDate leaseEndDate,
        @Param("rentalAmount") BigDecimal rentalAmount,
        @Param("minContractPeriod") Integer minContractPeriod,
        @Param("acquisitionPrice") BigDecimal acquisitionPrice,
        @Param("depreciationPct") BigDecimal depreciationPct,
        @Param("currentPrice") BigDecimal currentPrice
    );
    
    // Case-insensitive duplicate checks excluding current asset (for updates)
    @Query("SELECT COUNT(a) > 0 FROM Asset a WHERE a.deleted = false AND LOWER(a.serialNumber) = LOWER(:serialNumber) AND a.assetId != :assetId")
    boolean existsBySerialNumberIgnoreCaseAndAssetIdNot(@Param("serialNumber") String serialNumber, @Param("assetId") Long assetId);
    
    @Query("SELECT COUNT(a) > 0 FROM Asset a WHERE a.deleted = false AND LOWER(a.itAssetCode) = LOWER(:itAssetCode) AND a.assetId != :assetId")
    boolean existsByItAssetCodeIgnoreCaseAndAssetIdNot(@Param("itAssetCode") String itAssetCode, @Param("assetId") Long assetId);
    
    @Query("SELECT COUNT(a) > 0 FROM Asset a WHERE a.deleted = false AND LOWER(a.macAddress) = LOWER(:macAddress) AND a.assetId != :assetId")
    boolean existsByMacAddressIgnoreCaseAndAssetIdNot(@Param("macAddress") String macAddress, @Param("assetId") Long assetId);
    
    // Additional methods for Asset Assignment Management
    @Query("SELECT a FROM Asset a WHERE a.deleted = false")
    Page<Asset> findByDeletedFalse(Pageable pageable);
    
    @Query("SELECT a FROM Asset a WHERE a.deleted = false AND " +
           "(LOWER(a.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(a.serialNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(a.itAssetCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Asset> findByDeletedFalseAndSearchTerm(@Param("searchTerm") String searchTerm, Pageable pageable);
} 