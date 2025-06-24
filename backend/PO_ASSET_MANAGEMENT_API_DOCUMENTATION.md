# PO-Asset Management API Documentation

This document provides comprehensive documentation for the new PO-Asset management features implemented in the Inventory Management System.

## Overview

The PO-Asset management system provides four key features:

1. **Fetch All Assets for a Given PO** - Retrieve editable asset forms when clicking on PO rows
2. **Get PO Summary** - Display total devices, linked assets, and remaining assets count
3. **Delete PO with Cascading Asset Deletion** - Safe deletion with warnings and atomic transactions
4. **Delete Individual Assets from PO** - Remove specific assets while maintaining PO consistency

## API Endpoints

### 1. Fetch All Assets for a Given PO

**Endpoint:** `GET /api/asset-pos/{poNumber}/assets`

**Description:** Retrieves all assets linked to a specific Purchase Order by PO Number.

**Parameters:**
- `poNumber` (path) - The PO Number to fetch assets for

**Response:**
```json
[
  {
    "assetId": 1,
    "name": "Dell Laptop 123",
    "serialNumber": "DL123456",
    "itAssetCode": "IT001",
    "status": "Active",
    "poNumber": "PO-2024-001",
    "acquisitionDate": "2024-01-15",
    "assetTypeId": 1,
    "makeId": 2,
    "modelId": 3,
    // ... other asset fields
  }
]
```

**Use Cases:**
- Display editable asset forms when user clicks on PO row
- Show all assets associated with a purchase order
- Enable bulk asset operations by PO

---

### 2. Get PO Summary

**Endpoint:** `GET /api/asset-pos/{poNumber}/summary`

**Description:** Returns summary information about a PO including total devices, linked assets count, and remaining assets that can be created.

**Parameters:**
- `poNumber` (path) - The PO Number to get summary for

**Response:**
```json
{
  "poNumber": "PO-2024-001",
  "totalDevices": 10,
  "linkedAssetsCount": 7,
  "remainingAssets": 3,
  "canCreateMoreAssets": true
}
```

**Use Cases:**
- Dynamically show/hide "Create Remaining Assets" button
- Display progress indicators for PO completion
- Validate asset creation constraints

---

### 3a. Get PO Deletion Warning

**Endpoint:** `GET /api/asset-pos/{poNumber}/deletion-warning`

**Description:** Returns warning information about what will be deleted when removing a PO.

**Parameters:**
- `poNumber` (path) - The PO Number to check for deletion

**Response:**
```json
{
  "poNumber": "PO-2024-001",
  "linkedAssetsCount": 3,
  "hasLinkedAssets": true,
  "warningMessage": "Warning: This PO has 3 linked assets that will also be deleted. This action cannot be undone.",
  "linkedAssets": [
    {
      "assetId": 1,
      "name": "Dell Laptop 123",
      "serialNumber": "DL123456"
      // ... asset preview data
    }
  ]
}
```

**Use Cases:**
- Show warning dialog before PO deletion
- Preview assets that will be affected
- Allow user to confirm or cancel deletion

---

### 3b. Delete PO with Cascading Asset Deletion

**Endpoint:** `DELETE /api/asset-pos/{poNumber}/cascade`

**Description:** Deletes a PO and all its linked assets in a single atomic transaction.

**Parameters:**
- `poNumber` (path) - The PO Number to delete

**Response:**
```json
{
  "message": "PO and linked assets deleted successfully",
  "poNumber": "PO-2024-001",
  "deletedAssetsCount": 3
}
```

**Transaction Safety:**
- All operations are wrapped in a single transaction
- If any step fails, the entire operation is rolled back
- Assets are soft-deleted (marked as deleted=true)
- PO is hard-deleted from the database

**Process:**
1. Validate PO exists
2. Find all linked assets
3. Soft delete all assets
4. Delete PO record
5. Return summary of deleted items

---

### 4. Delete Individual Asset from PO

**Endpoint:** `DELETE /api/asset-pos/assets/{assetId}`

**Description:** Deletes a single asset by asset ID without affecting the parent PO.

**Parameters:**
- `assetId` (path) - The Asset ID to delete

**Response (Success):**
```json
{
  "message": "Asset deleted successfully",
  "assetId": 123,
  "deleted": true
}
```

**Response (Not Found):**
```json
{
  "message": "Asset not found or already deleted",
  "assetId": 123,
  "deleted": false
}
```

**Use Cases:**
- Remove individual assets from a PO
- Clean up incorrect asset assignments
- Maintain PO integrity while removing specific items

---

## Implementation Summary

✅ **Feature 1: Fetch All Assets for a Given PO (via PO Number)**
- Endpoint: `GET /api/asset-pos/{poNumber}/assets`
- Returns list of AssetDTO objects for frontend forms
- Validates PO existence before fetching assets
- Uses existing AssetRepository.findByPoNumber() method

✅ **Feature 2: Get Summary for a PO: Total Devices, Linked Assets, and Remaining**
- Endpoint: `GET /api/asset-pos/{poNumber}/summary`
- Returns POSummaryDTO with calculated remaining assets
- Enables dynamic "Create Remaining Assets" button display
- Enforces totalDevices constraint validation

✅ **Feature 3: Delete PO with Warning and Cascading Asset Deletion**
- Warning endpoint: `GET /api/asset-pos/{poNumber}/deletion-warning`
- Deletion endpoint: `DELETE /api/asset-pos/{poNumber}/cascade`
- Atomic transaction ensures data consistency
- Soft deletes assets, hard deletes PO

