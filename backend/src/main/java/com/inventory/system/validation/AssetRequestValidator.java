package com.inventory.system.validation;

import com.inventory.system.dto.AssetRequestDTO;
import com.inventory.system.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

/**
 * Spring Validator for AssetRequestDTO that provides additional validation
 * beyond what can be achieved with Bean Validation annotations
 */
@Component
@RequiredArgsConstructor
public class AssetRequestValidator implements Validator {
    
    private final AssetRepository assetRepository;
    
    @Override
    public boolean supports(Class<?> clazz) {
        return AssetRequestDTO.class.equals(clazz);
    }
    
    @Override
    public void validate(Object target, Errors errors) {
        AssetRequestDTO request = (AssetRequestDTO) target;
        
        // Case-insensitive duplicate validations
        validateUniqueSerialNumber(request, errors);
        validateUniqueItAssetCode(request, errors);
        validateUniqueMacAddress(request, errors);
        
        // Business logic validations
        validateMacAddressFormat(request, errors);
        validateWarrantyDates(request, errors);
    }
    
    private void validateUniqueSerialNumber(AssetRequestDTO request, Errors errors) {
        if (StringUtils.hasText(request.getSerialNumber())) {
            if (assetRepository.existsBySerialNumberIgnoreCase(request.getSerialNumber())) {
                errors.rejectValue("serialNumber", "duplicate.serialNumber", 
                    "Serial number already exists (case-insensitive): " + request.getSerialNumber());
            }
        }
    }
    
    private void validateUniqueItAssetCode(AssetRequestDTO request, Errors errors) {
        if (StringUtils.hasText(request.getItAssetCode())) {
            if (assetRepository.existsByItAssetCodeIgnoreCase(request.getItAssetCode())) {
                errors.rejectValue("itAssetCode", "duplicate.itAssetCode", 
                    "IT Asset Code already exists (case-insensitive): " + request.getItAssetCode());
            }
        }
    }
    
    private void validateUniqueMacAddress(AssetRequestDTO request, Errors errors) {
        if (StringUtils.hasText(request.getMacAddress())) {
            if (assetRepository.existsByMacAddressIgnoreCase(request.getMacAddress())) {
                errors.rejectValue("macAddress", "duplicate.macAddress", 
                    "MAC Address already exists (case-insensitive): " + request.getMacAddress());
            }
        }
    }
    
    private void validateMacAddressFormat(AssetRequestDTO request, Errors errors) {
        if (StringUtils.hasText(request.getMacAddress())) {
            String macAddress = request.getMacAddress();
            // Basic MAC address format validation (XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX)
            if (!macAddress.matches("^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$")) {
                errors.rejectValue("macAddress", "invalid.macAddress", 
                    "MAC Address format is invalid. Expected format: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX");
            }
        }
    }
    
    private void validateWarrantyDates(AssetRequestDTO request, Errors errors) {
        // Validate that warranty expiry is not before acquisition date
        if (request.getAcquisitionDate() != null && request.getWarrantyExpiry() != null) {
            if (request.getWarrantyExpiry().isBefore(request.getAcquisitionDate())) {
                errors.rejectValue("warrantyExpiry", "invalid.warrantyExpiry", 
                    "Warranty expiry date cannot be before acquisition date");
            }
        }
        
        // Validate that extended warranty expiry is not before warranty expiry
        if (request.getWarrantyExpiry() != null && request.getExtendedWarrantyExpiry() != null) {
            if (request.getExtendedWarrantyExpiry().isBefore(request.getWarrantyExpiry())) {
                errors.rejectValue("extendedWarrantyExpiry", "invalid.extendedWarrantyExpiry", 
                    "Extended warranty expiry date cannot be before warranty expiry date");
            }
        }
    }
} 