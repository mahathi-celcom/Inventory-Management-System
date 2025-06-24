package com.inventory.system.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class AssetModelDetailsDTO extends AssetModelDTO {
    private String makeName;
    private String assetTypeName;
    private Long assetTypeId;
} 