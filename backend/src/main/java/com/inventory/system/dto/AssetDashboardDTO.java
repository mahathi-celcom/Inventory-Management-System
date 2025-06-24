package com.inventory.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetDashboardDTO {
    private Long assetId;
    private String name;
    private String status;
    private String serialNumber;
    private String itAssetCode;
    
    // Asset Type Information
    private Long assetTypeId;
    private String assetTypeName;
    
    // Make Information
    private Long makeId;
    private String makeName;
    
    // Model Information
    private Long modelId;
    private String modelName;
    
    // PO Information
    private String poNumber;
    private String invoiceNumber;
    
    // Current User Information
    private Long currentUserId;
    private String currentUserName;
    private String currentUserEmail;
    private String currentUserDepartment;
    
    // Current Tag Information
    private Long currentTagId;
    private String currentTagName;
    
    // Additional useful fields
    private String inventoryLocation;
    private String ownerType;
    private String acquisitionType;
} 