package com.inventory.system.service.impl;

import com.inventory.system.dto.AssetModelDTO;
import com.inventory.system.dto.AssetModelDetailsDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.model.AssetMake;
import com.inventory.system.model.AssetModel;
import com.inventory.system.repository.AssetMakeRepository;
import com.inventory.system.repository.AssetModelRepository;
import com.inventory.system.service.AssetModelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetModelServiceImpl implements AssetModelService {
    private final AssetModelRepository assetModelRepository;
    private final AssetMakeRepository assetMakeRepository;

    @Override
    @Transactional
    public AssetModelDTO createAssetModel(AssetModelDTO assetModelDTO) {
        log.info("Creating asset model: {}", assetModelDTO);
        
        // Validate input
        if (assetModelDTO == null) {
            throw new IllegalArgumentException("AssetModelDTO cannot be null");
        }
        
        if (assetModelDTO.getMakeId() == null) {
            throw new IllegalArgumentException("Make ID is required");
        }
        
        if (assetModelDTO.getName() == null || assetModelDTO.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Model name is required");
        }
        
        try {
            AssetModel assetModel = new AssetModel();
            updateAssetModelFromDTO(assetModel, assetModelDTO);
            AssetModel savedAssetModel = assetModelRepository.save(assetModel);
            log.info("Successfully created asset model with ID: {}", savedAssetModel.getId());
            return convertToDTO(savedAssetModel);
        } catch (ResourceNotFoundException e) {
            log.error("AssetMake not found with ID: {}", assetModelDTO.getMakeId());
            throw e;
        } catch (Exception e) {
            log.error("Error creating asset model: ", e);
            throw new RuntimeException("Failed to create asset model: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public AssetModelDTO updateAssetModel(Long id, AssetModelDTO assetModelDTO) {
        log.info("Updating asset model with ID: {} and data: {}", id, assetModelDTO);
        
        if (id == null) {
            throw new IllegalArgumentException("Asset model ID cannot be null");
        }
        
        if (assetModelDTO == null) {
            throw new IllegalArgumentException("AssetModelDTO cannot be null");
        }
        
        try {
            AssetModel assetModel = assetModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AssetModel", "id", id));
            updateAssetModelFromDTO(assetModel, assetModelDTO);
            AssetModel updatedAssetModel = assetModelRepository.save(assetModel);
            log.info("Successfully updated asset model with ID: {}", updatedAssetModel.getId());
            return convertToDTO(updatedAssetModel);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating asset model: ", e);
            throw new RuntimeException("Failed to update asset model: " + e.getMessage(), e);
        }
    }

    @Override
    public AssetModelDTO getAssetModel(Long id) {
        log.debug("Fetching asset model with ID: {}", id);
        AssetModel assetModel = assetModelRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AssetModel", "id", id));
        return convertToDTO(assetModel);
    }

    @Override
    public AssetModelDetailsDTO getAssetModelDetails(Long id) {
        log.debug("Fetching asset model details with ID: {}", id);
        AssetModel assetModel = assetModelRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AssetModel", "id", id));
        return convertToDetailsDTO(assetModel);
    }

    @Override
    public PageResponse<AssetModelDTO> getAllAssetModels(Pageable pageable) {
        log.debug("Fetching all asset models with pageable: {}", pageable);
        Page<AssetModel> assetModelPage = assetModelRepository.findAll(pageable);
        return createPageResponse(assetModelPage);
    }

    @Override
    public PageResponse<AssetModelDTO> getAssetModelsByMake(Long makeId, Pageable pageable) {
        log.debug("Fetching asset models by make ID: {} with pageable: {}", makeId, pageable);
        // Verify make exists
        if (!assetMakeRepository.existsById(makeId)) {
            throw new ResourceNotFoundException("AssetMake", "id", makeId);
        }
        Page<AssetModel> assetModelPage = assetModelRepository.findByMakeId(makeId, pageable);
        return createPageResponse(assetModelPage);
    }

    @Override
    public List<AssetModelDTO> getAllAssetModelsByMake(Long makeId) {
        log.debug("Fetching all asset models by make ID: {}", makeId);
        // Verify make exists
        if (!assetMakeRepository.existsById(makeId)) {
            throw new ResourceNotFoundException("AssetMake", "id", makeId);
        }
        return assetModelRepository.findByMakeId(makeId).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public PageResponse<AssetModelDTO> searchAssetModels(String name, Pageable pageable) {
        log.debug("Searching asset models by name: {} with pageable: {}", name, pageable);
        Page<AssetModel> assetModelPage = assetModelRepository.findByNameContainingIgnoreCase(name, pageable);
        return createPageResponse(assetModelPage);
    }

    @Override
    public PageResponse<AssetModelDTO> searchAssetModels(String name, String status, Pageable pageable) {
        log.debug("Searching asset models by name: {} and status: {} with pageable: {}", name, status, pageable);
        Page<AssetModel> assetModelPage;
        
        if (status != null && !status.trim().isEmpty()) {
            assetModelPage = assetModelRepository.findByStatusAndNameContainingIgnoreCase(status, name, pageable);
        } else {
            assetModelPage = assetModelRepository.findByNameContainingIgnoreCase(name, pageable);
        }
        
        return createPageResponse(assetModelPage);
    }

    @Override
    public PageResponse<AssetModelDTO> getAssetModelsByStatus(String status, Pageable pageable) {
        log.debug("Fetching asset models by status: {} with pageable: {}", status, pageable);
        Page<AssetModel> assetModelPage = assetModelRepository.findByStatus(status, pageable);
        return createPageResponse(assetModelPage);
    }

    @Override
    public PageResponse<AssetModelDTO> getAssetModelsByMakeAndStatus(Long makeId, String status, Pageable pageable) {
        log.debug("Fetching asset models by make ID: {} and status: {} with pageable: {}", makeId, status, pageable);
        // Verify make exists
        if (!assetMakeRepository.existsById(makeId)) {
            throw new ResourceNotFoundException("AssetMake", "id", makeId);
        }
        Page<AssetModel> assetModelPage = assetModelRepository.findByStatusAndMakeId(status, makeId, pageable);
        return createPageResponse(assetModelPage);
    }

    @Override
    @Transactional
    public void deleteAssetModel(Long id) {
        log.info("Deleting asset model with ID: {}", id);
        if (!assetModelRepository.existsById(id)) {
            throw new ResourceNotFoundException("AssetModel", "id", id);
        }
        assetModelRepository.deleteById(id);
        log.info("Successfully deleted asset model with ID: {}", id);
    }

    private void updateAssetModelFromDTO(AssetModel assetModel, AssetModelDTO dto) {
        log.debug("Updating asset model entity from DTO: {}", dto);
        
        if (dto.getMakeId() == null) {
            throw new IllegalArgumentException("Make ID cannot be null");
        }
        
        AssetMake assetMake = assetMakeRepository.findById(dto.getMakeId())
            .orElseThrow(() -> new ResourceNotFoundException("AssetMake", "id", dto.getMakeId()));
        
        assetModel.setMake(assetMake);
        assetModel.setName(dto.getName() != null ? dto.getName().trim() : null);
        assetModel.setRam(dto.getRam() != null ? dto.getRam().trim() : null);
        assetModel.setStorage(dto.getStorage() != null ? dto.getStorage().trim() : null);
        assetModel.setProcessor(dto.getProcessor() != null ? dto.getProcessor().trim() : null);
        
        // Status handling - Valid statuses: Active, Inactive, NotForBuying
        if (dto.getStatus() != null) {
            // Validate status
            if (!isValidStatus(dto.getStatus())) {
                throw new IllegalArgumentException("Invalid status: " + dto.getStatus() + 
                    ". Valid statuses are: Active, Inactive, NotForBuying");
            }
            assetModel.setStatus(dto.getStatus());
        } else {
            assetModel.setStatus("Active");
        }
        
        log.debug("Updated asset model entity: name={}, makeId={}", assetModel.getName(), assetModel.getMake().getId());
    }

    private AssetModelDTO convertToDTO(AssetModel assetModel) {
        if (assetModel == null) {
            return null;
        }
        
        AssetModelDTO dto = new AssetModelDTO();
        dto.setId(assetModel.getId());
        
        // Null safety check for make
        if (assetModel.getMake() != null) {
            dto.setMakeId(assetModel.getMake().getId());
        } else {
            log.warn("AssetModel with ID {} has null make", assetModel.getId());
        }
        
        dto.setName(assetModel.getName());
        dto.setRam(assetModel.getRam());
        dto.setStorage(assetModel.getStorage());
        dto.setProcessor(assetModel.getProcessor());
        dto.setStatus(assetModel.getStatus());
        
        return dto;
    }

    private AssetModelDetailsDTO convertToDetailsDTO(AssetModel assetModel) {
        if (assetModel == null) {
            return null;
        }
        
        AssetModelDetailsDTO dto = new AssetModelDetailsDTO();
        dto.setId(assetModel.getId());
        dto.setName(assetModel.getName());
        dto.setRam(assetModel.getRam());
        dto.setStorage(assetModel.getStorage());
        dto.setProcessor(assetModel.getProcessor());
        dto.setStatus(assetModel.getStatus());
        
        // Null safety check for make and resolve names
        if (assetModel.getMake() != null) {
            dto.setMakeId(assetModel.getMake().getId());
            dto.setMakeName(assetModel.getMake().getName());
            
            // Resolve asset type information from make
            if (assetModel.getMake().getAssetType() != null) {
                dto.setAssetTypeId(assetModel.getMake().getAssetType().getId());
                dto.setAssetTypeName(assetModel.getMake().getAssetType().getName());
            } else {
                log.warn("AssetMake with ID {} has null assetType", assetModel.getMake().getId());
            }
        } else {
            log.warn("AssetModel with ID {} has null make", assetModel.getId());
        }
        
        return dto;
    }

    private PageResponse<AssetModelDTO> createPageResponse(Page<AssetModel> page) {
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