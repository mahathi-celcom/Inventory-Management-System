package com.inventory.system.service;

import com.inventory.system.dto.OSVersionDTO;
import com.inventory.system.dto.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface OSVersionService {
    OSVersionDTO createOSVersion(OSVersionDTO osVersionDTO);
    OSVersionDTO updateOSVersion(Long id, OSVersionDTO osVersionDTO);
    OSVersionDTO getOSVersion(Long id);
    List<OSVersionDTO> getOSVersionsByOsId(Long osId);
    PageResponse<OSVersionDTO> getAllOSVersions(Pageable pageable);
    PageResponse<OSVersionDTO> getOSVersionsByOSId(Long osId, Pageable pageable);
    PageResponse<OSVersionDTO> searchOSVersions(String searchTerm, Pageable pageable);
    PageResponse<OSVersionDTO> searchOSVersions(String searchTerm, String status, Pageable pageable);
    void deleteOSVersion(Long id);
    
    // Status filtering methods
    PageResponse<OSVersionDTO> getOSVersionsByStatus(String status, Pageable pageable);
    PageResponse<OSVersionDTO> getOSVersionsByOSIdAndStatus(Long osId, String status, Pageable pageable);
} 