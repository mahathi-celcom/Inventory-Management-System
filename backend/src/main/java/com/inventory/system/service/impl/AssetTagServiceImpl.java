package com.inventory.system.service.impl;

import com.inventory.system.dto.AssetTagDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.model.AssetTag;
import com.inventory.system.repository.AssetTagRepository;
import com.inventory.system.service.AssetTagService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AssetTagServiceImpl implements AssetTagService {
    private final AssetTagRepository tagRepository;

    @Override
    @Transactional
    public AssetTagDTO createTag(AssetTagDTO tagDTO) {
        if (tagRepository.existsByNameIgnoreCase(tagDTO.getName())) {
            throw new IllegalArgumentException("Tag name already exists");
        }
        AssetTag tag = new AssetTag();
        updateTagFromDTO(tag, tagDTO);
        AssetTag savedTag = tagRepository.save(tag);
        return convertToDTO(savedTag);
    }

    @Override
    @Transactional
    public AssetTagDTO updateTag(Long id, AssetTagDTO tagDTO) {
        AssetTag tag = tagRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AssetTag", "id", id));

        if (!tag.getName().equalsIgnoreCase(tagDTO.getName()) &&
            tagRepository.existsByNameIgnoreCase(tagDTO.getName())) {
            throw new IllegalArgumentException("Tag name already exists");
        }

        updateTagFromDTO(tag, tagDTO);
        AssetTag updatedTag = tagRepository.save(tag);
        return convertToDTO(updatedTag);
    }

    @Override
    public AssetTagDTO getTag(Long id) {
        AssetTag tag = tagRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AssetTag", "id", id));
        return convertToDTO(tag);
    }

    @Override
    public PageResponse<AssetTagDTO> getAllTags(Pageable pageable) {
        Page<AssetTag> tagPage = tagRepository.findAll(pageable);
        return createPageResponse(tagPage);
    }

    @Override
    public PageResponse<AssetTagDTO> searchTags(String searchTerm, Pageable pageable) {
        Page<AssetTag> tagPage = tagRepository.findByNameContainingIgnoreCase(searchTerm, pageable);
        return createPageResponse(tagPage);
    }

    @Override
    @Transactional
    public void deleteTag(Long id) {
        if (!tagRepository.existsById(id)) {
            throw new ResourceNotFoundException("AssetTag", "id", id);
        }
        tagRepository.deleteById(id);
    }

    @Override
    public boolean existsByName(String name) {
        return tagRepository.existsByNameIgnoreCase(name);
    }

    @Override
    public Optional<AssetTagDTO> findByName(String name) {
        return tagRepository.findByNameIgnoreCase(name)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional
    public AssetTagDTO findOrCreateByName(String name) {
        Optional<AssetTag> existingTag = tagRepository.findByNameIgnoreCase(name);
        
        if (existingTag.isPresent()) {
            return convertToDTO(existingTag.get());
        }
        
        // Create new tag if it doesn't exist
        AssetTagDTO newTagDTO = new AssetTagDTO();
        newTagDTO.setName(name);
        
        AssetTag tag = new AssetTag();
        updateTagFromDTO(tag, newTagDTO);
        AssetTag savedTag = tagRepository.save(tag);
        
        return convertToDTO(savedTag);
    }

    private void updateTagFromDTO(AssetTag tag, AssetTagDTO dto) {
        tag.setName(dto.getName());
    }

    private AssetTagDTO convertToDTO(AssetTag tag) {
        AssetTagDTO dto = new AssetTagDTO();
        dto.setId(tag.getId());
        dto.setName(tag.getName());
        return dto;
    }

    private PageResponse<AssetTagDTO> createPageResponse(Page<AssetTag> page) {
        return new PageResponse<>(
            page.getContent().stream().map(this::convertToDTO).toList(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.isLast(),
            page.isFirst()
        );
    }
} 