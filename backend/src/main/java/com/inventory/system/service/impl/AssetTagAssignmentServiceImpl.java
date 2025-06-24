package com.inventory.system.service.impl;

import com.inventory.system.dto.AssetTagAssignmentDTO;
import com.inventory.system.dto.AssetTagAssignmentByNameDTO;
import com.inventory.system.dto.AssetTagDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.model.Asset;
import com.inventory.system.model.AssetTag;
import com.inventory.system.model.AssetTagAssignment;
import com.inventory.system.model.AssetTagAssignmentId;
import com.inventory.system.repository.AssetRepository;
import com.inventory.system.repository.AssetTagAssignmentRepository;
import com.inventory.system.repository.AssetTagRepository;
import com.inventory.system.service.AssetTagAssignmentService;
import com.inventory.system.service.AssetTagService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AssetTagAssignmentServiceImpl implements AssetTagAssignmentService {
    private final AssetTagAssignmentRepository assignmentRepository;
    private final AssetRepository assetRepository;
    private final AssetTagRepository tagRepository;
    private final AssetTagService assetTagService;

    @Override
    @Transactional
    public AssetTagAssignmentDTO assignTag(AssetTagAssignmentDTO assignmentDTO) {
        Asset asset = assetRepository.findById(assignmentDTO.getAssetId())
            .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", assignmentDTO.getAssetId()));
        
        AssetTag tag = tagRepository.findById(assignmentDTO.getTagId())
            .orElseThrow(() -> new ResourceNotFoundException("AssetTag", "id", assignmentDTO.getTagId()));

        AssetTagAssignment assignment = new AssetTagAssignment();
        assignment.setAsset(asset);
        assignment.setTag(tag);

        AssetTagAssignment savedAssignment = assignmentRepository.save(assignment);
        return convertToDTO(savedAssignment);
    }

    @Override
    @Transactional
    public AssetTagAssignmentDTO assignTagByName(AssetTagAssignmentByNameDTO assignmentDTO) {
        // Validate asset exists
        Asset asset = assetRepository.findById(assignmentDTO.getAssetId())
            .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", assignmentDTO.getAssetId()));
        
        // Find or create tag by name
        AssetTagDTO tagDTO = assetTagService.findOrCreateByName(assignmentDTO.getTagName());
        
        // Check if assignment already exists to prevent duplicates
        if (assignmentRepository.existsByAssetIdAndTagId(assignmentDTO.getAssetId(), tagDTO.getId())) {
            throw new IllegalArgumentException("Tag '" + assignmentDTO.getTagName() + "' is already assigned to this asset");
        }
        
        // Get the tag entity
        AssetTag tag = tagRepository.findById(tagDTO.getId())
            .orElseThrow(() -> new ResourceNotFoundException("AssetTag", "id", tagDTO.getId()));
        
        // Update the tags column in asset table with the assigned tag name
        asset.setTags(tag.getName());
        assetRepository.save(asset);
        
        // Create assignment record
        AssetTagAssignment assignment = new AssetTagAssignment();
        assignment.setAsset(asset);
        assignment.setTag(tag);
        
        AssetTagAssignment savedAssignment = assignmentRepository.save(assignment);
        return convertToDTO(savedAssignment);
    }

    @Override
    @Transactional
    public void unassignTag(Long assetId, Long tagId) {
        AssetTagAssignmentId id = new AssetTagAssignmentId();
        id.setAsset(assetId);
        id.setTag(tagId);

        if (!assignmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("AssetTagAssignment", "assetId-tagId", assetId + "-" + tagId);
        }
        assignmentRepository.deleteById(id);
    }

    @Override
    public AssetTagAssignmentDTO getAssignment(Long id) {
        // Note: This method signature doesn't match the composite key structure
        // For a composite key, we'd need both assetId and tagId
        throw new UnsupportedOperationException("Use getAssignmentsByAssetId or getAssignmentsByTagId instead");
    }

    @Override
    public List<AssetTagAssignmentDTO> getAssignmentsByAssetId(Long assetId) {
        List<AssetTagAssignment> assignments = assignmentRepository.findByAsset_AssetId(assetId);
        return assignments.stream().map(this::convertToDTO).toList();
    }

    @Override
    public List<AssetTagAssignmentDTO> getAssignmentsByTagId(Long tagId) {
        List<AssetTagAssignment> assignments = assignmentRepository.findByTag_Id(tagId);
        return assignments.stream().map(this::convertToDTO).toList();
    }

    @Override
    public PageResponse<AssetTagAssignmentDTO> getAllAssignments(Pageable pageable) {
        Page<AssetTagAssignment> assignmentPage = assignmentRepository.findAll(pageable);
        return createPageResponse(assignmentPage);
    }

    @Override
    public PageResponse<AssetTagAssignmentDTO> getAssignmentsByAssetId(Long assetId, Pageable pageable) {
        List<AssetTagAssignment> assignments = assignmentRepository.findByAsset_AssetId(assetId);
        return createPageResponseFromList(assignments, pageable);
    }

    @Override
    public PageResponse<AssetTagAssignmentDTO> getAssignmentsByTagId(Long tagId, Pageable pageable) {
        List<AssetTagAssignment> assignments = assignmentRepository.findByTag_Id(tagId);
        return createPageResponseFromList(assignments, pageable);
    }

    @Override
    @Transactional
    public void deleteAssignment(Long id) {
        // Note: This method signature doesn't match the composite key structure
        throw new UnsupportedOperationException("Use unassignTag(assetId, tagId) instead");
    }

    @Override
    @Transactional
    public void deleteAssignmentsByAssetId(Long assetId) {
        assignmentRepository.deleteByAsset_AssetId(assetId);
    }

    @Override
    @Transactional
    public void deleteAssignmentsByTagId(Long tagId) {
        assignmentRepository.deleteByTag_Id(tagId);
    }

    private AssetTagAssignmentDTO convertToDTO(AssetTagAssignment assignment) {
        AssetTagAssignmentDTO dto = new AssetTagAssignmentDTO();
        dto.setAssetId(assignment.getAsset().getAssetId());
        dto.setTagId(assignment.getTag().getId());
        
        // Additional fields for frontend display
        dto.setAssetName(assignment.getAsset().getName());
        dto.setTagName(assignment.getTag().getName());
        
        // For composite key, we'll set id as a combination
        dto.setId(assignment.getAsset().getAssetId());
        return dto;
    }

    private PageResponse<AssetTagAssignmentDTO> createPageResponse(Page<AssetTagAssignment> page) {
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

    private PageResponse<AssetTagAssignmentDTO> createPageResponseFromList(List<AssetTagAssignment> assignments, Pageable pageable) {
        List<AssetTagAssignmentDTO> dtos = assignments.stream().map(this::convertToDTO).toList();
        
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), dtos.size());
        List<AssetTagAssignmentDTO> paginatedDtos = dtos.subList(start, end);
        
        Page<AssetTagAssignmentDTO> page = new PageImpl<>(paginatedDtos, pageable, dtos.size());
        
        return new PageResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.isLast(),
            page.isFirst()
        );
    }
} 