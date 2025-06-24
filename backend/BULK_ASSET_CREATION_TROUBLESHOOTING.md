# Bulk Asset Creation Troubleshooting Guide

## 🚨 **Common Issues & Solutions**

### **Issue 1: Status Value Mismatch**
**❌ Your JSON**: `"status": "In Stock"`
**✅ Expected**: `"status": "In stock"` (now supported)

**Solution**: Updated validation to accept both frontend and backend values:
- `"In stock"` → `"IN_STOCK"`
- `"Active"` → `"ACTIVE"`
- `"In Repair"` → `"IN_REPAIR"`
- `"Broken"` → `"BROKEN"`
- `"Ceased"` → `"CEASED"`

### **Issue 2: Owner Type Mismatch**
**❌ Your JSON**: `"ownerType": "Celcom"`
**✅ Expected**: `"ownerType": "Celcom"` (now supported)

**Solution**: Updated validation to accept:
- `"Celcom"` → `"CELCOM"`
- `"Vendor"` → `"VENDOR"`

### **Issue 3: Acquisition Type Mismatch**
**❌ Your JSON**: `"acquisitionType": "Bought"`
**✅ Expected**: `"acquisitionType": "Bought"` (now supported)

**Solution**: Updated validation to accept:
- `"Bought"` → `"BOUGHT"`
- `"Lease"` → `"LEASE"`
- `"Rental"` → `"RENTAL"`

### **Issue 4: String vs Long Type Issues**
**❌ Your JSON**: `"modelId": "3"`, `"osVersionId": "1"`
**✅ Solution**: Added custom deserializer to handle string-to-long conversion

### **Issue 5: Missing Required Fields**
**❌ Your JSON**: Missing `assetTypeId` and `makeId`
**✅ Required**: Add these fields to your JSON

## 🔧 **Fixed JSON Payload Example**

```json
[
  {
    "assetTypeId": 1,
    "makeId": 2,
    "name": "Apple MacBook Pro 16",
    "serialNumber": "MBP-APPLE-002",
    "status": "In stock",
    "ownerType": "Celcom",
    "acquisitionType": "Bought",
    "modelId": "3",
    "itAssetCode": "IT-002",
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "ipv4Address": "192.168.1.102",
    "inventoryLocation": "Mumbai HQ, Floor 5",
    "osVersionId": "1",
    "poNumber": "PO-2025-001",
    "invoiceNumber": "INV-2025-001",
    "acquisitionDate": "2023-08-24",
    "vendorId": 2,
    "acquisitionPrice": 150000,
    "depreciationPct": 1,
    "currentPrice": 150000,
    "tags": "macbook, design, priority"
  }
]
```

## 🛠 **Implementation Fixes Applied**

### **1. Enhanced AssetRequestDTO**
```java
@Pattern(regexp = "^(In Stock|In Use|In Repair|Broken|Disposed|ACTIVE|INACTIVE|IN_REPAIR|BROKEN|CEASED)$")
private String status;

@JsonDeserialize(using = StringToLongDeserializer.class)
private Long modelId;
```

### **2. Created StringToLongDeserializer**
```java
@Slf4j
public class StringToLongDeserializer extends JsonDeserializer<Long> {
    @Override
    public Long deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        String value = parser.getValueAsString();
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid number format for field: " + value);
        }
    }
}
```

### **3. Enhanced AssetMapper**
```java
private String normalizeStatus(String status) {
    switch (status.trim()) {
        case "In stock": return "IN_STOCK";
        case "Active": return "ACTIVE";
        case "In Repair": return "IN_REPAIR";
        case "Broken": return "BROKEN";
        case "Ceased": return "CEASED";
        default: return status.toUpperCase();
    }
}
```

### **4. Improved Error Handling**
```java
// Enhanced controller with specific exception handling
@PostMapping(value = "/bulk", produces = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<BulkAssetResponse> createAssetsInBulk(
        @Valid @RequestBody List<AssetRequestDTO> requests) {
    
    try {
        BulkAssetResponse response = assetService.createAssetsInBulk(requests);
        
        if (response.getFailureCount() == 0) {
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } else if (response.getSuccessCount() > 0) {
            return ResponseEntity.status(HttpStatus.MULTI_STATUS).body(response);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    } catch (IllegalArgumentException e) {
        // Will be handled by GlobalExceptionHandler
        throw e;
    } catch (DataIntegrityViolationException e) {
        // Will be handled by GlobalExceptionHandler  
        throw e;
    }
}
```

