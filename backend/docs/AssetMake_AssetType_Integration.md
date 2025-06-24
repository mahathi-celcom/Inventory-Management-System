# AssetMake and AssetType Integration

This document outlines the changes made to integrate AssetType with AssetMake, creating a foreign key relationship between the two entities.

## Overview

The integration adds an `asset_type_id` foreign key column to the `asset_make` table, establishing a many-to-one relationship where:
- Multiple AssetMakes can belong to one AssetType
- AssetType categorizes AssetMakes (e.g., "Laptop" AssetType can have Dell, HP, Lenovo AssetMakes)

## Database Changes

### Migration Script: V004__add_asset_type_to_make.sql

```sql
-- Add asset_type_id column to asset_make table
ALTER TABLE asset_make 
ADD COLUMN asset_type_id INT;

-- Add foreign key constraint
ALTER TABLE asset_make 
ADD CONSTRAINT fk_asset_make_asset_type 
FOREIGN KEY (asset_type_id) REFERENCES asset_type(asset_type_id);

-- Add index for better performance
CREATE INDEX idx_asset_make_asset_type_id ON asset_make(asset_type_id);
```

## Model Changes

### AssetMake Entity
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "asset_type_id")
private AssetType assetType;
```

### AssetMakeDTO
```java
private Long assetTypeId;
private String assetTypeName;
```

## Repository Enhancements

### AssetMakeRepository
New query methods added:
- `findByAssetTypeId(Long assetTypeId, Pageable pageable)`
- `findByAssetTypeId(Long assetTypeId)`
- `findByNameContainingIgnoreCase(String name, Pageable pageable)`
- `findMakesByAssetType(Long assetTypeId, Pageable pageable)`
- `existsByNameAndAssetTypeId(String name, Long assetTypeId)`

### AssetModelRepository
New query methods added to support asset type filtering:
- `findByAssetTypeId(Long assetTypeId, Pageable pageable)`
- `findByAssetTypeId(Long assetTypeId)`
- `findByMakeIdAndAssetTypeId(Long makeId, Long assetTypeId, Pageable pageable)`

## Service Layer Changes

### AssetMakeService Interface
New methods:
- `getAssetMakesByAssetType(Long assetTypeId, Pageable pageable)`
- `getAllAssetMakesByAssetType(Long assetTypeId)`
- `searchAssetMakes(String name, Pageable pageable)`

### AssetMakeServiceImpl
- Enhanced `convertToDTO()` to include assetTypeId and assetTypeName
- Enhanced `updateAssetMakeFromDTO()` to handle AssetType relationship
- Added validation to ensure AssetType exists before creating/updating AssetMake

## Controller Enhancements

### New Endpoints in AssetMakeController

1. **Get Asset Makes by Asset Type (Paginated)**
   ```
   GET /api/asset-makes/by-asset-type/{assetTypeId}
   Parameters: page, size, sortBy, sortDir
   ```

2. **Get All Asset Makes by Asset Type**
   ```
   GET /api/asset-makes/by-asset-type/{assetTypeId}/all
   ```

3. **Search Asset Makes**
   ```
   GET /api/asset-makes/search?name={searchTerm}
   Parameters: name, page, size, sortBy, sortDir
   ```

## API Usage Examples

### Create AssetMake with AssetType
```json
POST /api/asset-makes
{
    "name": "Dell",
    "assetTypeId": 1
}
```

### Update AssetMake
```json
PUT /api/asset-makes/1
{
    "name": "Dell Technologies",
    "assetTypeId": 1
}
```

### Response Format
```json
{
    "id": 1,
    "name": "Dell",
    "assetTypeId": 1,
    "assetTypeName": "Laptop"
}
```

### Get Asset Makes by Type
```
GET /api/asset-makes/by-asset-type/1?page=0&size=10&sortBy=name&sortDir=ASC
```

### Search Asset Makes
```
GET /api/asset-makes/search?name=dell&page=0&size=10
```

## Data Integrity

### Constraints
- `asset_type_id` can be NULL (optional relationship)
- Foreign key constraint ensures referential integrity
- Index on `asset_type_id` for performance optimization

### Validation
- AssetType existence is validated before creating/updating AssetMake
- ResourceNotFoundException thrown for invalid AssetType IDs

## Impact on Related Entities

### AssetModel
- Can now query models by AssetType through the AssetMake relationship
- Enhanced repository with new query methods supporting AssetType filtering

### Asset
- No direct changes required as Asset already references both AssetType and AssetMake
- The relationship provides better data organization and filtering capabilities

## Migration Considerations

1. **Existing Data**: The `asset_type_id` column allows NULL values to maintain compatibility with existing AssetMake records
2. **Performance**: Added index ensures efficient queries on the new foreign key
3. **Backward Compatibility**: All existing API endpoints continue to work without changes

## Testing

Recommended test cases:
1. Create AssetMake with valid AssetType
2. Create AssetMake with invalid AssetType (should fail)
3. Create AssetMake without AssetType (should succeed with NULL)
4. Update AssetMake to change AssetType
5. Query AssetMakes by AssetType
6. Search AssetMakes by name
7. Verify cascade behavior when AssetType is referenced by AssetMakes

## Future Enhancements

1. **Business Rules**: Consider adding validation to ensure AssetMake-AssetType combinations make business sense
2. **Unique Constraints**: Possibly add unique constraint on (make_name, asset_type_id) if business rules require it
3. **Cascading Operations**: Consider adding cascade delete/update policies based on business requirements
4. **Audit Trail**: Track changes to AssetType associations in AssetMake records 