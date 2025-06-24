package com.inventory.system.repository;

import com.inventory.system.model.Vendor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long> {
    Page<Vendor> findByNameContainingIgnoreCaseOrContactInfoContainingIgnoreCase(String name, String contactInfo, Pageable pageable);
    
    // Status-related methods
    List<Vendor> findByStatus(String status);
    Page<Vendor> findByStatus(String status, Pageable pageable);
    List<Vendor> findByStatusOrderByNameAsc(String status);
    Page<Vendor> findByStatusAndNameContainingIgnoreCase(String status, String name, Pageable pageable);
    Page<Vendor> findByStatusAndNameContainingIgnoreCaseOrStatusAndContactInfoContainingIgnoreCase(
            String status1, String name, String status2, String contactInfo, Pageable pageable);
    
    // Multi-status filtering methods
    @Query("SELECT v FROM Vendor v WHERE v.status IN :statuses")
    Page<Vendor> findByStatusIn(@Param("statuses") List<String> statuses, Pageable pageable);
    
    @Query("SELECT v FROM Vendor v WHERE v.status IN :statuses")
    List<Vendor> findByStatusIn(@Param("statuses") List<String> statuses);
    
    // Multi-status with search
    @Query("SELECT v FROM Vendor v WHERE v.status IN :statuses AND " +
           "(LOWER(v.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(v.contactInfo) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Vendor> findByStatusInAndNameOrContactInfoContaining(
            @Param("statuses") List<String> statuses, 
            @Param("searchTerm") String searchTerm, 
            Pageable pageable);
} 