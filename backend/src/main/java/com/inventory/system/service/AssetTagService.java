package com.inventory.system.service;

import com.inventory.system.dto.AssetTagDTO;
import com.inventory.system.dto.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface AssetTagService {
    AssetTagDTO createTag(AssetTagDTO tagDTO);
    AssetTagDTO updateTag(Long id, AssetTagDTO tagDTO);
    AssetTagDTO getTag(Long id);
    PageResponse<AssetTagDTO> getAllTags(Pageable pageable);
    PageResponse<AssetTagDTO> searchTags(String searchTerm, Pageable pageable);
    void deleteTag(Long id);
    boolean existsByName(String name);
    Optional<AssetTagDTO> findByName(String name);
    AssetTagDTO findOrCreateByName(String name);
} 