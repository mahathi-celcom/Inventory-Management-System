# Test Guide: Bulk Asset Creation by PO Number

## Overview
This guide provides test cases for the new `POST /api/assets/by-po/{poNumber}` endpoint.

## Prerequisites
1. Ensure the application is running
2. Have a valid PO number in the database (e.g., from AssetPO table)
3. Have valid foreign key IDs (assetTypeId, makeId, modelId, vendorId, etc.)

## Test Cases

### 1. Successful Asset Creation

**Request:**
```bash
curl -X POST http://localhost:8080/api/assets/by-po/PO-2025-001 \
  -H "Content-Type: application/json" \
  -d '{
    "assets": [
      {
        "name": "Test Laptop 1",
        "serialNumber": "TEST-LAPTOP-001",
        "status": "Active",
        "ownerType": "Celcom",
        "acquisitionType": "Bought",
        "assetTypeId": 1,
        "makeId": 2,
        "modelId": 3,
        "vendorId": 4,
        "acquisitionPrice": 2500.00
      },
      {
        "name": "Test Laptop 2", 
        "serialNumber": "TEST-LAPTOP-002",
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

**Expected Response (HTTP 201):**
```json
{
  "poNumber": "PO-2025-001",
  "createdCount": 2,
  "failedCount": 0,
  "totalProcessed": 2,
  "message": "2 assets created successfully for PO-2025-001",
  "createdAssets": [
    {
      "assetId": 101,
      "name": "Test Laptop 1",
      "serialNumber": "TEST-LAPTOP-001",
      "status": "ACTIVE",
      "poNumber": "PO-2025-001"
    },
    {
      "assetId": 102,
      "name": "Test Laptop 2",
      "serialNumber": "TEST-LAPTOP-002", 
      "status": "ACTIVE",
      "poNumber": "PO-2025-001"
    }
  ],
  "errors": []
}
```

### 2. Invalid PO Number

**Request:**
```bash
curl -X POST http://localhost:8080/api/assets/by-po/INVALID-PO \
  -H "Content-Type: application/json" \
  -d '{
    "assets": [
      {
        "name": "Test Asset",
        "serialNumber": "TEST-001",
        "status": "Active",
        "ownerType": "Celcom",
        "acquisitionType": "Bought",
        "modelId": 1
      }
    ]
  }'
```

**Expected Response (HTTP 404):**
```json
{
  "timestamp": "2025-01-XX...",
  "status": 404,
  "error": "Not Found",
  "message": "Purchase Order not found with PO Number: INVALID-PO",
  "path": "/api/assets/by-po/INVALID-PO"
}
```

### 3. Validation Errors

**Request:**
```bash
curl -X POST http://localhost:8080/api/assets/by-po/PO-2025-001 \
  -H "Content-Type: application/json" \
  -d '{
    "assets": [
      {
        "name": "",
        "serialNumber": "AB",
        "status": "InvalidStatus",
        "ownerType": "InvalidOwner",
        "acquisitionType": "InvalidType",
        "modelId": -1
      }
    ]
  }'
```

**Expected Response (HTTP 400):**
```json
{
  "poNumber": "PO-2025-001",
  "createdCount": 0,
  "failedCount": 1,
  "totalProcessed": 1,
  "message": "All 1 assets failed to create for PO-2025-001",
  "createdAssets": [],
  "errors": [
    {
      "index": 0,
      "field": "validation",
      "message": "Asset name is required and cannot be blank; Serial number must be between 3 and 50 characters; Status must be one of: Active, In stock, Broken, In Repair, Ceased; Owner type must be one of: Celcom, Vendor; Acquisition type must be one of: Bought, Lease, Rental; Model ID must be a positive number",
      "assetIdentifier": "AB"
    }
  ]
}
```

### 4. Duplicate Serial Number

**Request:**
```bash
curl -X POST http://localhost:8080/api/assets/by-po/PO-2025-001 \
  -H "Content-Type: application/json" \
  -d '{
    "assets": [
      {
        "name": "Duplicate Asset",
        "serialNumber": "EXISTING-SERIAL-001",
        "status": "Active",
        "ownerType": "Celcom",
        "acquisitionType": "Bought",
        "modelId": 1
      }
    ]
  }'
```

**Expected Response (HTTP 400):**
```json
{
  "poNumber": "PO-2025-001",
  "createdCount": 0,
  "failedCount": 1,
  "totalProcessed": 1,
  "message": "All 1 assets failed to create for PO-2025-001",
  "createdAssets": [],
  "errors": [
    {
      "index": 0,
      "field": "validation",
      "message": "Serial number already exists (case-insensitive): EXISTING-SERIAL-001",
      "assetIdentifier": "EXISTING-SERIAL-001"
    }
  ]
}
```

### 5. Partial Success

**Request:**
```bash
curl -X POST http://localhost:8080/api/assets/by-po/PO-2025-001 \
  -H "Content-Type: application/json" \
  -d '{
    "assets": [
      {
        "name": "Valid Asset",
        "serialNumber": "VALID-SERIAL-001",
        "status": "Active",
        "ownerType": "Celcom",
        "acquisitionType": "Bought",
        "modelId": 1
      },
      {
        "name": "Invalid Asset",
        "serialNumber": "EXISTING-SERIAL-001",
        "status": "Active",
        "ownerType": "Celcom",
        "acquisitionType": "Bought",
        "modelId": 1
      }
    ]
  }'
```

**Expected Response (HTTP 207):**
```json
{
  "poNumber": "PO-2025-001",
  "createdCount": 1,
  "failedCount": 1,
  "totalProcessed": 2,
  "message": "1 assets created, 1 failed for PO-2025-001",
  "createdAssets": [
    {
      "assetId": 103,
      "name": "Valid Asset",
      "serialNumber": "VALID-SERIAL-001",
      "status": "ACTIVE",
      "poNumber": "PO-2025-001"
    }
  ],
  "errors": [
    {
      "index": 1,
      "field": "validation",
      "message": "Serial number already exists (case-insensitive): EXISTING-SERIAL-001",
      "assetIdentifier": "EXISTING-SERIAL-001"
    }
  ]
}
```

## Verification Steps

1. **Check Database**: Verify assets are created with correct `poNumber`
2. **Check Audit Logs**: Verify audit entries with action "BULK_CREATE_BY_PO"
3. **Check Application Logs**: Look for detailed processing logs
4. **Test Edge Cases**: Empty arrays, null values, very large payloads

## Key Features Verified

✅ **Automatic PO Linking**: `poNumber` set automatically from URL  
✅ **PO Validation**: Validates PO exists before processing  
✅ **Individual Asset Validation**: Each asset validated independently  
✅ **Atomic Transactions**: All assets processed in single transaction  
✅ **Detailed Error Reporting**: Clear error messages with asset index  
✅ **Flexible HTTP Status Codes**: 201/207/400 based on results  
✅ **Comprehensive Logging**: Detailed logs for debugging  

## Troubleshooting

- **405 Method Not Allowed**: Endpoint not implemented (now fixed!)
- **404 Not Found**: Invalid PO number
- **400 Bad Request**: Validation errors in asset data
- **500 Internal Server Error**: Check application logs for details 