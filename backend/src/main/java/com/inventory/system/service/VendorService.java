package com.inventory.system.service;

import com.inventory.system.dto.VendorDTO;
import com.inventory.system.dto.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface VendorService {
    VendorDTO createVendor(VendorDTO vendorDTO);
    VendorDTO updateVendor(Long id, VendorDTO vendorDTO);
    VendorDTO getVendor(Long id);
    PageResponse<VendorDTO> getAllVendors(Pageable pageable);
    PageResponse<VendorDTO> searchVendors(String searchTerm, Pageable pageable);
    PageResponse<VendorDTO> searchVendors(String searchTerm, String status, Pageable pageable);
    void deleteVendor(Long id);
    
    // Status-related methods
    PageResponse<VendorDTO> getVendorsByStatus(String status, Pageable pageable);
    PageResponse<VendorDTO> getVendorsByStatuses(String statusParam, Pageable pageable);
    PageResponse<VendorDTO> searchVendorsByStatuses(String searchTerm, String statusParam, Pageable pageable);
    List<VendorDTO> getActiveVendors();
    void deactivateVendor(Long id);
    void activateVendor(Long id);
} 