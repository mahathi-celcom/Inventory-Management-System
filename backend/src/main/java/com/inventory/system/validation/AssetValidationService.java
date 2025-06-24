package com.inventory.system.validation;

import com.inventory.system.dto.AssetRequestDTO;
import com.inventory.system.model.*;
import com.inventory.system.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetValidationService {
    
    private final AssetRepository assetRepository;
    private final AssetPORepository assetPORepository;
    private final AssetTypeRepository assetTypeRepository;
    private final AssetMakeRepository assetMakeRepository;
    private final AssetModelRepository assetModelRepository;
    private final UserRepository userRepository;
    private final OSRepository osRepository;
    private final OSVersionRepository osVersionRepository;
    private final VendorRepository vendorRepository;

    /**
     * Comprehensive validation for asset creation including all business rules
     */
    public AssetValidationResult validateAssetForCreation(AssetRequestDTO request, int index) {
        List<String> errors = new ArrayList<>();
        AssetValidationContext context = new AssetValidationContext();
        
        try {
            // 1. Case-insensitive duplicate checks
            validateDuplicates(request, errors);
            
            // 2. PO lookup and vendor resolution
            resolvePOAndVendor(request, context, errors);
            
            // 3. OS Version to OS resolution
            resolveOSFromOSVersion(request, context, errors);
            
            // 4. Model to Make and Type resolution
            resolveModelHierarchy(request, context, errors);
            
            // 5. Foreign key validations
            validateForeignKeys(request, errors);
            
            return new AssetValidationResult(errors.isEmpty(), errors, context);
            
        } catch (Exception e) {
            log.error("Unexpected error during validation for asset[{}]: {}", index, e.getMessage(), e);
            errors.add("Unexpected validation error: " + e.getMessage());
            return new AssetValidationResult(false, errors, context);
        }
    }
    
    private void validateDuplicates(AssetRequestDTO request, List<String> errors) {
        // Serial Number - case-insensitive check
        if (StringUtils.hasText(request.getSerialNumber())) {
            if (assetRepository.existsBySerialNumberIgnoreCase(request.getSerialNumber())) {
                errors.add("Serial number already exists (case-insensitive): " + request.getSerialNumber());
            }
        }
        
        // IT Asset Code - case-insensitive check
        if (StringUtils.hasText(request.getItAssetCode())) {
            if (assetRepository.existsByItAssetCodeIgnoreCase(request.getItAssetCode())) {
                errors.add("IT Asset Code already exists (case-insensitive): " + request.getItAssetCode());
            }
        }
        
        // MAC Address - case-insensitive check
        if (StringUtils.hasText(request.getMacAddress())) {
            if (assetRepository.existsByMacAddressIgnoreCase(request.getMacAddress())) {
                errors.add("MAC Address already exists (case-insensitive): " + request.getMacAddress());
            }
        }
    }
    
    private void resolvePOAndVendor(AssetRequestDTO request, AssetValidationContext context, List<String> errors) {
        String poNumber = request.getPoNumber();
        
        if (StringUtils.hasText(poNumber)) {
            Optional<AssetPO> poOptional = assetPORepository.findByPoNumber(poNumber);
            
            if (poOptional.isPresent()) {
                AssetPO assetPO = poOptional.get();
                context.setAssetPO(assetPO);
                
                // Set vendorId from PO
                if (assetPO.getVendorId() != null) {
                    context.setResolvedVendorId(assetPO.getVendorId());
                    context.setResolvedExtendedWarrantyVendorId(assetPO.getVendorId()); // Same vendor for both
                } else {
                    log.warn("PO {} exists but has no vendorId", poNumber);
                }
            } else {
                errors.add("Purchase Order not found: " + poNumber);
            }
        }
    }
    
    private void resolveOSFromOSVersion(AssetRequestDTO request, AssetValidationContext context, List<String> errors) {
        if (request.getOsVersionId() != null) {
            Optional<OSVersion> osVersionOptional = osVersionRepository.findById(request.getOsVersionId());
            
            if (osVersionOptional.isPresent()) {
                OSVersion osVersion = osVersionOptional.get();
                context.setOsVersion(osVersion);
                
                if (osVersion.getOs() != null) {
                    context.setResolvedOsId(osVersion.getOs().getId());
                } else {
                    errors.add("OS Version ID " + request.getOsVersionId() + " has no associated OS");
                }
            } else {
                errors.add("OS Version ID " + request.getOsVersionId() + " does not exist");
            }
        }
    }
    
    private void resolveModelHierarchy(AssetRequestDTO request, AssetValidationContext context, List<String> errors) {
        if (request.getModelId() != null) {
            Optional<AssetModel> modelOptional = assetModelRepository.findById(request.getModelId());
            
            if (modelOptional.isPresent()) {
                AssetModel model = modelOptional.get();
                context.setAssetModel(model);
                
                if (model.getMake() != null) {
                    AssetMake make = model.getMake();
                    context.setResolvedMakeId(make.getId());
                    
                    if (make.getAssetType() != null) {
                        context.setResolvedTypeId(make.getAssetType().getId());
                    } else {
                        errors.add("Asset Make ID " + make.getId() + " has no associated Asset Type");
                    }
                } else {
                    errors.add("Asset Model ID " + request.getModelId() + " has no associated Make");
                }
            } else {
                errors.add("Asset Model ID " + request.getModelId() + " does not exist");
            }
        }
    }
    
    private void validateForeignKeys(AssetRequestDTO request, List<String> errors) {
        // Validate Asset Type (if provided and not resolved from model hierarchy)
        if (request.getAssetTypeId() != null && !assetTypeRepository.existsById(request.getAssetTypeId())) {
            errors.add("Asset Type ID " + request.getAssetTypeId() + " does not exist");
        }
        
        // Validate Asset Make (if provided and not resolved from model hierarchy)
        if (request.getMakeId() != null && !assetMakeRepository.existsById(request.getMakeId())) {
            errors.add("Asset Make ID " + request.getMakeId() + " does not exist");
        }
        
        // Validate Current User
        if (request.getCurrentUserId() != null && !userRepository.existsById(request.getCurrentUserId())) {
            errors.add("Current User ID " + request.getCurrentUserId() + " does not exist");
        }
        
        // Validate OS (if provided directly)
        if (request.getOsId() != null && !osRepository.existsById(request.getOsId())) {
            errors.add("OS ID " + request.getOsId() + " does not exist");
        }
        
        // Validate Vendor (if provided directly)
        if (request.getVendorId() != null && !vendorRepository.existsById(request.getVendorId())) {
            errors.add("Vendor ID " + request.getVendorId() + " does not exist");
        }
        
        // Validate Extended Warranty Vendor (if provided directly)
        if (request.getExtendedWarrantyVendorId() != null && !vendorRepository.existsById(request.getExtendedWarrantyVendorId())) {
            errors.add("Extended Warranty Vendor ID " + request.getExtendedWarrantyVendorId() + " does not exist");
        }
    }
    
    // Inner classes for validation results and context
    public static class AssetValidationResult {
        private final boolean valid;
        private final List<String> errors;
        private final AssetValidationContext context;
        
        public AssetValidationResult(boolean valid, List<String> errors, AssetValidationContext context) {
            this.valid = valid;
            this.errors = errors;
            this.context = context;
        }
        
        public boolean isValid() { return valid; }
        public List<String> getErrors() { return errors; }
        public AssetValidationContext getContext() { return context; }
    }
    
    public static class AssetValidationContext {
        private AssetPO assetPO;
        private OSVersion osVersion;
        private AssetModel assetModel;
        private Long resolvedVendorId;
        private Long resolvedExtendedWarrantyVendorId;
        private Long resolvedOsId;
        private Long resolvedMakeId;
        private Long resolvedTypeId;
        
        // Getters and setters
        public AssetPO getAssetPO() { return assetPO; }
        public void setAssetPO(AssetPO assetPO) { this.assetPO = assetPO; }
        
        public OSVersion getOsVersion() { return osVersion; }
        public void setOsVersion(OSVersion osVersion) { this.osVersion = osVersion; }
        
        public AssetModel getAssetModel() { return assetModel; }
        public void setAssetModel(AssetModel assetModel) { this.assetModel = assetModel; }
        
        public Long getResolvedVendorId() { return resolvedVendorId; }
        public void setResolvedVendorId(Long resolvedVendorId) { this.resolvedVendorId = resolvedVendorId; }
        
        public Long getResolvedExtendedWarrantyVendorId() { return resolvedExtendedWarrantyVendorId; }
        public void setResolvedExtendedWarrantyVendorId(Long resolvedExtendedWarrantyVendorId) { 
            this.resolvedExtendedWarrantyVendorId = resolvedExtendedWarrantyVendorId; 
        }
        
        public Long getResolvedOsId() { return resolvedOsId; }
        public void setResolvedOsId(Long resolvedOsId) { this.resolvedOsId = resolvedOsId; }
        
        public Long getResolvedMakeId() { return resolvedMakeId; }
        public void setResolvedMakeId(Long resolvedMakeId) { this.resolvedMakeId = resolvedMakeId; }
        
        public Long getResolvedTypeId() { return resolvedTypeId; }
        public void setResolvedTypeId(Long resolvedTypeId) { this.resolvedTypeId = resolvedTypeId; }
    }
} 