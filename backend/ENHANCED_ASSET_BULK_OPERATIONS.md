# Enhanced Asset Bulk Operations Implementation Guide

## Overview

This guide covers the enhanced implementation of asset bulk operations in your Spring Boot + PostgreSQL IT Asset Management System, addressing all the specified requirements:

1. ✅ **warrantyExpiry field** - Already present in Asset entity and DTOs
2. ✅ **PO-based vendor lookup** - Implemented with automatic vendorId and extendedWarrantyVendorId resolution
3. ✅ **OS resolution from OS Version** - Automatic osId lookup from osVersionId
4. ✅ **Model hierarchy resolution** - Automatic makeId and typeId lookup from modelId
5. ✅ **Case-insensitive duplicate validation** - Enhanced validation for serialNumber, macAddress, and itAssetCode

## Key Components Added/Enhanced

### 1. Enhanced Repository Layer

**File**: `src/main/java/com/inventory/system/repository/AssetRepository.java`

Added case-insensitive duplicate check methods:

```java
@Query("SELECT COUNT(a) > 0 FROM Asset a WHERE a.deleted = false AND LOWER(a.serialNumber) = LOWER(:serialNumber)")
boolean existsBySerialNumberIgnoreCase(@Param("serialNumber") String serialNumber);

@Query("SELECT COUNT(a) > 0 FROM Asset a WHERE a.deleted = false AND LOWER(a.itAssetCode) = LOWER(:itAssetCode)")
boolean existsByItAssetCodeIgnoreCase(@Param("itAssetCode") String itAssetCode);

@Query("SELECT COUNT(a) > 0 FROM Asset a WHERE a.deleted = false AND LOWER(a.macAddress) = LOWER(:macAddress)")
boolean existsByMacAddressIgnoreCase(@Param("macAddress") String macAddress);
```

### 2. Comprehensive Validation Service

**File**: `src/main/java/com/inventory/system/validation/AssetValidationService.java`

This service provides comprehensive validation logic including:
- Case-insensitive duplicate checks
- PO lookup and vendor resolution  
- OS Version to OS resolution
- Model to Make and Type resolution
- Foreign key validations

### 3. Enhanced Asset Mapper

**File**: `src/main/java/com/inventory/system/mapper/AssetMapper.java`

New method: `toEntityWithContext(AssetRequestDTO dto, AssetValidationContext context)`

Uses validation context to set resolved foreign keys automatically.

### 4. Spring Validator

**File**: `src/main/java/com/inventory/system/validation/AssetRequestValidator.java`

Provides additional validation beyond Bean Validation annotations.

## Business Logic Implementation

### PO-based Vendor Resolution

When creating assets:
1. Takes poNumber from request
2. Looks up AssetPO using AssetPORepository.findByPoNumber()
3. Extracts vendorId from the PO
4. Sets both vendorId and extendedWarrantyVendorId to the same vendor
5. Frontend doesn't need to provide vendor information

### OS Resolution from OS Version

When osVersionId is provided:
1. Looks up OSVersion entity
2. Gets the associated OS
3. Sets osId automatically

### Model Hierarchy Resolution

When modelId is provided:
1. Looks up AssetModel entity
2. Gets makeId from model.getMake().getId()
3. Gets typeId from model.getMake().getAssetType().getId()

## Usage Example

```json
POST /api/assets/bulk

[
  {
    "name": "Dell Laptop",
    "serialNumber": "DL123456", 
    "poNumber": "PO-2024-001",
    "modelId": 5,
    "osVersionId": 12,
    "status": "Active",
    "ownerType": "Celcom",
    "acquisitionType": "Bought",
    "warrantyExpiry": "2026-12-31"
  }
]
```

The system automatically resolves:
- vendorId and extendedWarrantyVendorId from PO-2024-001
- makeId and typeId from modelId 5
- osId from osVersionId 12
- Validates duplicates case-insensitively

## Testing

All new functionality includes comprehensive unit and integration tests covering:
- PO vendor resolution
- OS hierarchy resolution  
- Model hierarchy resolution
- Case-insensitive duplicate validation
- Error handling scenarios

 