package com.inventory.system.service.impl;

import com.inventory.system.dto.OSVersionDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.model.OSVersion;
import com.inventory.system.model.OS;
import com.inventory.system.repository.OSVersionRepository;
import com.inventory.system.repository.OSRepository;
import com.inventory.system.service.OSVersionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OSVersionServiceImpl implements OSVersionService {
    private final OSVersionRepository osVersionRepository;
    private final OSRepository osRepository;

    @Override
    @Transactional
    public OSVersionDTO createOSVersion(OSVersionDTO osVersionDTO) {
        OSVersion osVersion = new OSVersion();
        updateOSVersionFromDTO(osVersion, osVersionDTO);
        OSVersion savedOSVersion = osVersionRepository.save(osVersion);
        return convertToDTO(savedOSVersion);
    }

    @Override
    @Transactional
    public OSVersionDTO updateOSVersion(Long id, OSVersionDTO osVersionDTO) {
        OSVersion osVersion = osVersionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("OSVersion", "id", id));
        updateOSVersionFromDTO(osVersion, osVersionDTO);
        OSVersion updatedOSVersion = osVersionRepository.save(osVersion);
        return convertToDTO(updatedOSVersion);
    }

    @Override
    public OSVersionDTO getOSVersion(Long id) {
        OSVersion osVersion = osVersionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("OSVersion", "id", id));
        return convertToDTO(osVersion);
    }

    @Override
    public List<OSVersionDTO> getOSVersionsByOsId(Long osId) {
        return osVersionRepository.findByOsId(osId).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public PageResponse<OSVersionDTO> getAllOSVersions(Pageable pageable) {
        Page<OSVersion> osVersionPage = osVersionRepository.findAll(pageable);
        return createPageResponse(osVersionPage);
    }

    @Override
    public PageResponse<OSVersionDTO> searchOSVersions(String searchTerm, Pageable pageable) {
        Page<OSVersion> osVersionPage = osVersionRepository.findByVersionNumberContainingIgnoreCase(searchTerm, pageable);
        return createPageResponse(osVersionPage);
    }

    @Override
    @Transactional
    public void deleteOSVersion(Long id) {
        if (!osVersionRepository.existsById(id)) {
            throw new ResourceNotFoundException("OSVersion", "id", id);
        }
        osVersionRepository.deleteById(id);
    }

    @Override
    public PageResponse<OSVersionDTO> getOSVersionsByOSId(Long osId, Pageable pageable) {
        Page<OSVersion> osVersionPage = osVersionRepository.findByOsId(osId, pageable);
        return createPageResponse(osVersionPage);
    }

    @Override
    public PageResponse<OSVersionDTO> searchOSVersions(String searchTerm, String status, Pageable pageable) {
        Page<OSVersion> osVersionPage;
        
        if (status != null && !status.trim().isEmpty()) {
            osVersionPage = osVersionRepository.findByStatusAndVersionNumberContainingIgnoreCase(status, searchTerm, pageable);
        } else {
            osVersionPage = osVersionRepository.findByVersionNumberContainingIgnoreCase(searchTerm, pageable);
        }
        
        return createPageResponse(osVersionPage);
    }

    @Override
    public PageResponse<OSVersionDTO> getOSVersionsByStatus(String status, Pageable pageable) {
        Page<OSVersion> osVersionPage = osVersionRepository.findByStatus(status, pageable);
        return createPageResponse(osVersionPage);
    }

    @Override
    public PageResponse<OSVersionDTO> getOSVersionsByOSIdAndStatus(Long osId, String status, Pageable pageable) {
        Page<OSVersion> osVersionPage = osVersionRepository.findByStatusAndOsId(status, osId, pageable);
        return createPageResponse(osVersionPage);
    }

    private void updateOSVersionFromDTO(OSVersion osVersion, OSVersionDTO dto) {
        osVersion.setVersionNumber(dto.getVersionNumber());
        
        // Set status - use "Active" as default only for new entities with null status
        // Valid statuses: Active, Inactive, NotForBuying
        if (dto.getStatus() != null) {
            // Validate status
            if (!isValidStatus(dto.getStatus())) {
                throw new IllegalArgumentException("Invalid status: " + dto.getStatus() + 
                    ". Valid statuses are: Active, Inactive, NotForBuying");
            }
            osVersion.setStatus(dto.getStatus());
        } else if (osVersion.getId() == null) {
            // Only set default for new entities
            osVersion.setStatus("Active");
        }

        if (dto.getOsId() != null) {
            OS os = osRepository.findById(dto.getOsId())
                .orElseThrow(() -> new ResourceNotFoundException("OS", "id", dto.getOsId()));
            osVersion.setOs(os);
        } else {
            osVersion.setOs(null);
        }
    }

    private OSVersionDTO convertToDTO(OSVersion osVersion) {
        OSVersionDTO dto = new OSVersionDTO();
        dto.setId(osVersion.getId());
        dto.setOsId(osVersion.getOs() != null ? osVersion.getOs().getId() : null);
        dto.setVersionNumber(osVersion.getVersionNumber());
        dto.setStatus(osVersion.getStatus());
        return dto;
    }

    private PageResponse<OSVersionDTO> createPageResponse(Page<OSVersion> page) {
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