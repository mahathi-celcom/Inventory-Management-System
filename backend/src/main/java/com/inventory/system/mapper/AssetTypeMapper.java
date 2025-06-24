package com.inventory.system.mapper;

import com.inventory.system.dto.AssetTypeDTO;
import com.inventory.system.model.AssetType;
import org.springframework.stereotype.Component;

@Component
public class AssetTypeMapper {
    
    public AssetTypeDTO toDTO(AssetType entity) {
        if (entity == null) {
            return null;
        }
        
        AssetTypeDTO dto = new AssetTypeDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        return dto;
    }
    
    public AssetType toEntity(AssetTypeDTO dto) {
        if (dto == null) {
            return null;
        }
        
        AssetType entity = new AssetType();
        entity.setId(dto.getId());
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        return entity;
    }
} 