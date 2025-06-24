package com.inventory.system.service.impl;

import com.inventory.system.dto.AssetMakeDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.model.AssetMake;
import com.inventory.system.model.AssetType;
import com.inventory.system.repository.AssetMakeRepository;
import com.inventory.system.repository.AssetTypeRepository;
import com.inventory.system.service.AssetMakeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AssetMakeServiceImpl implements AssetMakeService {
    private final AssetMakeRepository assetMakeRepository;
    private final AssetTypeRepository assetTypeRepository;

    @Override
    @Transactional
    public AssetMakeDTO createAssetMake(AssetMakeDTO assetMakeDTO) {
        AssetMake assetMake = new AssetMake();
        updateAssetMakeFromDTO(assetMake, assetMakeDTO);
        AssetMake savedAssetMake = assetMakeRepository.save(assetMake);
        return convertToDTO(savedAssetMake);
    }

    @Override
    @Transactional
    public AssetMakeDTO updateAssetMake(Long id, AssetMakeDTO assetMakeDTO) {
        AssetMake assetMake = assetMakeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AssetMake", "id", id));
        updateAssetMakeFromDTO(assetMake, assetMakeDTO);
        AssetMake updatedAssetMake = assetMakeRepository.save(assetMake);
        return convertToDTO(updatedAssetMake);
    }

    @Override
    public AssetMakeDTO getAssetMake(Long id) {
        AssetMake assetMake = assetMakeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AssetMake", "id", id));
        return convertToDTO(assetMake);
    }

    @Override
    public PageResponse<AssetMakeDTO> getAllAssetMakes(Pageable pageable) {
        Page<AssetMake> assetMakePage = assetMakeRepository.findAll(pageable);
        return createPageResponse(assetMakePage);
    }

    @Override
    public PageResponse<AssetMakeDTO> searchAssetMakes(String name, Pageable pageable) {
        Page<AssetMake> assetMakePage = assetMakeRepository.findByNameContainingIgnoreCase(name, pageable);
        return createPageResponse(assetMakePage);
    }

    @Override
    public PageResponse<AssetMakeDTO> searchAssetMakes(String name, String status, Pageable pageable) {
        Page<AssetMake> assetMakePage;
        
        if (status != null && !status.trim().isEmpty()) {
            assetMakePage = assetMakeRepository.findByStatusAndNameContainingIgnoreCase(status, name, pageable);
        } else {
            assetMakePage = assetMakeRepository.findByNameContainingIgnoreCase(name, pageable);
        }
        
        return createPageResponse(assetMakePage);
    }

    @Override
    public PageResponse<AssetMakeDTO> getAssetMakesByType(Long typeId, Pageable pageable) {
        // Validate that the asset type exists
        if (!assetTypeRepository.existsById(typeId)) {
            throw new ResourceNotFoundException("AssetType", "id", typeId);
        }
        Page<AssetMake> assetMakePage = assetMakeRepository.findByAssetTypeId(typeId, pageable);
        return createPageResponse(assetMakePage);
    }

    @Override
    public PageResponse<AssetMakeDTO> searchAssetMakesByType(String name, Long typeId, Pageable pageable) {
        // Validate that the asset type exists
        if (!assetTypeRepository.existsById(typeId)) {
            throw new ResourceNotFoundException("AssetType", "id", typeId);
        }
        Page<AssetMake> assetMakePage = assetMakeRepository.findByNameContainingIgnoreCaseAndAssetTypeId(name, typeId, pageable);
        return createPageResponse(assetMakePage);
    }

    @Override
    @Transactional
    public void deleteAssetMake(Long id) {
        if (!assetMakeRepository.existsById(id)) {
            throw new ResourceNotFoundException("AssetMake", "id", id);
        }
        assetMakeRepository.deleteById(id);
    }

    @Override
    public List<AssetMakeDTO> getAllAssetMakesByType(Long typeId) {
        // Validate that the asset type exists
        if (!assetTypeRepository.existsById(typeId)) {
            throw new ResourceNotFoundException("AssetType", "id", typeId);
        }
        List<AssetMake> assetMakes = assetMakeRepository.findByAssetTypeId(typeId);
        return assetMakes.stream().map(this::convertToDTO).toList();
    }

    @Override
    public PageResponse<AssetMakeDTO> getAssetMakesByStatus(String status, Pageable pageable) {
        Page<AssetMake> assetMakePage = assetMakeRepository.findByStatus(status, pageable);
        return createPageResponse(assetMakePage);
    }

    private void updateAssetMakeFromDTO(AssetMake assetMake, AssetMakeDTO dto) {
        assetMake.setName(dto.getName());
        
        // Handle asset type relationship
        if (dto.getTypeId() != null) {
            AssetType assetType = assetTypeRepository.findById(dto.getTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("AssetType", "id", dto.getTypeId()));
            assetMake.setAssetType(assetType);
        } else {
            assetMake.setAssetType(null);
        }
    }

    private AssetMakeDTO convertToDTO(AssetMake assetMake) {
        AssetMakeDTO dto = new AssetMakeDTO();
        dto.setId(assetMake.getId());
        dto.setName(assetMake.getName());
        dto.setTypeId(assetMake.getAssetType() != null ? assetMake.getAssetType().getId() : null);
        return dto;
    }

    private PageResponse<AssetMakeDTO> createPageResponse(Page<AssetMake> page) {
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