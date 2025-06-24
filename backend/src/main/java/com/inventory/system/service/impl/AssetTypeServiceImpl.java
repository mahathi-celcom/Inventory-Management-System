package com.inventory.system.service.impl;

import com.inventory.system.dto.AssetTypeDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.model.AssetType;
import com.inventory.system.repository.AssetTypeRepository;
import com.inventory.system.service.AssetTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AssetTypeServiceImpl implements AssetTypeService {
    private final AssetTypeRepository assetTypeRepository;

    @Override
    @Transactional
    public AssetTypeDTO createAssetType(AssetTypeDTO assetTypeDTO) {
        AssetType assetType = new AssetType();
        updateAssetTypeFromDTO(assetType, assetTypeDTO);
        AssetType savedAssetType = assetTypeRepository.save(assetType);
        return convertToDTO(savedAssetType);
    }

    @Override
    @Transactional
    public AssetTypeDTO updateAssetType(Long id, AssetTypeDTO assetTypeDTO) {
        AssetType assetType = assetTypeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AssetType", "id", id));
        updateAssetTypeFromDTO(assetType, assetTypeDTO);
        AssetType updatedAssetType = assetTypeRepository.save(assetType);
        return convertToDTO(updatedAssetType);
    }

    @Override
    public AssetTypeDTO getAssetType(Long id) {
        AssetType assetType = assetTypeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AssetType", "id", id));
        return convertToDTO(assetType);
    }

    @Override
    public PageResponse<AssetTypeDTO> getAllAssetTypes(Pageable pageable) {
        Page<AssetType> assetTypePage = assetTypeRepository.findAll(pageable);
        return createPageResponse(assetTypePage);
    }

    @Override
    public List<AssetTypeDTO> getAllAssetTypesSimple() {
        List<AssetType> assetTypes = assetTypeRepository.findByStatusOrderByNameAsc("Active");
        return assetTypes.stream().map(this::convertToDTO).toList();
    }

    @Override
    @Transactional
    public void deleteAssetType(Long id) {
        if (!assetTypeRepository.existsById(id)) {
            throw new ResourceNotFoundException("AssetType", "id", id);
        }
        assetTypeRepository.deleteById(id);
    }

    @Override
    public PageResponse<AssetTypeDTO> getAssetTypesByStatus(String status, Pageable pageable) {
        Page<AssetType> assetTypePage = assetTypeRepository.findByStatus(status, pageable);
        return createPageResponse(assetTypePage);
    }

    @Override
    public List<AssetTypeDTO> getActiveAssetTypes() {
        List<AssetType> assetTypes = assetTypeRepository.findByStatusOrderByNameAsc("Active");
        return assetTypes.stream().map(this::convertToDTO).toList();
    }

    @Override
    @Transactional
    public void deactivateAssetType(Long id) {
        AssetType assetType = assetTypeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AssetType", "id", id));
        assetType.setStatus("Inactive");
        assetTypeRepository.save(assetType);
    }

    @Override
    @Transactional
    public void activateAssetType(Long id) {
        AssetType assetType = assetTypeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AssetType", "id", id));
        assetType.setStatus("Active");
        assetTypeRepository.save(assetType);
    }

    // Category-related methods implementation
    @Override
    public PageResponse<AssetTypeDTO> getAssetTypesByCategory(String assetCategory, Pageable pageable) {
        Page<AssetType> assetTypePage = assetTypeRepository.findByAssetCategoryIgnoreCase(assetCategory, pageable);
        return createPageResponse(assetTypePage);
    }

    @Override
    public List<AssetTypeDTO> getAssetTypesByCategory(String assetCategory) {
        List<AssetType> assetTypes = assetTypeRepository.findByAssetCategoryIgnoreCase(assetCategory);
        return assetTypes.stream().map(this::convertToDTO).toList();
    }

    @Override
    public List<AssetTypeDTO> getActiveAssetTypesByCategory(String assetCategory) {
        List<AssetType> assetTypes = assetTypeRepository.findByAssetCategoryIgnoreCaseAndStatusOrderByNameAsc(assetCategory, "Active");
        return assetTypes.stream().map(this::convertToDTO).toList();
    }

    @Override
    public PageResponse<AssetTypeDTO> getAssetTypesByCategoryAndStatus(String assetCategory, String status, Pageable pageable) {
        Page<AssetType> assetTypePage = assetTypeRepository.findByAssetCategoryIgnoreCaseAndStatus(assetCategory, status, pageable);
        return createPageResponse(assetTypePage);
    }

    @Override
    public List<AssetTypeDTO> getAssetTypesByCategoryAndStatus(String assetCategory, String status) {
        List<AssetType> assetTypes = assetTypeRepository.findByAssetCategoryIgnoreCaseAndStatus(assetCategory, status);
        return assetTypes.stream().map(this::convertToDTO).toList();
    }

    private void updateAssetTypeFromDTO(AssetType assetType, AssetTypeDTO dto) {
        assetType.setName(dto.getName());
        assetType.setDescription(dto.getDescription());
        
        // Handle assetCategory - normalize to proper case
        if (dto.getAssetCategory() != null) {
            String normalizedCategory = normalizeCategory(dto.getAssetCategory());
            assetType.setAssetCategory(normalizedCategory);
        }
        
        if (dto.getStatus() != null) {
            assetType.setStatus(dto.getStatus());
        }
    }

    private String normalizeCategory(String category) {
        if (category == null) return null;
        
        String trimmed = category.trim();
        if ("hardware".equalsIgnoreCase(trimmed)) {
            return "Hardware";
        } else if ("software".equalsIgnoreCase(trimmed)) {
            return "Software";
        }
        return trimmed; // Return as-is if it doesn't match known values
    }

    private AssetTypeDTO convertToDTO(AssetType assetType) {
        AssetTypeDTO dto = new AssetTypeDTO();
        dto.setId(assetType.getId());
        dto.setName(assetType.getName());
        dto.setDescription(assetType.getDescription());
        dto.setAssetCategory(assetType.getAssetCategory());
        dto.setStatus(assetType.getStatus());
        return dto;
    }

    private PageResponse<AssetTypeDTO> createPageResponse(Page<AssetType> page) {
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