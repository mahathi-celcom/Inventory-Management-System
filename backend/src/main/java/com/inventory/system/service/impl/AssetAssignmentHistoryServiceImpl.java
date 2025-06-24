package com.inventory.system.service.impl;

import com.inventory.system.dto.AssetAssignmentHistoryDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.model.Asset;
import com.inventory.system.model.AssetAssignmentHistory;
import com.inventory.system.model.User;
import com.inventory.system.repository.AssetAssignmentHistoryRepository;
import com.inventory.system.repository.AssetRepository;
import com.inventory.system.repository.UserRepository;
import com.inventory.system.service.AssetAssignmentHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssetAssignmentHistoryServiceImpl implements AssetAssignmentHistoryService {
    private final AssetAssignmentHistoryRepository assignmentHistoryRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public AssetAssignmentHistoryDTO createAssignmentHistory(AssetAssignmentHistoryDTO assignmentHistoryDTO) {
        AssetAssignmentHistory assignmentHistory = new AssetAssignmentHistory();
        updateAssignmentHistoryFromDTO(assignmentHistory, assignmentHistoryDTO);
        AssetAssignmentHistory savedHistory = assignmentHistoryRepository.save(assignmentHistory);
        return convertToDTO(savedHistory);
    }

    @Override
    @Transactional
    public AssetAssignmentHistoryDTO updateAssignmentHistory(Long id, AssetAssignmentHistoryDTO assignmentHistoryDTO) {
        AssetAssignmentHistory assignmentHistory = assignmentHistoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AssetAssignmentHistory", "id", id));
        updateAssignmentHistoryFromDTO(assignmentHistory, assignmentHistoryDTO);
        AssetAssignmentHistory updatedHistory = assignmentHistoryRepository.save(assignmentHistory);
        return convertToDTO(updatedHistory);
    }

    @Override
    public AssetAssignmentHistoryDTO getAssignmentHistory(Long id) {
        AssetAssignmentHistory assignmentHistory = assignmentHistoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AssetAssignmentHistory", "id", id));
        return convertToDTO(assignmentHistory);
    }

    @Override
    public List<AssetAssignmentHistoryDTO> getAssignmentHistoriesByAssetId(Long assetId) {
        return assignmentHistoryRepository.findByAsset_AssetId(assetId).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public List<AssetAssignmentHistoryDTO> getAssignmentHistoriesByUserId(Long userId) {
        return assignmentHistoryRepository.findByUser_Id(userId).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public PageResponse<AssetAssignmentHistoryDTO> getAllAssignmentHistories(Pageable pageable) {
        Page<AssetAssignmentHistory> historyPage = assignmentHistoryRepository.findAll(pageable);
        return createPageResponse(historyPage);
    }

    @Override
    public PageResponse<AssetAssignmentHistoryDTO> getAssignmentHistoriesByAsset(Long assetId, Pageable pageable) {
        if (!assetRepository.existsById(assetId)) {
            throw new ResourceNotFoundException("Asset", "assetId", assetId);
        }
        Page<AssetAssignmentHistory> historyPage = assignmentHistoryRepository.findByAsset_AssetId(assetId, pageable);
        return createPageResponse(historyPage);
    }

    @Override
    public PageResponse<AssetAssignmentHistoryDTO> getAssignmentHistoriesByUser(Long userId, Pageable pageable) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        Page<AssetAssignmentHistory> historyPage = assignmentHistoryRepository.findByUser_Id(userId, pageable);
        return createPageResponse(historyPage);
    }

    @Override
    public PageResponse<AssetAssignmentHistoryDTO> getCurrentAssignments(Pageable pageable) {
        Page<AssetAssignmentHistory> historyPage = assignmentHistoryRepository.findByUnassignedDateIsNull(pageable);
        return createPageResponse(historyPage);
    }

    @Override
    @Transactional
    public void deleteAssignmentHistory(Long id) {
        if (!assignmentHistoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("AssetAssignmentHistory", "id", id);
        }
        assignmentHistoryRepository.deleteById(id);
    }

    private void updateAssignmentHistoryFromDTO(AssetAssignmentHistory assignmentHistory, AssetAssignmentHistoryDTO dto) {
        Asset asset = assetRepository.findById(dto.getAssetId())
            .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", dto.getAssetId()));
        User user = userRepository.findById(dto.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", dto.getUserId()));

        assignmentHistory.setAsset(asset);
        assignmentHistory.setUser(user);
        assignmentHistory.setAssignedDate(dto.getAssignedDate());
        assignmentHistory.setUnassignedDate(dto.getUnassignedDate());
    }

    private AssetAssignmentHistoryDTO convertToDTO(AssetAssignmentHistory assignmentHistory) {
        AssetAssignmentHistoryDTO dto = new AssetAssignmentHistoryDTO();
        dto.setId(assignmentHistory.getId());
        dto.setAssetId(assignmentHistory.getAsset().getAssetId());
        dto.setUserId(assignmentHistory.getUser().getId());
        dto.setAssignedDate(assignmentHistory.getAssignedDate());
        dto.setUnassignedDate(assignmentHistory.getUnassignedDate());
        return dto;
    }

    private PageResponse<AssetAssignmentHistoryDTO> createPageResponse(Page<AssetAssignmentHistory> page) {
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