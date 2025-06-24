package com.inventory.system.service.impl;

import com.inventory.system.dto.OSDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.model.OS;
import com.inventory.system.repository.OSRepository;
import com.inventory.system.service.OSService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OSServiceImpl implements OSService {
    private final OSRepository osRepository;

    @Override
    @Transactional
    public OSDTO createOS(OSDTO osDTO) {
        OS os = new OS();
        updateOSFromDTO(os, osDTO);
        OS savedOS = osRepository.save(os);
        return convertToDTO(savedOS);
    }

    @Override
    @Transactional
    public OSDTO updateOS(Long id, OSDTO osDTO) {
        OS os = osRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("OS", "id", id));
        updateOSFromDTO(os, osDTO);
        OS updatedOS = osRepository.save(os);
        return convertToDTO(updatedOS);
    }

    @Override
    public OSDTO getOS(Long id) {
        OS os = osRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("OS", "id", id));
        return convertToDTO(os);
    }

    @Override
    public PageResponse<OSDTO> getAllOS(Pageable pageable) {
        Page<OS> osPage = osRepository.findAll(pageable);
        return createPageResponse(osPage);
    }

    @Override
    @Transactional
    public void deleteOS(Long id) {
        if (!osRepository.existsById(id)) {
            throw new ResourceNotFoundException("OS", "id", id);
        }
        osRepository.deleteById(id);
    }

    @Override
    public PageResponse<OSDTO> getOSByStatus(String status, Pageable pageable) {
        Page<OS> osPage = osRepository.findByStatus(status, pageable);
        return createPageResponse(osPage);
    }

    private void updateOSFromDTO(OS os, OSDTO dto) {
        os.setOsType(dto.getOsType());

        // Set status - use "Active" as default only for new entities with null status
        // Valid statuses: Active, Inactive, NotForBuying
        if (dto.getStatus() != null) {
            // Validate status
            if (!isValidStatus(dto.getStatus())) {
                throw new IllegalArgumentException("Invalid status: " + dto.getStatus() + 
                    ". Valid statuses are: Active, Inactive, NotForBuying");
            }
            os.setStatus(dto.getStatus());
        } else if (os.getId() == null) {
            // Only set default for new entities
            os.setStatus("Active");
        }
    }
    
    private boolean isValidStatus(String status) {
        return "Active".equalsIgnoreCase(status) || 
               "Inactive".equalsIgnoreCase(status) || 
               "NotForBuying".equalsIgnoreCase(status);
    }

    private OSDTO convertToDTO(OS os) {
        OSDTO dto = new OSDTO();
        dto.setId(os.getId());
        dto.setOsType(os.getOsType());
        dto.setStatus(os.getStatus());
        return dto;
    }

    private PageResponse<OSDTO> createPageResponse(Page<OS> page) {
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