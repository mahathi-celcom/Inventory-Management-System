package com.inventory.system.service;

import com.inventory.system.dto.AssetStatusHistoryDTO;
import com.inventory.system.dto.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AssetStatusHistoryService {
    AssetStatusHistoryDTO createStatusHistory(AssetStatusHistoryDTO statusHistoryDTO);
    AssetStatusHistoryDTO getStatusHistory(Long id);
    List<AssetStatusHistoryDTO> getStatusHistoriesByAssetId(Long assetId);
    PageResponse<AssetStatusHistoryDTO> getAllStatusHistories(Pageable pageable);
    PageResponse<AssetStatusHistoryDTO> getStatusHistoriesByAssetId(Long assetId, Pageable pageable);
    PageResponse<AssetStatusHistoryDTO> getStatusHistoriesByChangedById(Long userId, Pageable pageable);
    void deleteStatusHistory(Long id);
} 