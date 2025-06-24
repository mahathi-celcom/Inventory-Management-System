package com.inventory.system.repository;

import com.inventory.system.model.AssetTag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AssetTagRepository extends JpaRepository<AssetTag, Long> {
    Page<AssetTag> findByNameContainingIgnoreCase(String name, Pageable pageable);
    boolean existsByNameIgnoreCase(String name);
    Optional<AssetTag> findByNameIgnoreCase(String name);
} 