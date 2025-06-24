# Asset Form Behavior Changes

## Overview
The asset form has been simplified to match the backend database structure and requirements. The form now contains only one dropdown for Asset Model, with Asset Type and Asset Make being auto-populated as read-only fields.

## Key Changes

### 1. Form Structure
- **Before**: Three separate dropdowns (Asset Type, Asset Make, Asset Model)
- **After**: One dropdown (Asset Model) + two read-only fields (Asset Type, Asset Make)

### 2. Database Alignment
The form now aligns with the backend database structure:
```sql
asset_model (model_id, make_id, model_name, ram, storage, processor, status)
asset_make (make_id, make_name, type_id)
asset_type (type_id, type_name)
```

### 3. Status Options
- **Before**: Active, Inactive, Maintenance, Retired, Disposed
- **After**: Active, Inactive only

### 4. User Assignment
- On asset creation: `current_user_id` is set to `null`
- After asset tag assignment: `current_user_id` is updated to assigned user's `fullNameOrOfficeName`

## Technical Implementation

### New Interfaces
```typescript
interface AssetModelWithDetails extends DropdownOption {
  makeId: number;
  makeName: string;
  typeId: number;
  typeName: string;
  ram?: string;
  storage?: string;
  processor?: string;
}
```

### Component Changes
- Removed `assetTypes`, `assetMakes`, `assetModels`, `filteredModels` signals
- Added `assetModelsWithDetails`, `selectedAssetType`, `selectedAssetMake` signals
- Updated form initialization to remove `typeId` and `makeId` fields
- Modified `autoFillModelDetails()` to populate read-only fields
- Updated form dependencies to only handle model selection

### Service Changes
- Added `getAssetModelsWithDetails()` method that combines model, make, and type data
- Updated cache structure to include `assetModelsWithDetails`
- Method uses `forkJoin` to combine data from existing endpoints

### Template Changes
- Replaced three dropdowns with one Asset Model dropdown
- Added two read-only display fields for Asset Type and Asset Make
- Updated filter dropdown to use model data for type filtering

## Form Behavior

### When User Selects Asset Model:
1. Asset Type field automatically displays the associated type name
2. Asset Make field automatically displays the associated make name
3. Both fields are read-only and cannot be edited directly

### Form Validation:
- Only Asset Model selection is required
- Asset Type and Make are automatically populated, no validation needed

### Creation vs Edit:
- **Creation**: `currentUserId` set to `null`, type/make fields empty until model selected
- **Edit**: Auto-populate type/make fields if model is already selected

## Color Coding
The component maintains consistent color-coding across pages based on:
- Asset status (Active/Inactive)
- Asset type (from the auto-populated type field)

## Testing
Updated test cases to:
- Remove validation tests for removed fields (`typeId`, `makeId`)
- Add tests for auto-population behavior
- Verify `currentUserId` is null on creation
- Test the new `AssetModelWithDetails` interface

## Backend API Requirements
The frontend expects the backend API to return asset models with their related make and type information. The current implementation uses existing endpoints and combines the data, but ideally the backend should provide a dedicated endpoint:

```
GET /api/asset-models/with-details
```

Response format:
```json
[
  {
    "id": 1,
    "name": "MacBook Pro 16\"",
    "makeId": 1,
    "makeName": "Apple",
    "typeId": 1,
    "typeName": "Laptop",
    "ram": "32GB",
    "storage": "1TB SSD",
    "processor": "M2 Pro"
  }
]
``` 