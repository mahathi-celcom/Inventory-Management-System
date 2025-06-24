# Bulk Asset Creation by PO Number API Documentation

## Overview

The **Bulk Asset Creation by PO Number** API allows you to create multiple assets linked to a specific Purchase Order (PO) in a single atomic transaction. This endpoint automatically sets the `poNumber` field for all assets and validates that the PO exists before creating any assets.

## API Endpoint

**POST** `/api/assets/by-po/{poNumber}`

**Content-Type**: `application/json`

**Path Parameters:**
- `poNumber` (string, required): The Purchase Order number to link all assets to

**Request Body**: `BulkAssetByPORequest` object containing an array of `AssetRequestDTO` objects

## Request Format

```json
{
  "assets": [
    {
      "assetTag": "LAPTOP-001",
      "name": "Dell Laptop",
      "serialNumber": "DL2024001",
      "status": "Active",
      "ownerType": "Celcom",
      "acquisitionType": "Bought",
      "assetTypeId": 1,
      "makeId": 2,
      "modelId": 3,
      "vendorId": 4,
      "osVersionId": 5,
      "acquisitionPrice": 2500.00,
      "warrantyExpiry": "2025-12-31"
    }
  ]
}
```

## Response Format

### Success Response (HTTP 201 Created)

```json
{
  "poNumber": "PO-2025-023",
  "createdCount": 1,
  "failedCount": 0,
  "totalProcessed": 1,
  "message": "1 assets created successfully for PO-2025-023",
  "createdAssets": [
    {
      "assetId": 101,
      "name": "Dell Laptop",
      "serialNumber": "DL2024001",
      "status": "ACTIVE",
      "poNumber": "PO-2025-023"
    }
  ],
  "errors": []
}
```

## Key Features

### ✅ **Automatic PO Linking**
- The `poNumber` is automatically set for all assets in the request
- No need to specify `poNumber` in individual asset objects
- Validates that the PO exists before creating any assets

### ✅ **Atomic Transaction**
- All assets are processed in a single transaction
- Individual asset failures don't affect other assets in the batch

### ✅ **Comprehensive Validation**
- Validates PO existence before processing
- Validates each asset individually
- Checks for duplicate serial numbers, MAC addresses, IT asset codes

### ✅ **Detailed Error Reporting**
- Each error includes the asset index, field, message, and identifier
- Partial success scenarios are clearly indicated

## Usage Example

```bash
curl -X POST http://localhost:8080/api/assets/by-po/PO-2025-023 \
  -H "Content-Type: application/json" \
  -d '{
    "assets": [
      {
        "name": "Dell Laptop",
        "serialNumber": "DL2024001",
        "status": "Active",
        "ownerType": "Celcom",
        "acquisitionType": "Bought",
        "assetTypeId": 1,
        "makeId": 2,
        "modelId": 3,
        "vendorId": 4,
        "acquisitionPrice": 2500.00
      "poNumber": "PO-2025-023",
      "assetTypeId": 1,
      "makeId": 2,
      "modelId": 3,
      "vendorId": 4,
      "acquisitionPrice": 2500.00
    },
    {
      "assetId": 102,
      "name": "Dell Laptop 2",
      "serialNumber": "DL2024002",
      "status": "ACTIVE",
      "poNumber": "PO-2025-023",
      "assetTypeId": 1,
      "makeId": 2,
      "modelId": 3,
      "vendorId": 4,
      "acquisitionPrice": 2500.00
    }
  ],
  "errors": []
}
```

### Partial Success Response (HTTP 207 Multi-Status)

```json
{
  "poNumber": "PO-2025-023",
  "createdCount": 1,
  "failedCount": 1,
  "totalProcessed": 2,
  "message": "1 assets created, 1 failed for PO-2025-023",
  "createdAssets": [
    {
      "assetId": 101,
      "name": "Dell Laptop",
      "serialNumber": "DL2024001",
      "status": "ACTIVE",
      "poNumber": "PO-2025-023"
    }
  ],
  "errors": [
    {
      "index": 1,
      "field": "serialNumber",
      "message": "Serial number already exists: DL2024001",
      "assetIdentifier": "DL2024001"
    }
  ]
}
```

### Validation Error Response (HTTP 400 Bad Request)

```json
{
  "poNumber": "PO-2025-023",
  "createdCount": 0,
  "failedCount": 2,
  "totalProcessed": 2,
  "message": "All 2 assets failed to create for PO-2025-023",
  "createdAssets": [],
  "errors": [
    {
      "index": 0,
      "field": "validation",
      "message": "assetTypeId: Asset Type ID must be a positive number; name: Asset name is required and cannot be blank",
      "assetIdentifier": "INVALID-ASSET"
    },
    {
      "index": 1,
      "field": "resourceNotFound",
      "message": "Referenced resource not found: Asset Model ID 999 does not exist",
      "assetIdentifier": "ANOTHER-INVALID"
    }
  ]
}
```

## Key Features

### ✅ **Automatic PO Linking**
- The `poNumber` is automatically set for all assets in the request
- No need to specify `poNumber` in individual asset objects
- Validates that the PO exists before creating any assets

