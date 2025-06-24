# Bulk Asset Creation API Guide

## Overview

The Bulk Asset Creation API (`/api/assets/bulk`) allows you to create multiple assets in a single request. This guide covers proper usage, error handling, validation, and debugging techniques.

## API Endpoint

**POST** `/api/assets/bulk`

**Content-Type**: `application/json`

**Request Body**: JSON array of `AssetRequestDTO` objects

## Enhanced Features

### ✅ 1. Proper Request Body Mapping

The controller properly maps the request body to `List<AssetRequestDTO>` using `@RequestBody`:

```java
@PostMapping(value = "/bulk", produces = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<BulkAssetResponse> createAssetsInBulk(
        @Valid @RequestBody List<AssetRequestDTO> requests) {
    // Implementation
}
```

### ✅ 2. Comprehensive Logging

- **Request Logging**: Complete request payload is logged for debugging
- **Processing Logging**: Each asset processing step is logged
- **Error Logging**: Detailed error information with context
- **Success Logging**: Summary of successful operations

**Enable Debug Logging** in `application.properties`:
```properties
logging.level.com.inventory.system.controller.AssetController=DEBUG
logging.level.com.inventory.system.service.impl.AssetServiceImpl=DEBUG
```

### ✅ 3. Advanced Exception Handling

The API handles multiple types of exceptions:
- **ValidationException**: Bean validation failures
- **DataIntegrityViolationException**: Database constraint violations
- **ResourceNotFoundException**: Referenced entities not found
- **IllegalArgumentException**: Invalid input parameters
- **RuntimeException**: Unexpected errors

### ✅ 4. Detailed Error Messages

Instead of generic "Transaction rollback" errors, you get specific messages:

```json
{
  "successCount": 2,
  "failureCount": 1,
  "totalProcessed": 3,
  "errors": [
    {
      "index": 1,
      "field": "serialNumber",
      "message": "Serial number 'ABC123' already exists",
      "assetIdentifier": "ABC123"
    }
  ],
  "successfulAssets": [...]
}
```

### ✅ 5. Bean Validation with @Valid

All DTOs are validated using Jakarta Bean Validation annotations:

```java
@NotBlank(message = "Serial number is required and cannot be blank")
@Size(min = 3, max = 50, message = "Serial number must be between 3 and 50 characters")
private String serialNumber;

@Pattern(regexp = "^(ACTIVE|INACTIVE|IN_REPAIR|RETIRED|DISPOSED)$", 
         message = "Status must be one of: ACTIVE, INACTIVE, IN_REPAIR, RETIRED, DISPOSED")
private String status;
```

## Request Examples

### Example 1: Valid Bulk Request

```json
[
  {
    "assetTypeId": 1,
    "makeId": 2,
    "modelId": 3,
    "name": "Laptop Dell Inspiron 001",
    "serialNumber": "DL2024001",
    "status": "ACTIVE",
    "ownerType": "COMPANY",
    "acquisitionType": "PURCHASE",
    "currentUserId": 1,
    "vendorId": 1,
    "acquisitionPrice": 1200.00,
    "inventoryLocation": "Office Floor 1"
  },
  {
    "assetTypeId": 1,
    "makeId": 2,
    "modelId": 3,
    "name": "Laptop Dell Inspiron 002",
    "serialNumber": "DL2024002",
    "status": "ACTIVE",
    "ownerType": "COMPANY",
    "acquisitionType": "PURCHASE",
    "currentUserId": 2,
    "vendorId": 1,
    "acquisitionPrice": 1200.00,
    "inventoryLocation": "Office Floor 1"
  }
]
```

### Example 2: Request with Validation Errors

```json
[
  {
    "assetTypeId": -1,
    "name": "",
    "serialNumber": "AB",
    "status": "INVALID_STATUS",
    "ownerType": "",
    "acquisitionType": ""
  }
]
```

## Response Examples

### Success Response (HTTP 201 Created)

```json
{
  "successCount": 2,
  "failureCount": 0,
  "totalProcessed": 2,
  "errors": [],
  "successfulAssets": [
    {
      "assetId": 101,
      "name": "Laptop Dell Inspiron 001",
      "serialNumber": "DL2024001",
      "status": "ACTIVE",
      // ... other fields
    },
    {
      "assetId": 102,
      "name": "Laptop Dell Inspiron 002",
      "serialNumber": "DL2024002",
      "status": "ACTIVE",
      // ... other fields
    }
  ]
}
```

