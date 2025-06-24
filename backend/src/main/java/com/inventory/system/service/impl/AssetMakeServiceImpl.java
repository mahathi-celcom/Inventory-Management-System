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
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
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
        log.info("Updating AssetMake with ID: {} - Input DTO: name={}, status={}, typeId={}", 
                 id, assetMakeDTO.getName(), assetMakeDTO.getStatus(), assetMakeDTO.getTypeId());
        
        AssetMake assetMake = assetMakeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AssetMake", "id", id));
        
        log.debug("Found existing AssetMake: id={}, name={}, status={}", 
                 assetMake.getId(), assetMake.getName(), assetMake.getStatus());
        
        updateAssetMakeFromDTO(assetMake, assetMakeDTO);
        
        log.debug("Updated AssetMake fields: name={}, status={}", 
                 assetMake.getName(), assetMake.getStatus());
        
        AssetMake updatedAssetMake = assetMakeRepository.save(assetMake);
        
        log.info("AssetMake updated successfully with ID: {} - Final state: name={}, status={}", 
                updatedAssetMake.getId(), updatedAssetMake.getName(), updatedAssetMake.getStatus());
        
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
        
        // Status handling - Valid statuses: Active, Inactive, NotForBuying
        if (dto.getStatus() != null) {
            // Validate status
            if (!isValidStatus(dto.getStatus())) {
                throw new IllegalArgumentException("Invalid status: " + dto.getStatus() + 
                    ". Valid statuses are: Active, Inactive, NotForBuying");
            }
            assetMake.setStatus(dto.getStatus());
        } else {
            assetMake.setStatus("Active");
        }
    }

    private AssetMakeDTO convertToDTO(AssetMake assetMake) {
        AssetMakeDTO dto = new AssetMakeDTO();
        dto.setId(assetMake.getId());
        dto.setName(assetMake.getName());
        dto.setStatus(assetMake.getStatus());
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
    
    private boolean isValidStatus(String status) {
        return "Active".equalsIgnoreCase(status) || 
               "Inactive".equalsIgnoreCase(status) || 
               "NotForBuying".equalsIgnoreCase(status);
    }
} 