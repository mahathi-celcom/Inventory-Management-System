package com.inventory.system.repository;

import com.inventory.system.model.AssetPO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssetPORepository extends JpaRepository<AssetPO, Long> {
    
    // Find by PO Number
    @Query("SELECT a FROM AssetPO a WHERE a.poNumber = :poNumber")
    Optional<AssetPO> findByPoNumber(@Param("poNumber") String poNumber);
    
    @Query("SELECT COUNT(a) > 0 FROM AssetPO a WHERE a.poNumber = :poNumber AND a.id != :id")
    boolean existsByPoNumberAndIdNot(@Param("poNumber") String poNumber, @Param("id") Long id);
    
    // Search methods
    Page<AssetPO> findByPoNumberContainingIgnoreCaseOrInvoiceNumberContainingIgnoreCase(
            String poNumber, String invoiceNumber, Pageable pageable);
    
    // Removed filtering methods - use frontend filtering instead
    
    // Rented items expiring soon (updated to use 'Rented' instead of 'Leased')
    @Query("SELECT a FROM AssetPO a WHERE a.acquisitionType = 'Rented' AND a.leaseEndDate BETWEEN :startDate AND :endDate")
    List<AssetPO> findRentalsExpiringBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Removed complex filtering query - use frontend filtering instead
    
    // Get distinct PO numbers
    @Query("SELECT DISTINCT a.poNumber FROM AssetPO a WHERE a.poNumber IS NOT NULL ORDER BY a.poNumber")
    List<String> findDistinctPoNumbers();
    
    // Update PO primary key safely using native SQL
    @Modifying
    @Query(value = "UPDATE asset_po SET po_number = :newPoNumber WHERE po_number = :oldPoNumber", nativeQuery = true)
    int updateAssetPoPrimaryKey(@Param("oldPoNumber") String oldPoNumber,
                               @Param("newPoNumber") String newPoNumber);

    @Modifying
    @Query("UPDATE AssetPO a SET " +
           "a.poNumber = :newPoNumber, " +
           "a.invoiceNumber = :invoiceNumber, " +
           "a.acquisitionDate = :acquisitionDate, " +
           "a.vendorId = :vendorId, " +
           "a.ownerType = :ownerType, " +
           "a.leaseEndDate = :leaseEndDate, " +
           "a.rentalAmount = :rentalAmount, " +
           "a.minContractPeriod = :minContractPeriod, " +
           "a.acquisitionPrice = :acquisitionPrice, " +
           "a.depreciationPct = :depreciationPct, " +
           "a.currentPrice = :currentPrice, " +
           "a.totalDevices = :totalDevices " +
           "WHERE a.id = :id")
    int updateAssetPOFields(
        @Param("id") Long id,
        @Param("newPoNumber") String newPoNumber,
        @Param("invoiceNumber") String invoiceNumber,
        @Param("acquisitionDate") LocalDate acquisitionDate,
        @Param("vendorId") Long vendorId,
        @Param("ownerType") String ownerType,
        @Param("leaseEndDate") LocalDate leaseEndDate,
        @Param("rentalAmount") BigDecimal rentalAmount,
        @Param("minContractPeriod") Integer minContractPeriod,
        @Param("acquisitionPrice") BigDecimal acquisitionPrice,
        @Param("depreciationPct") BigDecimal depreciationPct,
        @Param("currentPrice") BigDecimal currentPrice,
        @Param("totalDevices") Integer totalDevices
    );
} 