package com.inventory.system.service;

import com.inventory.system.dto.OSDTO;
import com.inventory.system.dto.PageResponse;
import org.springframework.data.domain.Pageable;

public interface OSService {
    OSDTO createOS(OSDTO osDTO);
    OSDTO updateOS(Long id, OSDTO osDTO);
    OSDTO getOS(Long id);
    PageResponse<OSDTO> getAllOS(Pageable pageable);
    void deleteOS(Long id);
    
    // Status filtering method
    PageResponse<OSDTO> getOSByStatus(String status, Pageable pageable);
} 