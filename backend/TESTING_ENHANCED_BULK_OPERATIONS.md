# Testing Enhanced Bulk Asset Operations

## Prerequisites

Before testing, ensure your database has:

1. **Asset PO records** with valid vendor IDs
2. **OS Version records** linked to OS records  
3. **Asset Model records** linked to Asset Make records
4. **Asset Make records** linked to Asset Type records

## Test Data Setup

### 1. Create Test Asset PO

```sql
INSERT INTO asset_po (po_number, vendor_id, acquisition_type, owner_type, total_devices)
VALUES ('PO-2024-TEST', 1, 'Bought', 'Celcom', 10);
```

### 2. Verify Model Hierarchy

```sql
-- Check model -> make -> type hierarchy
SELECT 
    am.model_id,
    am.model_name,
    amk.make_id,
    amk.make_name,
    at.type_id,
    at.name as type_name
FROM asset_model am
JOIN asset_make amk ON am.make_id = amk.make_id
JOIN asset_type at ON amk.type_id = at.type_id
WHERE am.model_id = 1;
```

### 3. Verify OS Version Hierarchy

```sql
-- Check OS version -> OS relationship
SELECT 
    osv.os_version_id,
    osv.version,
    os.os_id,
    os.name as os_name
FROM os_version osv
JOIN os ON osv.os_id = os.os_id
WHERE osv.os_version_id = 1;
```

## Test Cases

### 1. Basic Bulk Asset Creation with Auto-Resolution

```bash
curl -X POST http://localhost:8080/api/assets/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Dell Laptop Auto-Resolution Test",
      "serialNumber": "DL-AUTO-001",
      "poNumber": "PO-2024-TEST",
      "modelId": 1,
      "osVersionId": 1,
      "status": "Active",
      "ownerType": "Celcom",
      "acquisitionType": "Bought",
      "warrantyExpiry": "2026-12-31"
    }
  ]'
```

**Expected Result**: 
- vendorId automatically set from PO
- extendedWarrantyVendorId automatically set to same vendor
- osId automatically resolved from osVersionId
- makeId and typeId automatically resolved from modelId

### 2. Case-Insensitive Duplicate Detection

```bash
# First, create an asset
curl -X POST http://localhost:8080/api/assets/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "First Asset",
      "serialNumber": "DUPLICATE123",
      "poNumber": "PO-2024-TEST",
      "modelId": 1,
      "status": "Active",
      "ownerType": "Celcom",
      "acquisitionType": "Bought"
    }
  ]'

# Then try to create with different case
curl -X POST http://localhost:8080/api/assets/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Duplicate Test Asset",
      "serialNumber": "duplicate123",
      "poNumber": "PO-2024-TEST", 
      "modelId": 1,
      "status": "Active",
      "ownerType": "Celcom",
      "acquisitionType": "Bought"
    }
  ]'
```

**Expected Result**: Second request should fail with case-insensitive duplicate error.

### 3. MAC Address Duplicate Detection

```bash
# First asset with MAC address
curl -X POST http://localhost:8080/api/assets/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Asset with MAC",
      "serialNumber": "MAC-TEST-001",
      "macAddress": "AA:BB:CC:DD:EE:FF",
      "poNumber": "PO-2024-TEST",
      "modelId": 1,
      "status": "Active",
      "ownerType": "Celcom",
      "acquisitionType": "Bought"
    }
  ]'

# Try to create with same MAC (different case)
curl -X POST http://localhost:8080/api/assets/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Duplicate MAC Asset",
      "serialNumber": "MAC-TEST-002",
      "macAddress": "aa:bb:cc:dd:ee:ff",
      "poNumber": "PO-2024-TEST",
      "modelId": 1,
      "status": "Active",
      "ownerType": "Celcom",
      "acquisitionType": "Bought"
    }
  ]'
```

**Expected Result**: Second request should fail with MAC address duplicate error.

### 4. IT Asset Code Duplicate Detection

```bash
# First asset with IT asset code
curl -X POST http://localhost:8080/api/assets/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Asset with IT Code",
      "serialNumber": "IT-CODE-001",
      "itAssetCode": "IT-ASSET-001",
      "poNumber": "PO-2024-TEST",
      "modelId": 1,
      "status": "Active",
      "ownerType": "Celcom", 
      "acquisitionType": "Bought"
    }
  ]'

# Try to create with same IT asset code (different case)
curl -X POST http://localhost:8080/api/assets/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Duplicate IT Code Asset",
      "serialNumber": "IT-CODE-002",
      "itAssetCode": "it-asset-001",
      "poNumber": "PO-2024-TEST",
      "modelId": 1,
      "status": "Active",
      "ownerType": "Celcom",
      "acquisitionType": "Bought"
    }
  ]'
```

**Expected Result**: Second request should fail with IT asset code duplicate error.

### 5. Invalid PO Number

```bash
curl -X POST http://localhost:8080/api/assets/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Asset with Invalid PO", 
      "serialNumber": "INVALID-PO-001",
      "poNumber": "PO-NONEXISTENT",
      "modelId": 1,
      "status": "Active",
      "ownerType": "Celcom",
      "acquisitionType": "Bought"
    }
  ]'
```

**Expected Result**: Should fail with "Purchase Order not found" error.

### 6. Invalid Model ID

```bash
curl -X POST http://localhost:8080/api/assets/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Asset with Invalid Model",
      "serialNumber": "INVALID-MODEL-001", 
      "poNumber": "PO-2024-TEST",
      "modelId": 99999,
      "status": "Active",
      "ownerType": "Celcom",
      "acquisitionType": "Bought"
    }
  ]'
```

