# Asset Bulk Operations Implementation

## Overview
Enhanced the AssetController, AssetService, and AssetRepository with comprehensive bulk operations support for efficient asset management.

## New Features Implemented

### 1. Bulk Asset Creation
- **Endpoint**: `POST /api/assets/bulk`
- **Input**: `List<AssetRequestDTO>` 
- **Output**: `BulkAssetResponse` with detailed success/failure tracking
- **Features**:
  - Individual validation for each asset
  - Duplicate serial number and IT asset code detection
  - Detailed error tracking with index and field-level information
  - Audit logging for each created asset
  - Transactional safety (all-or-nothing per asset)

### 2. Bulk Update by PO Number
- **Endpoint**: `PUT /api/assets/by-po/{poNumber}`
- **Input**: `AssetUpdateDTO` (partial update object)
- **Logic**: Updates all assets where `poNumber = :poNumber`
- **Features**:
  - Partial updates (only provided fields are updated)
  - Validates related entities (users, vendors, OS, etc.)
  - Audit logging for each updated asset
  - Graceful error handling (continues with other assets if one fails)

### 3. Bulk Delete by PO Number
- **Endpoint**: `DELETE /api/assets/by-po/{poNumber}`
- **Logic**: Soft deletes all assets associated with the given PO
- **Features**:
  - Soft delete implementation (sets `deleted = true`)
  - Audit logging for each deleted asset
  - Graceful error handling

## New DTOs Created

### AssetRequestDTO
```java
@Data
@EqualsAndHashCode(callSuper = true)
public class AssetRequestDTO extends AssetDTO {
    private String batchId; // Optional grouping field
    private Integer sequence; // Optional ordering field
}
```

### AssetUpdateDTO
```java
@Data
public class AssetUpdateDTO {
    // All fields are optional for partial updates
    private String name;
    private String status;
    private String ownerType;
    // ... other updatable fields
}
```

### BulkAssetResponse
```java
@Data
@Builder
public class BulkAssetResponse {
    private int successCount;
    private int failureCount;
    private int totalProcessed;
    private List<BulkAssetError> errors;
    private List<AssetDTO> successfulAssets;
    
    @Data
    @Builder
    public static class BulkAssetError {
        private int index;
        private String field;
        private String message;
        private String assetIdentifier;
    }
}
```

## Repository Enhancements

### New AssetRepository Methods
```java
// Find assets by PO number
@Query("SELECT a FROM Asset a WHERE a.deleted = false AND a.poNumber = :poNumber")
List<Asset> findByPoNumber(@Param("poNumber") String poNumber);

// Bulk delete by PO number
@Modifying
@Transactional
@Query("DELETE FROM Asset a WHERE a.deleted = false AND a.poNumber = :poNumber")
int deleteByPoNumber(@Param("poNumber") String poNumber);
```

## Service Layer Implementation

### AssetService Interface
```java
// New bulk operation methods
BulkAssetResponse createAssetsInBulk(List<AssetRequestDTO> requests);
void updateAssetsByPO(String poNumber, AssetUpdateDTO updates);
void deleteAssetsByPO(String poNumber);
```

### AssetServiceImpl Key Features
- **Validation Integration**: Uses Bean Validation (`Validator`) for request validation
- **Error Handling**: Comprehensive error tracking and logging
- **Audit Integration**: Full audit trail for all bulk operations
- **Transaction Management**: Proper transaction boundaries
- **Graceful Degradation**: Continues processing even if individual items fail

## Controller Implementation

### Bulk Endpoints
```java
@PostMapping(value = "/bulk", produces = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<BulkAssetResponse> createAssetsInBulk(@Valid @RequestBody List<AssetRequestDTO> requests)

@PutMapping(value = "/by-po/{poNumber}", produces = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<String> updateAssetsByPO(@PathVariable String poNumber, @Valid @RequestBody AssetUpdateDTO updateData)

@DeleteMapping(value = "/by-po/{poNumber}", produces = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<String> deleteAssetsByPO(@PathVariable String poNumber)
```

## Key Implementation Details

### 1. Validation Strategy
- Bean validation for individual requests
- Business logic validation (duplicate checks)
- Graceful handling of validation failures

### 2. Error Tracking
- Index-based error tracking for bulk creation
- Field-level error information
- Asset identifier for easy error resolution

### 3. Audit Integration
- All bulk operations are logged with specific action types:
  - `BULK_CREATE` for bulk creation
  - `BULK_UPDATE_BY_PO` for PO-based updates
  - `BULK_DELETE_BY_PO` for PO-based deletion

### 4. Performance Considerations
- Uses batch repository operations where possible
- Minimizes database round trips
- Efficient error collection and reporting

## Usage Examples

### Bulk Creation
```json
POST /api/assets/bulk
[
  {
    "assetTypeId": 1,
    "makeId": 1,
    "modelId": 1,
    "name": "Laptop 1",
    "serialNumber": "SN001",
    "status": "Active",
    "ownerType": "Company",
    "acquisitionType": "Purchase",
    "poNumber": "PO-2024-001"
  },
  {
    "assetTypeId": 1,
    "makeId": 1,
    "modelId": 1,
    "name": "Laptop 2",
    "serialNumber": "SN002",
    "status": "Active",
    "ownerType": "Company",
    "acquisitionType": "Purchase",
    "poNumber": "PO-2024-001"
  }
]
```

### Bulk Update
```json
PUT /api/assets/by-po/PO-2024-001
{
  "status": "Maintenance",
  "inventoryLocation": "Warehouse B",
  "currentUserId": 123
}
```

### Bulk Delete
```
DELETE /api/assets/by-po/PO-2024-001
```

## Benefits
1. **Efficiency**: Process multiple assets in single operations
2. **Consistency**: Ensures data integrity across related assets
3. **Audit Trail**: Complete tracking of all bulk operations
4. **Error Resilience**: Graceful handling of individual failures
5. **Flexibility**: Partial updates and optional field handling
6. **Integration**: Seamless integration with existing asset management workflow

## Future Enhancements
- Async processing for very large bulk operations
- Progress tracking for long-running operations
- Bulk validation rules and business logic
- Export/import capabilities for bulk operations
- Enhanced error reporting and correction workflows 