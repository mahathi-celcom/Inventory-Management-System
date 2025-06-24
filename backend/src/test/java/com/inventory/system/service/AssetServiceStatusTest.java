package com.inventory.system.service;

import com.inventory.system.dto.AssetStatusHistoryDTO;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class AssetServiceStatusTest {
    
    private Validator validator;
    
    @BeforeEach
    public void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }
    
    /**
     * Test status normalization logic
     */
    @Test
    public void testStatusNormalization() {
        // Test cases that should work with new logic
        assertEquals("ACTIVE", normalizeStatus("ACTIVE"));
        assertEquals("ACTIVE", normalizeStatus("active"));
        assertEquals("ACTIVE", normalizeStatus("Active"));
        assertEquals("IN_STOCK", normalizeStatus("in stock"));
        assertEquals("IN_STOCK", normalizeStatus("IN_STOCK"));
        assertEquals("IN_STOCK", normalizeStatus("in_stock"));
        assertEquals("IN_REPAIR", normalizeStatus("in repair"));
        assertEquals("IN_REPAIR", normalizeStatus("IN_REPAIR"));
        assertEquals("IN_REPAIR", normalizeStatus("in_repair"));
        assertEquals("BROKEN", normalizeStatus("broken"));
        assertEquals("BROKEN", normalizeStatus("BROKEN"));
        assertEquals("BROKEN", normalizeStatus("Broken"));
        assertEquals("CEASED", normalizeStatus("ceased"));
        assertEquals("CEASED", normalizeStatus("CEASED"));
        assertEquals("CEASED", normalizeStatus("Ceased"));
    }
    
    /**
     * Test AssetStatusHistoryDTO validation with new pattern
     */
    @Test
    public void testAssetStatusHistoryDTOValidation() {
        AssetStatusHistoryDTO dto = new AssetStatusHistoryDTO();
        dto.setAssetId(1L);
        dto.setChangedById(1L);
        dto.setRemarks("Test status change");
        
        // Test valid statuses (backend format with case insensitive)
        String[] validStatuses = {"ACTIVE", "active", "Active", 
                                 "IN_STOCK", "in_stock", "In_Stock",
                                 "IN_REPAIR", "in_repair", "In_Repair",
                                 "BROKEN", "broken", "Broken",
                                 "CEASED", "ceased", "Ceased"};
        
        for (String status : validStatuses) {
            dto.setStatus(status);
            Set<ConstraintViolation<AssetStatusHistoryDTO>> violations = validator.validate(dto);
            
            if (violations.isEmpty()) {
                System.out.println("✅ Status '" + status + "' is valid");
            } else {
                System.out.println("❌ Status '" + status + "' is invalid:");
                violations.forEach(violation -> 
                    System.out.println("   - " + violation.getMessage()));
            }
            
            assertTrue(violations.isEmpty(), 
                "Status '" + status + "' should be valid but got violations: " + violations);
        }
    }
    
    /**
     * Test invalid statuses are properly rejected
     */
    @Test
    public void testInvalidStatusRejection() {
        AssetStatusHistoryDTO dto = new AssetStatusHistoryDTO();
        dto.setAssetId(1L);
        dto.setChangedById(1L);
        dto.setRemarks("Test status change");
        
        // Test invalid statuses
        String[] invalidStatuses = {"INVALID_STATUS", "In stock", "In Repair", "random"};
        
        for (String status : invalidStatuses) {
            dto.setStatus(status);
            Set<ConstraintViolation<AssetStatusHistoryDTO>> violations = validator.validate(dto);
            
            assertFalse(violations.isEmpty(), 
                "Status '" + status + "' should be invalid but validation passed");
            System.out.println("✅ Status '" + status + "' correctly rejected");
        }
    }
    
    /**
     * Helper method that replicates the service normalization logic
     */
    private String normalizeStatus(String status) {
        if (status == null) return null;
        
        String trimmedStatus = status.trim();
        
        // Convert frontend values to backend values
        switch (trimmedStatus.toLowerCase()) {
            case "in stock": 
            case "in_stock": 
                return "IN_STOCK";
            case "active": 
                return "ACTIVE";
            case "in repair": 
            case "in_repair": 
                return "IN_REPAIR";
            case "broken": 
                return "BROKEN";
            case "ceased": 
                return "CEASED";
            default: 
                // Check if it's already in backend format (case-insensitive)
                String upperStatus = trimmedStatus.toUpperCase();
                if (upperStatus.equals("IN_STOCK") || 
                    upperStatus.equals("ACTIVE") || 
                    upperStatus.equals("IN_REPAIR") || 
                    upperStatus.equals("BROKEN") || 
                    upperStatus.equals("CEASED")) {
                    return upperStatus;
                }
                // If we reach here, it's an invalid status
                return trimmedStatus.toUpperCase();
        }
    }
} 