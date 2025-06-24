package com.inventory.system.service;

import com.inventory.system.dto.AssetTagAssignmentRequestDTO;
import com.inventory.system.dto.AssignmentResponseDTO;
import com.inventory.system.model.Asset;
import com.inventory.system.model.AssetTag;
import com.inventory.system.model.AssetTagAssignment;
import com.inventory.system.repository.AssetRepository;
import com.inventory.system.repository.AssetTagAssignmentRepository;
import com.inventory.system.repository.AssetTagRepository;
import com.inventory.system.service.impl.AssetAssignmentManagementServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.List;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssetTagAssignmentTest {

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private AssetTagRepository assetTagRepository;

    @Mock
    private AssetTagAssignmentRepository tagAssignmentRepository;

    @InjectMocks
    private AssetAssignmentManagementServiceImpl assignmentService;

    private Asset testAsset;
    private AssetTag testTag;
    private AssetTagAssignmentRequestDTO assignmentRequest;

    @BeforeEach
    void setUp() {
        testAsset = new Asset();
        testAsset.setAssetId(1L);
        testAsset.setName("Test Asset");
        testAsset.setAssignedTags(new java.util.HashSet<>());

        testTag = new AssetTag();
        testTag.setId(1L);
        testTag.setName("Test Tag");

        assignmentRequest = AssetTagAssignmentRequestDTO.builder()
                .assetId(1L)
                .tagId(1L)
                .build();
    }

    @Test
    void testAssignTagToAsset_CreatesTagAssignmentRecord() {
        // Arrange
        when(assetRepository.findById(1L)).thenReturn(Optional.of(testAsset));
        when(assetTagRepository.findById(1L)).thenReturn(Optional.of(testTag));
        when(tagAssignmentRepository.findByAsset_AssetId(1L)).thenReturn(new ArrayList<>());
        when(tagAssignmentRepository.existsByAssetIdAndTagId(1L, 1L)).thenReturn(false);
        when(assetRepository.save(any(Asset.class))).thenReturn(testAsset);

        // Act
        AssignmentResponseDTO response = assignmentService.assignTagToAsset(assignmentRequest);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Tag 'Test Tag' successfully assigned to asset", response.getMessage());
        assertEquals(1L, response.getAssetId());
        assertEquals(1L, response.getAssignedId());
        assertEquals("TAG", response.getAssignedType());

        // Verify that asset_tag_assignment record was saved
        verify(tagAssignmentRepository, times(1)).save(any(AssetTagAssignment.class));
        
        // Verify that duplicate check was performed
        verify(tagAssignmentRepository, times(1)).existsByAssetIdAndTagId(1L, 1L);
        
        // Verify that previous assignments were removed
        verify(tagAssignmentRepository, times(1)).findByAsset_AssetId(1L);
        verify(tagAssignmentRepository, times(1)).deleteAll(anyList());
    }

    @Test
    void testAssignTagToAsset_PreventsDuplicates() {
        // Arrange
        when(assetRepository.findById(1L)).thenReturn(Optional.of(testAsset));
        when(assetTagRepository.findById(1L)).thenReturn(Optional.of(testTag));
        when(tagAssignmentRepository.findByAsset_AssetId(1L)).thenReturn(new ArrayList<>());
        when(tagAssignmentRepository.existsByAssetIdAndTagId(1L, 1L)).thenReturn(true); // Assignment already exists
        when(assetRepository.save(any(Asset.class))).thenReturn(testAsset);

        // Act
        AssignmentResponseDTO response = assignmentService.assignTagToAsset(assignmentRequest);

        // Assert
        assertTrue(response.isSuccess());
        
        // Verify that save was not called since assignment already exists
        verify(tagAssignmentRepository, times(0)).save(any(AssetTagAssignment.class));
        
        // Verify that duplicate check was performed
        verify(tagAssignmentRepository, times(1)).existsByAssetIdAndTagId(1L, 1L);
    }

    @Test
    void testTagAssignmentTableStructure() {
        // This test verifies the table structure matches requirements
        AssetTagAssignment assignment = new AssetTagAssignment();
        assignment.setAsset(testAsset);
        assignment.setTag(testTag);

        // Verify the entity has the correct structure
        assertNotNull(assignment.getAsset());
        assertNotNull(assignment.getTag());
        assertEquals(1L, assignment.getAsset().getAssetId());
        assertEquals(1L, assignment.getTag().getId());
    }

    @Test
    void testAssetTagsColumnUpdate() {
        // Arrange
        when(assetRepository.findById(1L)).thenReturn(Optional.of(testAsset));
        when(assetTagRepository.findById(1L)).thenReturn(Optional.of(testTag));
        when(tagAssignmentRepository.findByAsset_AssetId(1L)).thenReturn(new ArrayList<>());
        when(tagAssignmentRepository.existsByAssetIdAndTagId(1L, 1L)).thenReturn(false);
        when(assetRepository.save(any(Asset.class))).thenReturn(testAsset);

        // Act
        AssignmentResponseDTO response = assignmentService.assignTagToAsset(assignmentRequest);

        // Assert
        assertTrue(response.isSuccess());
        
        // Verify that the asset's tags column was updated
        verify(assetRepository, times(1)).save(argThat(asset -> 
            "Test Tag".equals(asset.getTags())
        ));
    }


} 