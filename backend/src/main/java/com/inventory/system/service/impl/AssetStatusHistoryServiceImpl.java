package com.inventory.system.service.impl;

import com.inventory.system.dto.AssetStatusHistoryDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.model.AssetStatusHistory;
import com.inventory.system.model.Asset;
import com.inventory.system.model.User;
import com.inventory.system.repository.AssetStatusHistoryRepository;
import com.inventory.system.repository.AssetRepository;
import com.inventory.system.repository.UserRepository;
import com.inventory.system.service.AssetStatusHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssetStatusHistoryServiceImpl implements AssetStatusHistoryService {
    private final AssetStatusHistoryRepository statusHistoryRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public AssetStatusHistoryDTO createStatusHistory(AssetStatusHistoryDTO statusHistoryDTO) {
        AssetStatusHistory statusHistory = new AssetStatusHistory();
        updateStatusHistoryFromDTO(statusHistory, statusHistoryDTO);
        AssetStatusHistory savedHistory = statusHistoryRepository.save(statusHistory);
        return convertToDTO(savedHistory);
    }

    @Override
    public AssetStatusHistoryDTO getStatusHistory(Long id) {
        AssetStatusHistory statusHistory = statusHistoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AssetStatusHistory", "id", id));
        return convertToDTO(statusHistory);
    }

    @Override
    public List<AssetStatusHistoryDTO> getStatusHistoriesByAssetId(Long assetId) {
        return statusHistoryRepository.findByAsset_AssetId(assetId).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public PageResponse<AssetStatusHistoryDTO> getAllStatusHistories(Pageable pageable) {
        Page<AssetStatusHistory> historyPage = statusHistoryRepository.findAll(pageable);
        return createPageResponse(historyPage);
    }

    @Override
    public PageResponse<AssetStatusHistoryDTO> getStatusHistoriesByAssetId(Long assetId, Pageable pageable) {
        Page<AssetStatusHistory> historyPage = statusHistoryRepository.findByAsset_AssetId(assetId, pageable);
        return createPageResponse(historyPage);
    }

    @Override
    public PageResponse<AssetStatusHistoryDTO> getStatusHistoriesByChangedById(Long userId, Pageable pageable) {
        Page<AssetStatusHistory> historyPage = statusHistoryRepository.findByChangedBy_Id(userId, pageable);
        return createPageResponse(historyPage);
    }

    @Override
    @Transactional
    public void deleteStatusHistory(Long id) {
        if (!statusHistoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("AssetStatusHistory", "id", id);
        }
        statusHistoryRepository.deleteById(id);
    }

    private void updateStatusHistoryFromDTO(AssetStatusHistory statusHistory, AssetStatusHistoryDTO dto) {
        statusHistory.setStatus(dto.getStatus());
        statusHistory.setRemarks(dto.getRemarks());

        if (dto.getAssetId() != null) {
            Asset asset = assetRepository.findById(dto.getAssetId())
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", dto.getAssetId()));
            statusHistory.setAsset(asset);
        }

        if (dto.getChangedById() != null) {
            User changedBy = userRepository.findById(dto.getChangedById())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", dto.getChangedById()));
            statusHistory.setChangedBy(changedBy);
        }
    }

    private AssetStatusHistoryDTO convertToDTO(AssetStatusHistory statusHistory) {
        AssetStatusHistoryDTO dto = new AssetStatusHistoryDTO();
        dto.setId(statusHistory.getId());
        dto.setAssetId(statusHistory.getAsset() != null ? statusHistory.getAsset().getAssetId() : null);
        dto.setStatus(statusHistory.getStatus());
        dto.setChangedById(statusHistory.getChangedBy() != null ? statusHistory.getChangedBy().getId() : null);
        dto.setChangeDate(statusHistory.getChangeDate());
        dto.setRemarks(statusHistory.getRemarks());
        return dto;
    }

    private PageResponse<AssetStatusHistoryDTO> createPageResponse(Page<AssetStatusHistory> page) {
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