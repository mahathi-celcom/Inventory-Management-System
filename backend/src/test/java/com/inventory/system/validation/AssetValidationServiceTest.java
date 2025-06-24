package com.inventory.system.validation;

import com.inventory.system.dto.AssetRequestDTO;
import com.inventory.system.model.*;
import com.inventory.system.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssetValidationServiceTest {

    @Mock
    private AssetRepository assetRepository;
    
    @Mock
    private AssetPORepository assetPORepository;
    
    @Mock
    private AssetTypeRepository assetTypeRepository;
    
    @Mock
    private AssetMakeRepository assetMakeRepository;
    
    @Mock
    private AssetModelRepository assetModelRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private OSRepository osRepository;
    
    @Mock
    private OSVersionRepository osVersionRepository;
    
    @Mock
    private VendorRepository vendorRepository;

    @InjectMocks
    private AssetValidationService validationService;

    private AssetRequestDTO validAssetRequest;

    @BeforeEach
    void setUp() {
        validAssetRequest = new AssetRequestDTO();
        validAssetRequest.setName("Test Asset");
        validAssetRequest.setSerialNumber("TEST123");
        validAssetRequest.setPoNumber("PO-2024-001");
        validAssetRequest.setModelId(1L);
        validAssetRequest.setOsVersionId(1L);
        validAssetRequest.setStatus("Active");
        validAssetRequest.setOwnerType("Celcom");
        validAssetRequest.setAcquisitionType("Bought");
    }

    @Test
    void testValidAssetCreation() {
        // Setup mocks for successful validation
        setupSuccessfulMocks();

        // Execute validation
        AssetValidationService.AssetValidationResult result = 
            validationService.validateAssetForCreation(validAssetRequest, 0);

        // Verify result
        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
        
        // Verify resolved context
        AssetValidationService.AssetValidationContext context = result.getContext();
        assertEquals(5L, context.getResolvedVendorId());
        assertEquals(5L, context.getResolvedExtendedWarrantyVendorId());
        assertEquals(3L, context.getResolvedOsId());
        assertEquals(2L, context.getResolvedMakeId());
        assertEquals(1L, context.getResolvedTypeId());
    }

    @Test
    void testCaseInsensitiveDuplicateSerialNumber() {
        // Setup: Serial number exists with different case
        when(assetRepository.existsBySerialNumberIgnoreCase("TEST123")).thenReturn(true);

        // Execute validation
        AssetValidationService.AssetValidationResult result = 
            validationService.validateAssetForCreation(validAssetRequest, 0);

        // Verify failure due to duplicate
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("Serial number already exists (case-insensitive)")));
    }

    @Test
    void testCaseInsensitiveDuplicateItAssetCode() {
        // Setup
        validAssetRequest.setItAssetCode("IT-ASSET-001");
        when(assetRepository.existsByItAssetCodeIgnoreCase("IT-ASSET-001")).thenReturn(true);
        setupNonDuplicateMocks();

        // Execute validation
        AssetValidationService.AssetValidationResult result = 
            validationService.validateAssetForCreation(validAssetRequest, 0);

        // Verify failure
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("IT Asset Code already exists (case-insensitive)")));
    }

    @Test
    void testCaseInsensitiveDuplicateMacAddress() {
        // Setup
        validAssetRequest.setMacAddress("AA:BB:CC:DD:EE:FF");
        when(assetRepository.existsByMacAddressIgnoreCase("AA:BB:CC:DD:EE:FF")).thenReturn(true);
        setupNonDuplicateMocks();

        // Execute validation
        AssetValidationService.AssetValidationResult result = 
            validationService.validateAssetForCreation(validAssetRequest, 0);

        // Verify failure
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("MAC Address already exists (case-insensitive)")));
    }

    @Test
    void testPOVendorResolution() {
        // Setup: PO exists with vendor
        AssetPO mockPO = new AssetPO();
        mockPO.setPoNumber("PO-2024-001");
        mockPO.setVendorId(5L);
        when(assetPORepository.findByPoNumber("PO-2024-001")).thenReturn(Optional.of(mockPO));
        setupNonDuplicateMocks();

        // Execute validation
        AssetValidationService.AssetValidationResult result = 
            validationService.validateAssetForCreation(validAssetRequest, 0);

        // Verify vendor resolution
        assertTrue(result.isValid());
        assertEquals(5L, result.getContext().getResolvedVendorId());
        assertEquals(5L, result.getContext().getResolvedExtendedWarrantyVendorId());
    }

    @Test
    void testPONotFound() {
        // Setup: PO doesn't exist
        when(assetPORepository.findByPoNumber("PO-2024-001")).thenReturn(Optional.empty());
        setupNonDuplicateMocks();

        // Execute validation
        AssetValidationService.AssetValidationResult result = 
            validationService.validateAssetForCreation(validAssetRequest, 0);

        // Verify failure
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("Purchase Order not found")));
    }

    @Test
    void testOSVersionToOSResolution() {
        // Setup: OS Version exists with linked OS
        OS mockOS = new OS();
        mockOS.setId(3L);
        
        OSVersion mockOSVersion = new OSVersion();
        mockOSVersion.setId(1L);
        mockOSVersion.setOs(mockOS);
        
        when(osVersionRepository.findById(1L)).thenReturn(Optional.of(mockOSVersion));
        setupNonDuplicateMocks();

        // Execute validation
        AssetValidationService.AssetValidationResult result = 
            validationService.validateAssetForCreation(validAssetRequest, 0);

        // Verify OS resolution
        assertTrue(result.isValid());
        assertEquals(3L, result.getContext().getResolvedOsId());
    }

    @Test
    void testModelHierarchyResolution() {
        // Setup: Model -> Make -> Type hierarchy
        AssetType mockType = new AssetType();
        mockType.setId(1L);
        
        AssetMake mockMake = new AssetMake();
        mockMake.setId(2L);
        mockMake.setAssetType(mockType);
        
        AssetModel mockModel = new AssetModel();
        mockModel.setId(1L);
        mockModel.setMake(mockMake);
        
        when(assetModelRepository.findById(1L)).thenReturn(Optional.of(mockModel));
        setupNonDuplicateMocks();

        // Execute validation
        AssetValidationService.AssetValidationResult result = 
            validationService.validateAssetForCreation(validAssetRequest, 0);

        // Verify hierarchy resolution
        assertTrue(result.isValid());
        assertEquals(2L, result.getContext().getResolvedMakeId());
        assertEquals(1L, result.getContext().getResolvedTypeId());
    }

    @Test
    void testModelWithoutMake() {
        // Setup: Model without associated make
        AssetModel mockModel = new AssetModel();
        mockModel.setId(1L);
        mockModel.setMake(null);
        
        when(assetModelRepository.findById(1L)).thenReturn(Optional.of(mockModel));
        setupNonDuplicateMocks();

        // Execute validation
        AssetValidationService.AssetValidationResult result = 
            validationService.validateAssetForCreation(validAssetRequest, 0);

        // Verify failure
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("has no associated Make")));
    }

    @Test
    void testOSVersionWithoutOS() {
        // Setup: OS Version without associated OS
        OSVersion mockOSVersion = new OSVersion();
        mockOSVersion.setId(1L);
        mockOSVersion.setOs(null);
        
        when(osVersionRepository.findById(1L)).thenReturn(Optional.of(mockOSVersion));
        setupNonDuplicateMocks();

        // Execute validation
        AssetValidationService.AssetValidationResult result = 
            validationService.validateAssetForCreation(validAssetRequest, 0);

        // Verify failure
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("has no associated OS")));
    }

    @Test
    void testMultipleValidationErrors() {
        // Setup: Multiple validation failures
        validAssetRequest.setItAssetCode("IT-DUPLICATE");
        validAssetRequest.setMacAddress("AA:BB:CC:DD:EE:FF");
        
        when(assetRepository.existsBySerialNumberIgnoreCase(anyString())).thenReturn(true);
        when(assetRepository.existsByItAssetCodeIgnoreCase(anyString())).thenReturn(true);
        when(assetRepository.existsByMacAddressIgnoreCase(anyString())).thenReturn(true);
        when(assetPORepository.findByPoNumber(anyString())).thenReturn(Optional.empty());

        // Execute validation
        AssetValidationService.AssetValidationResult result = 
            validationService.validateAssetForCreation(validAssetRequest, 0);

        // Verify multiple errors
        assertFalse(result.isValid());
        assertTrue(result.getErrors().size() > 1);
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("Serial number already exists")));
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("IT Asset Code already exists")));
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("MAC Address already exists")));
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("Purchase Order not found")));
    }

    private void setupSuccessfulMocks() {
        // No duplicates
        setupNonDuplicateMocks();
        
        // Valid PO with vendor
        AssetPO mockPO = new AssetPO();
        mockPO.setVendorId(5L);
        when(assetPORepository.findByPoNumber("PO-2024-001")).thenReturn(Optional.of(mockPO));
        
        // Valid OS Version with OS
        OS mockOS = new OS();
        mockOS.setId(3L);
        OSVersion mockOSVersion = new OSVersion();
        mockOSVersion.setOs(mockOS);
        when(osVersionRepository.findById(1L)).thenReturn(Optional.of(mockOSVersion));
        
        // Valid Model hierarchy
        AssetType mockType = new AssetType();
        mockType.setId(1L);
        AssetMake mockMake = new AssetMake();
        mockMake.setId(2L);
        mockMake.setAssetType(mockType);
        AssetModel mockModel = new AssetModel();
        mockModel.setMake(mockMake);
        when(assetModelRepository.findById(1L)).thenReturn(Optional.of(mockModel));
    }

    private void setupNonDuplicateMocks() {
        when(assetRepository.existsBySerialNumberIgnoreCase(anyString())).thenReturn(false);
        when(assetRepository.existsByItAssetCodeIgnoreCase(anyString())).thenReturn(false);
        when(assetRepository.existsByMacAddressIgnoreCase(anyString())).thenReturn(false);
    }
} 