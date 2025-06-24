package com.inventory.system.mapper;

import com.inventory.system.dto.AssetPODTO;
import com.inventory.system.model.AssetPO;
import org.springframework.stereotype.Component;

@Component
public class AssetPOMapper {
    
    public AssetPODTO toDTO(AssetPO entity) {
        if (entity == null) {
            return null;
        }
        
        AssetPODTO dto = new AssetPODTO();
        dto.setId(entity.getPoId());
        dto.setAcquisitionType(entity.getAcquisitionType());
        dto.setPoNumber(entity.getPoNumber());
        dto.setInvoiceNumber(entity.getInvoiceNumber());
        dto.setAcquisitionDate(entity.getAcquisitionDate());
        dto.setVendorId(entity.getVendorId());
        dto.setOwnerType(entity.getOwnerType());
        dto.setLeaseEndDate(entity.getLeaseEndDate());
        dto.setRentalAmount(entity.getRentalAmount());
        dto.setMinContractPeriod(entity.getMinContractPeriod());
        dto.setAcquisitionPrice(entity.getAcquisitionPrice());
        dto.setDepreciationPct(entity.getDepreciationPct());
        dto.setCurrentPrice(entity.getCurrentPrice());
        dto.setTotalDevices(entity.getTotalDevices());
        dto.setWarrantyExpiryDate(entity.getWarrantyExpiryDate());
        
        // Set vendor name if vendor is loaded
        if (entity.getVendor() != null) {
            dto.setVendorName(entity.getVendor().getName());
        }
        
        return dto;
    }
    
    public AssetPO toEntity(AssetPODTO dto) {
        if (dto == null) {
            return null;
        }
        
        AssetPO entity = new AssetPO();
        entity.setPoId(dto.getId());
        entity.setAcquisitionType(dto.getAcquisitionType());
        entity.setPoNumber(dto.getPoNumber());
        entity.setInvoiceNumber(dto.getInvoiceNumber());
        entity.setAcquisitionDate(dto.getAcquisitionDate());
        entity.setVendorId(dto.getVendorId());
        entity.setOwnerType(dto.getOwnerType());
        entity.setLeaseEndDate(dto.getLeaseEndDate());
        entity.setRentalAmount(dto.getRentalAmount());
        entity.setMinContractPeriod(dto.getMinContractPeriod());
        entity.setAcquisitionPrice(dto.getAcquisitionPrice());
        entity.setDepreciationPct(dto.getDepreciationPct());
        entity.setCurrentPrice(dto.getCurrentPrice());
        entity.setTotalDevices(dto.getTotalDevices());
        entity.setWarrantyExpiryDate(dto.getWarrantyExpiryDate());
        
        return entity;
    }
} 