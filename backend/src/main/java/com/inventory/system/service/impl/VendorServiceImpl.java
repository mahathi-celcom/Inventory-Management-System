package com.inventory.system.service.impl;

import com.inventory.system.dto.VendorDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.model.Vendor;
import com.inventory.system.repository.VendorRepository;
import com.inventory.system.service.VendorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VendorServiceImpl implements VendorService {
    private final VendorRepository vendorRepository;

    @Override
    @Transactional
    public VendorDTO createVendor(VendorDTO vendorDTO) {
        log.info("Creating new vendor with name: {}", vendorDTO.getName());
        
        Vendor vendor = new Vendor();
        updateVendorFromDTO(vendor, vendorDTO);
        
        Vendor savedVendor = vendorRepository.save(vendor);
        log.info("Vendor created successfully with ID: {} and name: {}", savedVendor.getId(), savedVendor.getName());
        
        return convertToDTO(savedVendor);
    }

    @Override
    @Transactional
    public VendorDTO updateVendor(Long id, VendorDTO vendorDTO) {
        log.info("Updating vendor with ID: {} - Input DTO: name={}, contactInfo={}, status={}", 
                 id, vendorDTO.getName(), vendorDTO.getContactInfo(), vendorDTO.getStatus());
        
        // Fetch existing vendor
        Vendor existingVendor = vendorRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Vendor not found with ID: {}", id);
                return new ResourceNotFoundException("Vendor", "id", id);
            });
        
        log.debug("Found existing vendor: id={}, name={}, contactInfo={}, status={}", 
                 existingVendor.getId(), existingVendor.getName(), 
                 existingVendor.getContactInfo(), existingVendor.getStatus());
        
        // Update vendor fields
        updateVendorFromDTO(existingVendor, vendorDTO);
        
        log.debug("Updated vendor fields: name={}, contactInfo={}, status={}", 
                 existingVendor.getName(), existingVendor.getContactInfo(), existingVendor.getStatus());
        
        try {
            // Save changes
            Vendor updatedVendor = vendorRepository.save(existingVendor);
            log.info("Vendor updated successfully with ID: {} - Final state: name={}, contactInfo={}, status={}", 
                    updatedVendor.getId(), updatedVendor.getName(), 
                    updatedVendor.getContactInfo(), updatedVendor.getStatus());
            
        return convertToDTO(updatedVendor);
        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation while updating vendor with ID: {}", id, e);
            throw e; // Let global exception handler deal with this
        } catch (Exception e) {
            log.error("Unexpected error while updating vendor with ID: {}", id, e);
            throw new RuntimeException("Failed to update vendor: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public VendorDTO getVendor(Long id) {
        log.debug("Fetching vendor with ID: {}", id);
        
        Vendor vendor = vendorRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Vendor not found with ID: {}", id);
                return new ResourceNotFoundException("Vendor", "id", id);
            });
        
        log.debug("Found vendor: id={}, name={}, status={}", vendor.getId(), vendor.getName(), vendor.getStatus());
        return convertToDTO(vendor);
    }

    @Override
    public PageResponse<VendorDTO> getAllVendors(Pageable pageable) {
        log.debug("Fetching all vendors without status filter");
        Page<Vendor> vendorPage = vendorRepository.findAll(pageable);
        return createPageResponse(vendorPage);
    }

    @Override
    public PageResponse<VendorDTO> searchVendors(String searchTerm, Pageable pageable) {
        log.debug("Searching vendors with term: {} (all statuses)", searchTerm);
        Page<Vendor> vendorPage = vendorRepository.findByNameContainingIgnoreCaseOrContactInfoContainingIgnoreCase(searchTerm, searchTerm, pageable);
        return createPageResponse(vendorPage);
    }

    @Override
    public PageResponse<VendorDTO> searchVendors(String searchTerm, String status, Pageable pageable) {
        log.debug("Searching vendors with term: {} and status: {}", searchTerm, status);
        Page<Vendor> vendorPage;
        
        if (status != null && !status.trim().isEmpty()) {
            vendorPage = vendorRepository.findByStatusAndNameContainingIgnoreCaseOrStatusAndContactInfoContainingIgnoreCase(
                    status, searchTerm, status, searchTerm, pageable);
        } else {
            vendorPage = vendorRepository.findByNameContainingIgnoreCaseOrContactInfoContainingIgnoreCase(searchTerm, searchTerm, pageable);
        }
        
        return createPageResponse(vendorPage);
    }

    @Override
    @Transactional
    public void deleteVendor(Long id) {
        log.info("Attempting to delete vendor with ID: {}", id);
        
        // Check if vendor exists
        Vendor vendor = vendorRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Cannot delete vendor - Vendor not found with ID: {}", id);
                return new ResourceNotFoundException("Vendor", "id", id);
            });
        
        log.debug("Found vendor to delete: id={}, name={}, status={}", 
                 vendor.getId(), vendor.getName(), vendor.getStatus());
        
        try {
            // Check for foreign key constraints by attempting the delete
        vendorRepository.deleteById(id);
            log.info("Vendor deleted successfully with ID: {}", id);
            
        } catch (DataIntegrityViolationException e) {
            log.error("Cannot delete vendor with ID: {} due to foreign key constraints. " +
                     "This vendor is referenced by other entities (assets, POs, etc.)", id, e);
            throw e; // Let global exception handler deal with this
        } catch (Exception e) {
            log.error("Unexpected error while deleting vendor with ID: {}", id, e);
            throw new RuntimeException("Failed to delete vendor: " + e.getMessage(), e);
        }
    }

    @Override
    public PageResponse<VendorDTO> getVendorsByStatus(String status, Pageable pageable) {
        Page<Vendor> vendorPage = vendorRepository.findByStatus(status, pageable);
        return createPageResponse(vendorPage);
    }

    @Override
    public List<VendorDTO> getActiveVendors() {
        List<Vendor> vendors = vendorRepository.findByStatusOrderByNameAsc("Active");
        return vendors.stream().map(this::convertToDTO).toList();
    }

    @Override
    @Transactional
    public void deactivateVendor(Long id) {
        log.info("Deactivating vendor with ID: {}", id);
        
        Vendor vendor = vendorRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Cannot deactivate vendor - Vendor not found with ID: {}", id);
                return new ResourceNotFoundException("Vendor", "id", id);
            });
        
        log.debug("Current vendor status: {}", vendor.getStatus());
        vendor.setStatus("Inactive");
        vendorRepository.save(vendor);
        
        log.info("Vendor deactivated successfully with ID: {}", id);
    }

    @Override
    @Transactional
    public void activateVendor(Long id) {
        log.info("Activating vendor with ID: {}", id);
        
        Vendor vendor = vendorRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Cannot activate vendor - Vendor not found with ID: {}", id);
                return new ResourceNotFoundException("Vendor", "id", id);
            });
        
        log.debug("Current vendor status: {}", vendor.getStatus());
        vendor.setStatus("Active");
        vendorRepository.save(vendor);
        
        log.info("Vendor activated successfully with ID: {}", id);
    }

    private void updateVendorFromDTO(Vendor vendor, VendorDTO dto) {
        log.debug("Updating vendor fields from DTO - name: {}, contactInfo: {}, status: {}", 
                 dto.getName(), dto.getContactInfo(), dto.getStatus());
        
        if (dto.getName() != null) {
            vendor.setName(dto.getName().trim());
        }
        
        if (dto.getContactInfo() != null) {
            vendor.setContactInfo(dto.getContactInfo().trim());
        }
        
        // Valid statuses: Active, Inactive, NotForBuying
        if (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) {
            // Validate status
            if (!isValidStatus(dto.getStatus())) {
                throw new IllegalArgumentException("Invalid status: " + dto.getStatus() + 
                    ". Valid statuses are: Active, Inactive, NotForBuying");
            }
            vendor.setStatus(dto.getStatus().trim());
        } else if (vendor.getStatus() == null) {
            // Set default status if not provided and entity doesn't have one
            vendor.setStatus("Active");
        }
        
        log.debug("Vendor fields updated - name: {}, contactInfo: {}, status: {}", 
                 vendor.getName(), vendor.getContactInfo(), vendor.getStatus());
    }

    private VendorDTO convertToDTO(Vendor vendor) {
        if (vendor == null) {
            return null;
        }
        
        VendorDTO dto = new VendorDTO();
        dto.setId(vendor.getId());
        dto.setName(vendor.getName());
        dto.setContactInfo(vendor.getContactInfo());
        dto.setStatus(vendor.getStatus());
        
        log.debug("Converted vendor to DTO - id: {}, name: {}, status: {}", 
                 dto.getId(), dto.getName(), dto.getStatus());
        
        return dto;
    }

    private PageResponse<VendorDTO> createPageResponse(Page<Vendor> page) {
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
    
    @Override
    public PageResponse<VendorDTO> getVendorsByStatuses(String statusParam, Pageable pageable) {
        log.debug("Fetching vendors by statuses: {}", statusParam);
        
        if (statusParam == null || statusParam.trim().isEmpty()) {
            return getAllVendors(pageable);
        }
        
        // Handle "ALL" case - return all vendors
        if ("ALL".equalsIgnoreCase(statusParam.trim())) {
            return getAllVendors(pageable);
        }
        
        // Parse multiple statuses (comma-separated)
        List<String> statuses = parseStatusParameters(statusParam);
        
        // Validate all statuses
        for (String status : statuses) {
            if (!isValidStatus(status)) {
                throw new IllegalArgumentException("Invalid status: " + status + 
                    ". Valid statuses are: Active, Inactive, NotForBuying");
            }
        }
        
        Page<Vendor> vendorPage;
        if (statuses.size() == 1) {
            // Single status - use existing method
            vendorPage = vendorRepository.findByStatus(statuses.get(0), pageable);
        } else {
            // Multiple statuses - use new method
            vendorPage = vendorRepository.findByStatusIn(statuses, pageable);
        }
        
        return createPageResponse(vendorPage);
    }
    
    @Override
    public PageResponse<VendorDTO> searchVendorsByStatuses(String searchTerm, String statusParam, Pageable pageable) {
        log.debug("Searching vendors with term: {} and statuses: {}", searchTerm, statusParam);
        
        if (statusParam == null || statusParam.trim().isEmpty()) {
            return searchVendors(searchTerm, pageable);
        }
        
        // Handle "ALL" case - search all vendors
        if ("ALL".equalsIgnoreCase(statusParam.trim())) {
            return searchVendors(searchTerm, pageable);
        }
        
        // Parse multiple statuses (comma-separated)
        List<String> statuses = parseStatusParameters(statusParam);
        
        // Validate all statuses
        for (String status : statuses) {
            if (!isValidStatus(status)) {
                throw new IllegalArgumentException("Invalid status: " + status + 
                    ". Valid statuses are: Active, Inactive, NotForBuying");
            }
        }
        
        Page<Vendor> vendorPage;
        if (statuses.size() == 1) {
            // Single status - use existing method
            vendorPage = vendorRepository.findByStatusAndNameContainingIgnoreCaseOrStatusAndContactInfoContainingIgnoreCase(
                    statuses.get(0), searchTerm, statuses.get(0), searchTerm, pageable);
        } else {
            // Multiple statuses - use new method
            vendorPage = vendorRepository.findByStatusInAndNameOrContactInfoContaining(
                    statuses, searchTerm, pageable);
        }
        
        return createPageResponse(vendorPage);
    }
    
    private List<String> parseStatusParameters(String statusParam) {
        return Arrays.stream(statusParam.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
} 