### ✅ **Atomic Transaction**
- All assets are processed in a single transaction
- If any critical errors occur, the entire operation is rolled back
- Individual asset failures don't affect other assets in the batch

### ✅ **Comprehensive Validation**
- Validates PO existence before processing
- Validates each asset individually
- Checks for duplicate serial numbers, MAC addresses, IT asset codes
- Validates foreign key references (asset types, models, vendors, etc.)

### ✅ **Detailed Error Reporting**
- Each error includes the asset index, field, message, and identifier
- Partial success scenarios are clearly indicated
- Comprehensive logging for debugging

### ✅ **Flexible Response Handling**
- **HTTP 201**: All assets created successfully
- **HTTP 207**: Some assets created, some failed (partial success)
- **HTTP 400**: All assets failed validation/creation

## Validation Rules

### Required Fields
- `name`: Asset name (2-100 characters)
- `serialNumber`: Unique serial number (3-50 characters)
- `status`: Must be one of: "Active", "In stock", "Broken", "In Repair", "Ceased"
- `ownerType`: Must be one of: "Celcom", "Vendor"
- `acquisitionType`: Must be one of: "Bought", "Lease", "Rental"
- `modelId`: Must be a valid Asset Model ID

### Optional Fields
- `assetTypeId`: Positive number (can be derived from model)
- `makeId`: Positive number (can be derived from model)
- `vendorId`: Positive number
- `osVersionId`: Positive number
- `acquisitionPrice`: Positive decimal
- `warrantyExpiry`: Valid date
- `itAssetCode`: Unique if provided
- `macAddress`: Unique if provided

### Business Rules
- PO must exist in the system
- Serial numbers must be unique across all assets
- IT asset codes must be unique if provided
- MAC addresses must be unique if provided
- Foreign key references must exist (asset types, models, vendors, OS versions, users)

## Error Types and Solutions

### 1. PO Not Found
**Error**: `"Purchase Order not found with PO Number: PO-INVALID"`
**Solution**: Ensure the PO number exists in the system before creating assets

### 2. Duplicate Serial Number
**Error**: `"Serial number already exists: ABC123"`
**Solution**: Use unique serial numbers for each asset

### 3. Invalid Foreign Key References
**Error**: `"Asset Model ID 999 does not exist"`
**Solution**: Use valid IDs that exist in the database

### 4. Validation Failures
**Error**: `"Asset name is required and cannot be blank"`
**Solution**: Ensure all required fields are provided with valid values

## Usage Examples

### cURL Example

```bash
curl -X POST http://localhost:8080/api/assets/by-po/PO-2025-023 \
  -H "Content-Type: application/json" \
  -d '{
    "assets": [
      {
        "name": "Dell Laptop",
        "serialNumber": "DL2024001",
        "status": "Active",
        "ownerType": "Celcom",
        "acquisitionType": "Bought",
        "assetTypeId": 1,
        "makeId": 2,
        "modelId": 3,
        "vendorId": 4,
        "acquisitionPrice": 2500.00
      }
    ]
  }'
```

### JavaScript Example

```javascript
const response = await fetch('/api/assets/by-po/PO-2025-023', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    assets: [
      {
        name: 'Dell Laptop',
        serialNumber: 'DL2024001',
        status: 'Active',
        ownerType: 'Celcom',
        acquisitionType: 'Bought',
        assetTypeId: 1,
        makeId: 2,
        modelId: 3,
        vendorId: 4,
        acquisitionPrice: 2500.00
      }
    ]
  })
});

const result = await response.json();
console.log(`Created ${result.createdCount} assets for ${result.poNumber}`);
```

## Best Practices

1. **Validate Data Client-Side**: Pre-validate asset data before sending to reduce server-side errors
2. **Handle Partial Success**: Always check both `createdCount` and `failedCount` in responses
3. **Batch Size**: Limit to 100-500 assets per request to avoid timeouts
4. **Unique Identifiers**: Ensure serial numbers and IT asset codes are unique
5. **Error Handling**: Implement retry logic for failed assets with transient errors
6. **Logging**: Monitor application logs for detailed error information

## Monitoring and Debugging

### Enable Debug Logging
```properties
# application.properties
logging.level.com.inventory.system.controller.AssetController=DEBUG
logging.level.com.inventory.system.service.impl.AssetServiceImpl=DEBUG
```

### Log Patterns to Monitor
- `=== BULK ASSET CREATION BY PO REQUEST ===`
- `Processing asset[0] for PO PO-2025-023: DL2024001`
- `Successfully created asset[0] with ID: 101 for PO PO-2025-023`
- `Validation failed for asset[1] in PO PO-2025-023: ...`

## Comparison with General Bulk Creation

| Feature | `/api/assets/bulk` | `/api/assets/by-po/{poNumber}` |
|---------|-------------------|--------------------------------|
| PO Linking | Manual (specify in each asset) | Automatic (from path parameter) |
| PO Validation | Per asset | Once before processing |
| Use Case | General bulk creation | PO-specific asset creation |
| Request Format | `List<AssetRequestDTO>` | `BulkAssetByPORequest` |
| Response Format | `BulkAssetResponse` | `BulkAssetByPOResponse` |

This new endpoint provides a more convenient and safer way to create assets for a specific Purchase Order, with automatic PO linking and validation. 