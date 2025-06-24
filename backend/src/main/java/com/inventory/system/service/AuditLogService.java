package com.inventory.system.service;

import com.inventory.system.dto.AuditLogDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.model.Asset;
import com.inventory.system.model.User;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AuditLogService {
    AuditLogDTO createLog(AuditLogDTO logDTO);
    AuditLogDTO getLog(Long id);
    List<AuditLogDTO> getLogsByAssetId(Long assetId);
    PageResponse<AuditLogDTO> getAllLogs(Pageable pageable);
    PageResponse<AuditLogDTO> getLogsByAssetId(Long assetId, Pageable pageable);
    PageResponse<AuditLogDTO> getLogsByUserId(Long userId, Pageable pageable);
    PageResponse<AuditLogDTO> getLogsByAction(String action, Pageable pageable);
    void deleteLog(Long id);
    void logAssetAction(Asset asset, User user, String action, String details);
} 