package com.inventory.system.repository;

import com.inventory.system.model.OS;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OSRepository extends JpaRepository<OS, Long> {
    // All methods that referenced 'name', 'type', 'description', and 'active' fields have been removed
    // as these fields no longer exist in the OS entity

    // Status-related methods
    List<OS> findByStatus(String status);
    Page<OS> findByStatus(String status, Pageable pageable);
    List<OS> findByStatusOrderByOsTypeAsc(String status);
} 