## 📋 **Validation Checklist**

Before sending your JSON payload, ensure:

- [ ] **assetTypeId**: Required positive number
- [ ] **makeId**: Required positive number  
- [ ] **modelId**: Required positive number (can be string)
- [ ] **name**: Required, 2-100 characters
- [ ] **serialNumber**: Required, 3-50 characters, unique
- [ ] **status**: One of: "In stock", "Active", "In Repair", "Broken", "Ceased"
- [ ] **ownerType**: One of: "Celcom", "Vendor"
- [ ] **acquisitionType**: One of: "Bought", "Lease", "Rental"
- [ ] **vendorId**: Positive number, must exist in database
- [ ] **osVersionId**: Positive number (can be string), must exist in database
- [ ] **acquisitionPrice**: Positive decimal number
- [ ] **itAssetCode**: Unique if provided

## 🔍 **Debugging Steps**

### **1. Enable Debug Logging**
```properties
# application.properties
logging.level.com.inventory.system.controller.AssetController=DEBUG
logging.level.com.inventory.system.service.impl.AssetServiceImpl=DEBUG
logging.level.com.inventory.system.mapper.AssetMapper=DEBUG
```

### **2. Check Logs for Patterns**
```
=== BULK ASSET CREATION REQUEST ===
Processing asset[0]: MBP-APPLE-002
Successfully created asset[0] with ID: 101
```

### **3. Test with Single Asset First**
```bash
curl -X POST http://localhost:8080/api/assets/bulk \
  -H "Content-Type: application/json" \
  -d '[{
    "assetTypeId": 1,
    "makeId": 2,
    "modelId": "3",
    "name": "Test Laptop",
    "serialNumber": "TEST001",
    "status": "In stock",
    "ownerType": "Celcom",
    "acquisitionType": "Bought",
    "vendorId": 2,
    "osVersionId": "1"
  }]'
```

## 🎯 **Expected Response Formats**

### **Success (HTTP 201)**
```json
{
  "successCount": 1,
  "failureCount": 0,
  "totalProcessed": 1,
  "errors": [],
  "successfulAssets": [
    {
      "assetId": 101,
      "name": "Test Laptop",
      "serialNumber": "TEST001",
      "status": "ACTIVE"
    }
  ]
}
```

### **Validation Error (HTTP 400)**
```json
{
  "successCount": 0,
  "failureCount": 1,
  "totalProcessed": 1,
  "errors": [
    {
      "index": 0,
      "field": "validation",
      "message": "modelId: Model ID is required; assetTypeId: Asset Type ID must be a positive number",
      "assetIdentifier": "TEST001"
    }
  ],
  "successfulAssets": []
}
```

### **Duplicate Error (HTTP 207)**
```json
{
  "successCount": 0,
  "failureCount": 1,
  "totalProcessed": 1,
  "errors": [
    {
      "index": 0,
      "field": "serialNumber",
      "message": "Serial number 'TEST001' already exists",
      "assetIdentifier": "TEST001"
    }
  ],
  "successfulAssets": []
}
```

## 🚀 **Best Practices**

1. **Start Small**: Test with 1-2 assets first
2. **Validate Data**: Check all foreign key IDs exist before sending
3. **Unique Values**: Ensure serial numbers and IT asset codes are unique
4. **Batch Size**: Limit to 100-500 assets per request
5. **Error Handling**: Always check response for partial failures
6. **Retry Logic**: Implement retry for failed assets with transient errors

## 🔧 **Quick Fixes for Common Errors**

### **"Model ID 3 does not exist"**
```sql
-- Check if model exists
SELECT * FROM asset_model WHERE id = 3;
```

### **"Asset Type ID 1 does not exist"**
```sql
-- Check if asset type exists  
SELECT * FROM asset_type WHERE id = 1;
```

### **"Serial number already exists"**
```sql
-- Check for duplicates
SELECT * FROM asset WHERE serial_number = 'MBP-APPLE-002';
```

### **"Validation failed"**
- Check required fields are not null/empty
- Verify field lengths (name: 2-100 chars, serialNumber: 3-50 chars)
- Ensure positive numbers for IDs
- Use valid enum values for status ("In stock", "Active", "In Repair", "Broken", "Ceased"), ownerType, acquisitionType

This guide should resolve the 500 Internal Server Error and provide clear, actionable error messages instead of silent rollback failures. 