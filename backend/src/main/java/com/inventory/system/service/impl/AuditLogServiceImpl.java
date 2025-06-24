package com.inventory.system.service.impl;

import com.inventory.system.dto.AuditLogDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.model.AuditLog;
import com.inventory.system.model.Asset;
import com.inventory.system.model.User;
import com.inventory.system.repository.AuditLogRepository;
import com.inventory.system.repository.AssetRepository;
import com.inventory.system.repository.UserRepository;
import com.inventory.system.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {
    private final AuditLogRepository auditLogRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public AuditLogDTO createLog(AuditLogDTO logDTO) {
        AuditLog log = new AuditLog();
        updateLogFromDTO(log, logDTO);
        AuditLog savedLog = auditLogRepository.save(log);
        return convertToDTO(savedLog);
    }

    @Override
    public AuditLogDTO getLog(Long id) {
        AuditLog log = auditLogRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AuditLog", "id", id));
        return convertToDTO(log);
    }

    @Override
    public List<AuditLogDTO> getLogsByAssetId(Long assetId) {
        return auditLogRepository.findByAsset_AssetId(assetId).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public PageResponse<AuditLogDTO> getAllLogs(Pageable pageable) {
        Page<AuditLog> logPage = auditLogRepository.findAll(pageable);
        return createPageResponse(logPage);
    }

    @Override
    public PageResponse<AuditLogDTO> getLogsByAssetId(Long assetId, Pageable pageable) {
        Page<AuditLog> logPage = auditLogRepository.findByAsset_AssetId(assetId, pageable);
        return createPageResponse(logPage);
    }

    @Override
    public PageResponse<AuditLogDTO> getLogsByUserId(Long userId, Pageable pageable) {
        Page<AuditLog> logPage = auditLogRepository.findByUser_Id(userId, pageable);
        return createPageResponse(logPage);
    }

    @Override
    public PageResponse<AuditLogDTO> getLogsByAction(String action, Pageable pageable) {
        Page<AuditLog> logPage = auditLogRepository.findByAction(action, pageable);
        return createPageResponse(logPage);
    }

    @Override
    @Transactional
    public void deleteLog(Long id) {
        if (!auditLogRepository.existsById(id)) {
            throw new ResourceNotFoundException("AuditLog", "id", id);
        }
        auditLogRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void logAssetAction(Asset asset, User user, String action, String details) {
        AuditLogDTO logDTO = new AuditLogDTO();
        logDTO.setAssetId(asset.getAssetId());
        logDTO.setUserId(user != null ? user.getId() : null);
        logDTO.setAction(action);
        logDTO.setDetails(details);
        createLog(logDTO);
    }

    private void updateLogFromDTO(AuditLog log, AuditLogDTO dto) {
        log.setAction(dto.getAction());
        log.setDetails(dto.getDetails());

        if (dto.getAssetId() != null) {
            Asset asset = assetRepository.findById(dto.getAssetId())
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", dto.getAssetId()));
            log.setAsset(asset);
        }

        if (dto.getUserId() != null) {
            User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", dto.getUserId()));
            log.setUser(user);
        }
    }

    private AuditLogDTO convertToDTO(AuditLog log) {
        AuditLogDTO dto = new AuditLogDTO();
        dto.setId(log.getId());
        dto.setAssetId(log.getAsset() != null ? log.getAsset().getAssetId() : null);
        dto.setUserId(log.getUser() != null ? log.getUser().getId() : null);
        dto.setAction(log.getAction());
        dto.setActionDate(log.getActionDate());
        dto.setDetails(log.getDetails());
        return dto;
    }

    private PageResponse<AuditLogDTO> createPageResponse(Page<AuditLog> page) {
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