**Expected Result**: Should fail with "Asset Model ID does not exist" error.

### 7. Invalid OS Version ID

```bash
curl -X POST http://localhost:8080/api/assets/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Asset with Invalid OS Version",
      "serialNumber": "INVALID-OS-001",
      "poNumber": "PO-2024-TEST", 
      "modelId": 1,
      "osVersionId": 99999,
      "status": "Active",
      "ownerType": "Celcom",
      "acquisitionType": "Bought"
    }
  ]'
```

**Expected Result**: Should fail with "OS Version ID does not exist" error.

### 8. Warranty Date Validation

```bash
curl -X POST http://localhost:8080/api/assets/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Asset with Invalid Warranty",
      "serialNumber": "WARRANTY-TEST-001",
      "poNumber": "PO-2024-TEST",
      "modelId": 1,
      "acquisitionDate": "2024-12-01",
      "warrantyExpiry": "2024-01-01",
      "status": "Active",
      "ownerType": "Celcom",
      "acquisitionType": "Bought"
    }
  ]'
```

**Expected Result**: Should fail with warranty expiry before acquisition date error.

### 9. Multiple Assets with Mixed Success/Failure

```bash
curl -X POST http://localhost:8080/api/assets/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Valid Asset 1",
      "serialNumber": "MIXED-VALID-001",
      "poNumber": "PO-2024-TEST",
      "modelId": 1,
      "status": "Active",
      "ownerType": "Celcom",
      "acquisitionType": "Bought"
    },
    {
      "name": "Invalid Asset - Duplicate",
      "serialNumber": "DUPLICATE123",
      "poNumber": "PO-2024-TEST",
      "modelId": 1,
      "status": "Active", 
      "ownerType": "Celcom",
      "acquisitionType": "Bought"
    },
    {
      "name": "Valid Asset 2",
      "serialNumber": "MIXED-VALID-002",
      "poNumber": "PO-2024-TEST",
      "modelId": 1,
      "status": "Active",
      "ownerType": "Celcom",
      "acquisitionType": "Bought"
    }
  ]'
```

**Expected Result**: 
- 2 successful assets created
- 1 failure due to duplicate serial number
- Response shows successCount: 2, failureCount: 1

### 10. Verify Auto-Resolution Results

```bash
# After successful creation, verify the resolved fields
curl -X GET http://localhost:8080/api/assets/{assetId}
```

**Check Response**: 
- vendorId should match the PO's vendorId
- extendedWarrantyVendorId should match vendorId
- osId should be resolved from osVersionId
- makeId should be resolved from modelId
- assetTypeId should be resolved from model hierarchy

## Validation Response Format

### Successful Response
```json
{
  "totalProcessed": 1,
  "successCount": 1,
  "failureCount": 0,
  "errors": [],
  "successfulAssets": [
    {
      "assetId": 123,
      "name": "Dell Laptop Auto-Resolution Test",
      "serialNumber": "DL-AUTO-001",
      "vendorId": 1,
      "extendedWarrantyVendorId": 1,
      "makeId": 2,
      "modelId": 1,
      "osId": 3,
      "osVersionId": 1,
      "assetTypeId": 1
    }
  ]
}
```

### Error Response
```json
{
  "totalProcessed": 1,
  "successCount": 0,
  "failureCount": 1,
  "errors": [
    {
      "index": 0,
      "field": "validation",
      "message": "Serial number already exists (case-insensitive): duplicate123",
      "assetIdentifier": "duplicate123"
    }
  ],
  "successfulAssets": []
}
```

## Performance Testing

### Bulk Load Test

```bash
# Create a larger batch to test performance
curl -X POST http://localhost:8080/api/assets/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Bulk Test Asset 1",
      "serialNumber": "BULK-001",
      "poNumber": "PO-2024-TEST",
      "modelId": 1,
      "status": "Active",
      "ownerType": "Celcom",
      "acquisitionType": "Bought"
    },
    // ... repeat for multiple assets (up to 50-100)
  ]'
```

Monitor response time and database performance during bulk operations.

## Troubleshooting

### Common Issues

1. **Missing PO Data**: Ensure Asset PO exists with valid vendorId
2. **Broken Model Hierarchy**: Verify model -> make -> type relationships
3. **Missing OS Data**: Ensure OS Version has valid OS reference
4. **Case Sensitivity**: Remember validation is case-insensitive for duplicates
5. **Date Validation**: Check warranty dates are logical

### Debugging Queries

```sql
-- Check PO exists
SELECT * FROM asset_po WHERE po_number = 'PO-2024-TEST';

-- Check model hierarchy
SELECT am.*, amk.*, at.* 
FROM asset_model am 
JOIN asset_make amk ON am.make_id = amk.make_id
JOIN asset_type at ON amk.type_id = at.type_id
WHERE am.model_id = 1;

-- Check OS version hierarchy  
SELECT osv.*, os.*
FROM os_version osv
JOIN os ON osv.os_id = os.os_id
WHERE osv.os_version_id = 1;

-- Check for case-insensitive duplicates
SELECT * FROM asset 
WHERE LOWER(serial_number) = LOWER('TEST123') 
AND deleted = false;
```

This testing guide covers all the enhanced functionality and should help you verify that the bulk asset operations work correctly with automatic foreign key resolution and comprehensive validation. 