### Partial Success Response (HTTP 207 Multi-Status)

```json
{
  "successCount": 1,
  "failureCount": 1,
  "totalProcessed": 2,
  "errors": [
    {
      "index": 1,
      "field": "serialNumber",
      "message": "Serial number 'DL2024001' already exists",
      "assetIdentifier": "DL2024001"
    }
  ],
  "successfulAssets": [
    {
      "assetId": 103,
      "name": "Laptop Dell Inspiron 002",
      "serialNumber": "DL2024002",
      "status": "ACTIVE"
    }
  ]
}
```

### Validation Error Response (HTTP 400 Bad Request)

```json
{
  "successCount": 0,
  "failureCount": 1,
  "totalProcessed": 1,
  "errors": [
    {
      "index": 0,
      "field": "validation",
      "message": "assetTypeId: Asset Type ID must be a positive number; name: Asset name is required and cannot be blank; serialNumber: Serial number must be between 3 and 50 characters; status: Status must be one of: ACTIVE, INACTIVE, IN_REPAIR, RETIRED, DISPOSED",
      "assetIdentifier": "AB"
    }
  ],
  "successfulAssets": []
}
```

## Error Types and Solutions

### 1. Validation Errors

**Error**: `"Status must be one of: ACTIVE, INACTIVE, IN_REPAIR, RETIRED, DISPOSED"`

**Solution**: Use only valid status values:
```json
{
  "status": "ACTIVE"  // ✅ Valid
  // "status": "INVALID" // ❌ Invalid
}
```

### 2. Duplicate Serial Number

**Error**: `"Serial number 'ABC123' already exists"`

**Solution**: Ensure unique serial numbers:
```json
{
  "serialNumber": "UNIQUE_SERIAL_001"  // ✅ Unique
}
```

### 3. Missing Foreign Key References

**Error**: `"Asset Type ID 999 does not exist"`

**Solution**: Use valid IDs that exist in the database:
```json
{
  "assetTypeId": 1,  // ✅ Valid existing ID
  "modelId": 5,      // ✅ Valid existing ID
  "vendorId": 3      // ✅ Valid existing ID
}
```

### 4. Data Integrity Violations

**Error**: `"Invalid reference to related entity - check asset type, make, model, user, vendor, or OS IDs"`

**Solution**: Verify all referenced entities exist before bulk creation.

## Debugging Tips

### 1. Enable Debug Logging

Add to `application.properties`:
```properties
logging.level.com.inventory.system=DEBUG
```

### 2. Check Logs for Detailed Information

Look for these log patterns:
- `=== BULK ASSET CREATION REQUEST ===`
- `Processing asset[0]: SERIAL123`
- `Successfully created asset[0] with ID: 101`
- `Validation failed for asset[1]: ...`

### 3. Validate Data Before Sending

Pre-validate your data:
- Check if serial numbers are unique
- Verify all foreign key IDs exist
- Ensure required fields are not empty
- Validate enum values (status, ownerType, acquisitionType)

### 4. Test with Small Batches

Start with 1-2 assets to verify the format, then increase batch size.

## Best Practices

1. **Batch Size**: Limit to 100-500 assets per request to avoid timeout
2. **Unique Identifiers**: Always use unique serial numbers and asset codes
3. **Validation**: Validate data on the client side before sending
4. **Error Handling**: Always check the response for errors and handle partial failures
5. **Logging**: Monitor application logs for debugging information
6. **Retry Logic**: Implement retry logic for failed assets with transient errors

## Testing with cURL

```bash
curl -X POST http://localhost:8080/api/assets/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "assetTypeId": 1,
      "makeId": 2,
      "modelId": 3,
      "name": "Test Laptop",
      "serialNumber": "TEST001",
      "status": "ACTIVE",
      "ownerType": "COMPANY",
      "acquisitionType": "PURCHASE"
    }
  ]'
```

## HTTP Status Codes

- **201 Created**: All assets created successfully
- **207 Multi-Status**: Some assets created, some failed
- **400 Bad Request**: All assets failed validation or creation
- **409 Conflict**: Data integrity violation (e.g., duplicate serial numbers)
- **500 Internal Server Error**: Unexpected server error

## Monitoring and Metrics

Monitor these metrics:
- Success rate (successCount / totalProcessed)
- Common error types
- Processing time per batch
- Average assets per batch

This comprehensive implementation provides robust error handling, detailed logging, and clear error messages to help debug issues quickly and efficiently. 