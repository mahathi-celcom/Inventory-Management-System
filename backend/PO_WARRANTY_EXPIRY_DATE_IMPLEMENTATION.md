# PO Warranty Expiry Date Implementation

## Overview
Added `warrantyExpiryDate` field to the Purchase Order (PO) system to track warranty information at the PO level. This field is independent of Asset warranty fields and provides better tracking for bulk purchases.

## Database Changes

### Migration: V18__Add_Warranty_Expiry_Date_To_AssetPO.sql
```sql
-- Add warranty_expiry_date column to asset_po table
ALTER TABLE asset_po 
ADD COLUMN warranty_expiry_date DATE NULL 
COMMENT 'Warranty expiry date for the purchase order';
```

## Model Changes

### AssetPO Entity (`src/main/java/com/inventory/system/model/AssetPO.java`)
```java
@Column(name = "warranty_expiry_date", nullable = true)
@JsonFormat(pattern = "yyyy-MM-dd")
private LocalDate warrantyExpiryDate;
```

**Key Features:**
- Optional field (nullable)
- JSON date format: `yyyy-MM-dd`
- Mapped to `warranty_expiry_date` database column

## DTO Changes

### AssetPODTO (`src/main/java/com/inventory/system/dto/AssetPODTO.java`)
```java
@JsonFormat(pattern = "yyyy-MM-dd")
private LocalDate warrantyExpiryDate;
```

**Validation:**
- No explicit validation annotations (optional field)
- Business validation handled in service layer
- JSON format ensures consistent date handling

## Service Implementation

### AssetPOServiceImpl Updates

#### 1. Create PO Validation
```java
@Override
public AssetPODTO createAssetPO(AssetPODTO assetPODTO) {
    log.info("Creating new AssetPO with PO Number: {}", assetPODTO.getPoNumber());
    
    // Validate warranty expiry date
    validateWarrantyExpiryDate(assetPODTO.getWarrantyExpiryDate(), assetPODTO.getAcquisitionDate());
    
    AssetPO assetPO = assetPOMapper.toEntity(assetPODTO);
    AssetPO savedAssetPO = assetPORepository.save(assetPO);
    
    return assetPOMapper.toDTO(savedAssetPO);
}
```

#### 2. Update PO Validation
```java
@Override
public AssetPODTO updateAssetPO(Long id, AssetPODTO assetPODTO) {
    // ... existing update logic ...
    
    // Validate warranty expiry date
    validateWarrantyExpiryDate(assetPODTO.getWarrantyExpiryDate(), assetPODTO.getAcquisitionDate());
    existingAssetPO.setWarrantyExpiryDate(assetPODTO.getWarrantyExpiryDate());
    
    AssetPO updatedAssetPO = assetPORepository.save(existingAssetPO);
    return assetPOMapper.toDTO(updatedAssetPO);
}
```

#### 3. Warranty Validation Logic
```java
/**
 * Validates warranty expiry date against acquisition date
 * @param warrantyExpiryDate The warranty expiry date to validate
 * @param acquisitionDate The acquisition date to compare against
 * @throws IllegalArgumentException if validation fails
 */
private void validateWarrantyExpiryDate(LocalDate warrantyExpiryDate, LocalDate acquisitionDate) {
    if (warrantyExpiryDate == null) {
        return; // Warranty expiry date is optional
    }
    
    if (acquisitionDate != null && warrantyExpiryDate.isBefore(acquisitionDate)) {
        throw new IllegalArgumentException(
            "Warranty expiry date (" + warrantyExpiryDate + 
            ") cannot be before acquisition date (" + acquisitionDate + ")"
        );
    }
    
    // Additional validation: warranty expiry date should not be too far in the past
    LocalDate today = LocalDate.now();
    if (warrantyExpiryDate.isBefore(today.minusYears(10))) {
        throw new IllegalArgumentException(
            "Warranty expiry date (" + warrantyExpiryDate + 
            ") seems too far in the past (more than 10 years ago)"
        );
    }
}
```

## Mapper Changes

### AssetPOMapper Updates
```java
// In toDTO method
dto.setWarrantyExpiryDate(entity.getWarrantyExpiryDate());

// In toEntity method  
entity.setWarrantyExpiryDate(dto.getWarrantyExpiryDate());
```

## Validation Rules