✅ **Feature 4: Delete Individual Asset from PO**
- Endpoint: `DELETE /api/asset-pos/assets/{assetId}`
- Soft deletes individual assets without affecting PO
- Returns boolean success indicator
- Maintains referential integrity

## Technical Implementation

**Services Modified:**
- `AssetPOService` interface - Added 5 new method signatures
- `AssetPOServiceImpl` class - Implemented all new methods with proper transaction management

**Controllers Modified:**
- `AssetPOController` - Added 5 new REST endpoints with proper HTTP methods and response codes

**DTOs Created:**
- `POSummaryDTO` - Summary information with helper methods
- `PODeletionWarningDTO` - Warning information with factory methods

**Key Features:**
- Comprehensive logging throughout all operations
- Proper exception handling with ResourceNotFoundException
- Transaction safety with @Transactional annotations
- Reuse of existing AssetMapper for consistency
- Soft deletion for audit trail preservation
- Clean JSON responses for frontend integration

All endpoints follow REST conventions and return appropriate HTTP status codes.

## Implementation Details

### Service Layer

**AssetPOService Interface:**
```java
// New methods added
List<AssetDTO> getAssetsByPONumber(String poNumber);
POSummaryDTO getPOSummary(String poNumber);
PODeletionWarningDTO getPODeletionWarning(String poNumber);
int deleteAssetPOWithCascade(String poNumber);
boolean deleteIndividualAsset(Long assetId);
```

**AssetPOServiceImpl:**
- Uses existing AssetRepository and AssetMapper for consistency
- Implements proper transaction management
- Includes comprehensive logging
- Handles edge cases and error scenarios

### Data Transfer Objects

**POSummaryDTO:**
```java
{
  String poNumber;
  Integer totalDevices;
  Integer linkedAssetsCount;
  Integer remainingAssets;
  boolean canCreateMoreAssets;
}
```

**PODeletionWarningDTO:**
```java
{
  String poNumber;
  Integer linkedAssetsCount;
  boolean hasLinkedAssets;
  String warningMessage;
  List<AssetDTO> linkedAssets;
}
```

### Database Operations

**Relationships:**
- Assets link to POs via `poNumber` (string foreign key)
- PO table has `totalDevices` field for constraint validation
- Asset table has `deleted` field for soft deletion

**Constraints:**
- `totalDevices` constraint is enforced in business logic
- PO number uniqueness is maintained
- Referential integrity is preserved during cascading operations

---

## Error Handling

All endpoints return appropriate HTTP status codes and JSON error responses:

- `200 OK` - Successful operation
- `404 Not Found` - PO or Asset not found
- `400 Bad Request` - Invalid request parameters
- `500 Internal Server Error` - Unexpected server errors

**Global Exception Handler:**
- `ResourceNotFoundException` → 404 Not Found
- `ConflictException` → 409 Conflict
- `IllegalArgumentException` → 400 Bad Request
- Generic exceptions → 500 Internal Server Error

---

## Testing

### Manual Testing Examples

**1. Test Asset Retrieval:**
```bash
curl -X GET "http://localhost:8080/api/asset-pos/PO-2024-001/assets"
```

**2. Test PO Summary:**
```bash
curl -X GET "http://localhost:8080/api/asset-pos/PO-2024-001/summary"
```

**3. Test Deletion Warning:**
```bash
curl -X GET "http://localhost:8080/api/asset-pos/PO-2024-001/deletion-warning"
```

**4. Test Cascading Deletion:**
```bash
curl -X DELETE "http://localhost:8080/api/asset-pos/PO-2024-001/cascade"
```

**5. Test Individual Asset Deletion:**
```bash
curl -X DELETE "http://localhost:8080/api/asset-pos/assets/123"
```

### Integration Testing

The implementation includes proper transaction management and can be tested with:
- Multiple concurrent operations
- Database rollback scenarios
- Large datasets with many linked assets
- Edge cases (empty POs, non-existent assets)

---

## Frontend Integration

### Usage Examples

**Display Assets for PO Row:**
```javascript
async function loadAssetsForPO(poNumber) {
  const response = await fetch(`/api/asset-pos/${poNumber}/assets`);
  const assets = await response.json();
  // Render editable asset forms
}
```

**Show/Hide Create Assets Button:**
```javascript
async function updateCreateButton(poNumber) {
  const response = await fetch(`/api/asset-pos/${poNumber}/summary`);
  const summary = await response.json();
  
  const createButton = document.getElementById('create-assets-btn');
  createButton.style.display = summary.canCreateMoreAssets ? 'block' : 'none';
  createButton.textContent = `Create ${summary.remainingAssets} Remaining Assets`;
}
```

**Deletion Confirmation:**
```javascript
async function confirmPODeletion(poNumber) {
  const response = await fetch(`/api/asset-pos/${poNumber}/deletion-warning`);
  const warning = await response.json();
  
  if (confirm(warning.warningMessage)) {
    await fetch(`/api/asset-pos/${poNumber}/cascade`, { method: 'DELETE' });
  }
}
```

---

## Security Considerations

- All endpoints respect existing CORS configuration
- Transactions ensure data consistency
- Soft deletion preserves audit trails
- Proper validation prevents data corruption

---

## Performance Notes

- Asset retrieval uses efficient repository queries
- Bulk operations are optimized for large datasets
- Transactions are kept minimal for better performance
- Logging provides insights for performance monitoring 