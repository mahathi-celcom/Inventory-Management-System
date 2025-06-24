# Asset Warranty Expiry Date Mapping Implementation

## Overview
Updated Asset creation and management to handle `warrantyExpiryDate` field from Asset forms and map it to `extendedWarrantyExpiry` in the Asset entity. This ensures that Asset warranty information remains independent of PO warranty information.

## Key Requirements Implemented

### 1. Asset Form Warranty Field Mapping
- **Frontend Field**: `warrantyExpiryDate` (user-friendly name)
- **Backend Field**: `extendedWarrantyExpiry` (existing database field)
- **Mapping Logic**: `warrantyExpiryDate` → `extendedWarrantyExpiry`

### 2. PO Warranty Independence
- **PO Warranty**: `warrantyExpiryDate` in PO system (separate field)
- **Asset Warranty**: `extendedWarrantyExpiry` in Asset system (independent)
- **No Automatic Copying**: PO warranty does NOT automatically populate Asset warranty
- **Manual Control**: Users must explicitly provide Asset warranty dates

## Implementation Details

### AssetDTO Updates
The AssetDTO already had the required fields:
```java
private LocalDate warrantyExpiry;           // Manufacturer warranty
private LocalDate extendedWarrantyExpiry;   // Extended warranty (actual storage)
private LocalDate warrantyExpiryDate;       // Frontend-friendly field
```

### AssetMapper Logic Updates

#### 1. Entity Creation (DTO → Entity)
```java
// Handle warranty expiry date mapping - prioritize warrantyExpiryDate over extendedWarrantyExpiry
if (dto.getWarrantyExpiryDate() != null) {
    asset.setExtendedWarrantyExpiry(dto.getWarrantyExpiryDate());
} else {
    asset.setExtendedWarrantyExpiry(dto.getExtendedWarrantyExpiry());
}
```

**Applied to Methods:**
- `toEntity(AssetRequestDTO dto)` - For Asset creation from forms
- `toEntityWithContext(AssetRequestDTO dto, context)` - For validated Asset creation
- `toEntity(AssetDTO dto)` - For general Asset operations

#### 2. DTO Creation (Entity → DTO)
```java
dto.setWarrantyExpiry(asset.getWarrantyExpiry());
dto.setExtendedWarrantyExpiry(asset.getExtendedWarrantyExpiry());

// Set warrantyExpiryDate to same value as extendedWarrantyExpiry for frontend compatibility
dto.setWarrantyExpiryDate(asset.getExtendedWarrantyExpiry());
```

#### 3. Entity Updates (Partial Updates)
```java
// Handle warranty expiry date mapping - prioritize warrantyExpiryDate over extendedWarrantyExpiry
if (dto.getWarrantyExpiryDate() != null) {
    asset.setExtendedWarrantyExpiry(dto.getWarrantyExpiryDate());
} else if (dto.getExtendedWarrantyExpiry() != null) {
    asset.setExtendedWarrantyExpiry(dto.getExtendedWarrantyExpiry());
}
```

## Usage Examples

### 1. Create Asset with Warranty Expiry Date
```json
POST /api/assets
{
  "name": "Dell Laptop",
  "serialNumber": "DL123456",
  "modelId": 1,
  "assetCategory": "HARDWARE",
  "status": "In stock",
  "ownerType": "Celcom",
  "acquisitionType": "Bought",
  "poNumber": "PO-2024-001",
  "warrantyExpiryDate": "2027-01-15"
}
```

**Result**: `warrantyExpiryDate` value saved to `extendedWarrantyExpiry` field in database.

### 2. Create Asset without Warranty Expiry Date
```json
POST /api/assets
{
  "name": "Software License",
  "serialNumber": "SW789012", 
  "modelId": 2,
  "assetCategory": "SOFTWARE",
  "status": "Active",
  "ownerType": "Celcom",
  "acquisitionType": "Bought",
  "poNumber": "PO-2024-002"
}
```

**Result**: No warranty date set (remains null).

### 3. Asset Response with Warranty Fields
```json
GET /api/assets/123
{
  "assetId": 123,
  "name": "Dell Laptop",
  "serialNumber": "DL123456",
  "warrantyExpiry": "2026-01-15",          // Manufacturer warranty
  "extendedWarrantyExpiry": "2027-01-15",   // Extended warranty (actual storage)
  "warrantyExpiryDate": "2027-01-15",       // Frontend field (mirror of extendedWarrantyExpiry)
  // ... other fields
}
```

## Field Priority Logic

### During Asset Creation/Update:
1. **Priority 1**: `warrantyExpiryDate` (if provided)
2. **Priority 2**: `extendedWarrantyExpiry` (if warrantyExpiryDate is null)
3. **Priority 3**: `null` (if both are null)

### During Asset Retrieval:
- `warrantyExpiry`: Shows manufacturer warranty
- `extendedWarrantyExpiry`: Shows extended warranty (actual database value)
- `warrantyExpiryDate`: Mirror of `extendedWarrantyExpiry` (for frontend compatibility)

## Independence from PO Warranty

### PO System:
```json
{
  "poNumber": "PO-2024-001",
  "warrantyExpiryDate": "2027-12-31",  // PO-level warranty
  "totalDevices": 10
}
```

### Asset System:
```json
{
  "poNumber": "PO-2024-001",
  "warrantyExpiryDate": "2026-06-30",  // Asset-specific warranty (different from PO)
  "name": "Device A"
}
```

**Key Point**: Asset warranty dates are NOT automatically copied from PO warranty dates.

## Benefits

### 1. User-Friendly Frontend
- Users can submit `warrantyExpiryDate` in Asset forms
- Clear field name that matches common usage
- Backward compatible with existing `extendedWarrantyExpiry` field

### 2. Data Consistency
- Single source of truth: `extendedWarrantyExpiry` in database
- Consistent mapping logic across all Asset operations
- Proper handling of null values

### 3. Independence from PO
- Asset warranty decisions independent of PO warranty
- Allows different warranty periods for individual assets
- Prevents unwanted data coupling between PO and Asset systems

### 4. Flexibility
- Supports both field names (`warrantyExpiryDate` and `extendedWarrantyExpiry`)
- Maintains backward compatibility
- Allows gradual frontend migration

## Migration Impact

### Existing Data
- No database changes required (uses existing `extendedWarrantyExpiry` column)
- Existing API calls continue to work
- No impact on current Asset records

### Frontend Updates
- Can use `warrantyExpiryDate` field for new forms
- `extendedWarrantyExpiry` field still supported
- Response includes both fields for compatibility

### API Compatibility
- **POST/PUT**: Accepts both `warrantyExpiryDate` and `extendedWarrantyExpiry`
- **GET**: Returns both fields (warrantyExpiryDate mirrors extendedWarrantyExpiry)
- **Backward Compatible**: Existing integrations continue to work

## Testing Scenarios

### ✅ Test Cases Covered
1. **Create Asset with warrantyExpiryDate**: Maps to extendedWarrantyExpiry
2. **Create Asset with extendedWarrantyExpiry**: Uses extendedWarrantyExpiry directly
3. **Create Asset with both fields**: Prioritizes warrantyExpiryDate
4. **Create Asset with neither field**: Both remain null
5. **Update Asset warranty**: Follows same priority logic
6. **Retrieve Asset**: Returns both fields correctly
7. **PO-Asset Independence**: Asset warranty independent of PO warranty

## Compilation Status
✅ **SUCCESSFUL** - All changes compiled without errors and are ready for use! 