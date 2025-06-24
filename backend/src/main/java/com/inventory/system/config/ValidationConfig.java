package com.inventory.system.config;

import com.inventory.system.validation.AssetRequestValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.InitBinder;

import com.inventory.system.dto.AssetRequestDTO;

/**
 * Configuration class for custom validators
 */
@Configuration
@ControllerAdvice
@RequiredArgsConstructor
public class ValidationConfig {
    
    private final AssetRequestValidator assetRequestValidator;
    
    @InitBinder("assetRequestDTO")
    public void initAssetRequestBinder(WebDataBinder binder) {
        binder.addValidators(assetRequestValidator);
    }
    
    @InitBinder
    public void initBinder(WebDataBinder binder) {
        if (binder.getTarget() instanceof AssetRequestDTO) {
            binder.addValidators(assetRequestValidator);
        }
    }
} 