### Business Validation
1. **Optional Field**: Warranty expiry date is not required
2. **Date Logic**: If provided, warranty expiry date cannot be before acquisition date
3. **Sanity Check**: Cannot be more than 10 years in the past
4. **Format**: Must be in `yyyy-MM-dd` format when sent via JSON

### Error Handling
- **Invalid Date Logic**: Returns `400 Bad Request` with descriptive message
- **Format Errors**: Handled by Jackson JSON deserialization
- **Validation Failures**: Throws `IllegalArgumentException` with clear error messages

## API Usage Examples

### 1. Create PO with Warranty Expiry Date
```json
POST /api/asset-pos
{
  "acquisitionType": "Bought",
  "poNumber": "PO-2024-001",
  "acquisitionDate": "2024-01-15",
  "warrantyExpiryDate": "2027-01-15",
  "vendorId": 1,
  "ownerType": "Celcom",
  "totalDevices": 10,
  "acquisitionPrice": 50000.00
}
```

### 2. Update PO Warranty Expiry Date
```json
PUT /api/asset-pos/1
{
  "acquisitionType": "Bought", 
  "poNumber": "PO-2024-001",
  "acquisitionDate": "2024-01-15",
  "warrantyExpiryDate": "2028-01-15",
  "vendorId": 1,
  "ownerType": "Celcom",
  "totalDevices": 10,
  "acquisitionPrice": 50000.00
}
```

### 3. Create PO without Warranty Expiry Date
```json
POST /api/asset-pos
{
  "acquisitionType": "Leased",
  "poNumber": "PO-2024-002", 
  "acquisitionDate": "2024-01-15",
  "vendorId": 2,
  "ownerType": "Vendor",
  "totalDevices": 5,
  "rentalAmount": 5000.00
}
```

## Asset Independence

### Important: Asset Warranty vs PO Warranty
The PO `warrantyExpiryDate` field is **independent** of Asset warranty fields:

- **PO Level**: `warrantyExpiryDate` - Tracks warranty for the purchase order
- **Asset Level**: 
  - `warrantyExpiry` - Individual asset warranty (from manufacturer)
  - `extendedWarrantyExpiry` - Extended warranty purchased separately

### Asset Creation Behavior
When creating Assets:
1. **Asset Form Fields**: If `warrantyExpiry` or `extendedWarrantyExpiry` provided → Use Asset form values
2. **PO Warranty**: PO `warrantyExpiryDate` is **NOT** automatically copied to Assets
3. **Independent Management**: Each Asset can have different warranty dates than the PO

### Example Scenario
```
PO-2024-001:
├── warrantyExpiryDate: "2027-01-15" (3-year bulk warranty)
├── Asset-001: 
│   ├── warrantyExpiry: "2026-01-15" (2-year individual warranty)
│   └── extendedWarrantyExpiry: "2029-01-15" (extended warranty)
└── Asset-002:
    ├── warrantyExpiry: "2025-01-15" (1-year individual warranty) 
    └── extendedWarrantyExpiry: null
```

## Benefits

### 1. Better Warranty Tracking
- Track warranty information at purchase level
- Useful for bulk purchases with uniform warranty terms
- Easier procurement and vendor management

### 2. Improved Reporting
- Generate warranty reports at PO level
- Track warranty coverage across purchases
- Better vendor warranty compliance monitoring

### 3. Validation and Data Quality
- Prevents invalid warranty dates
- Ensures logical date relationships
- Maintains data integrity

### 4. Flexibility
- Optional field - works with existing POs
- Independent of Asset-level warranty fields
- Supports various purchase scenarios

## Migration Notes

### Existing Data
- Existing PO records: `warrantyExpiryDate` will be `NULL`
- No impact on existing functionality
- Fully backward compatible

### Deployment
1. **Database Migration**: V18 migration will run automatically
2. **API Compatibility**: All existing API calls continue to work
3. **Frontend Updates**: Can optionally add warranty expiry date field to PO forms

### Testing Checklist
- [ ] Create PO with warranty expiry date
- [ ] Create PO without warranty expiry date  
- [ ] Update PO warranty expiry date
- [ ] Validate date logic (warranty before acquisition)
- [ ] Validate historical dates (10+ years ago)
- [ ] Verify Asset creation independence
- [ ] Test API error responses
- [ ] Verify database migration 