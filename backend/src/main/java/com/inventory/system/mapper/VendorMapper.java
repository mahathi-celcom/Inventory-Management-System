package com.inventory.system.mapper;

import com.inventory.system.dto.VendorDTO;
import com.inventory.system.model.Vendor;
import org.springframework.stereotype.Component;

@Component
public class VendorMapper {
    
    public VendorDTO toDTO(Vendor entity) {
        if (entity == null) {
            return null;
        }
        
        VendorDTO dto = new VendorDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setContactInfo(entity.getContactInfo());
        dto.setStatus(entity.getStatus());
        return dto;
    }
    
    public Vendor toEntity(VendorDTO dto) {
        if (dto == null) {
            return null;
        }
        
        Vendor entity = new Vendor();
        entity.setId(dto.getId());
        entity.setName(dto.getName());
        entity.setContactInfo(dto.getContactInfo());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : "Active");
        return entity;
    }
    
    public void updateEntityFromDTO(Vendor entity, VendorDTO dto) {
        if (entity == null || dto == null) {
            return;
        }
        
        if (dto.getName() != null) {
            entity.setName(dto.getName().trim());
        }
        
        if (dto.getContactInfo() != null) {
            entity.setContactInfo(dto.getContactInfo().trim());
        }
        
        if (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) {
            entity.setStatus(dto.getStatus().trim());
        }
    }
} 