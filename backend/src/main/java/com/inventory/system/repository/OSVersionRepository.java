package com.inventory.system.repository;

import com.inventory.system.model.OSVersion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OSVersionRepository extends JpaRepository<OSVersion, Long> {
    List<OSVersion> findByOsId(Long osId);
    Page<OSVersion> findByOsId(Long osId, Pageable pageable);
    Page<OSVersion> findByVersionNumberContainingIgnoreCase(String versionNumber, Pageable pageable);
    
    // Status-related methods
    List<OSVersion> findByStatus(String status);
    Page<OSVersion> findByStatus(String status, Pageable pageable);
    Page<OSVersion> findByStatusAndVersionNumberContainingIgnoreCase(String status, String versionNumber, Pageable pageable);
    List<OSVersion> findByStatusAndOsId(String status, Long osId);
    Page<OSVersion> findByStatusAndOsId(String status, Long osId, Pageable pageable);
    List<OSVersion> findByStatusOrderByVersionNumberAsc(String status);
} 