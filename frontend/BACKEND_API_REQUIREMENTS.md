# 🔧 Backend API Requirements for Asset Status Update Feature

## 📋 Overview

This document outlines the exact API requirements for implementing the asset status update feature with audit trail functionality.

## 🌐 API Endpoints

### 1. Update Asset Status
**Endpoint:** `PUT /api/assets/{id}/status`

**Purpose:** Update the status of an asset and create an audit record

**Request:**
```http
PUT /api/assets/123/status
Content-Type: application/json

{
  "status": "In Repair",
  "remarks": "Sent to vendor for repair",
  "changedBy": 1
}
```

**Response (Success - 200 OK):**
```json
{
  "data": {
    "asset": {
      "assetId": 123,
      "name": "Dell Laptop XPS 13",
      "status": "In Repair",
      "serialNumber": "DL123456",
      "currentUserId": null,
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    "statusHistory": [
      {
        "id": 45,
        "assetId": 123,
        "status": "In Repair",
        "changedBy": 1,
        "changeDate": "2024-01-15T10:30:00Z",
        "remarks": "Sent to vendor for repair"
      }
    ],
    "message": "Asset status updated successfully"
  }
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "error": {
    "message": "Invalid status transition",
    "code": "INVALID_STATUS_CHANGE",
    "details": "Cannot change from 'Ceased' to 'Active'"
  }
}
```

**Response (Error - 404 Not Found):**
```json
{
  "error": {
    "message": "Asset not found",
    "code": "ASSET_NOT_FOUND"
  }
}
```

### 2. Get Asset Status History
**Endpoint:** `GET /api/assets/{id}/status`

**Purpose:** Retrieve the complete audit trail for an asset's status changes

**Request:**
```http
GET /api/assets/123/status
```

**Response (Success - 200 OK):**
```json
{
  "data": [
    {
      "id": 45,
      "assetId": 123,
      "status": "In Repair",
      "changedBy": 1,
      "changeDate": "2024-01-15T10:30:00Z",
      "remarks": "Sent to vendor for repair"
    },
    {
      "id": 44,
      "assetId": 123,
      "status": "Active",
      "changedBy": 2,
      "changeDate": "2024-01-10T09:15:00Z",
      "remarks": "Assigned to John Doe"
    },
    {
      "id": 43,
      "assetId": 123,
      "status": "In Stock",
      "changedBy": 1,
      "changeDate": "2024-01-01T08:00:00Z",
      "remarks": "Initial inventory"
    }
  ]
}
```

## 🗄️ Database Schema Requirements

### asset_status_history Table

```sql
CREATE TABLE asset_status_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  asset_id BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL,
  remarks TEXT,
  changed_by BIGINT NOT NULL,
  change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
  FOREIGN KEY (changed_by) REFERENCES users(id),
  
  INDEX idx_asset_id (asset_id),
  INDEX idx_change_date (change_date)
);
```

### Status Values
The following status values are supported:
- `In Stock`
- `Active` 
- `In Repair`
- `Broken`
- `Ceased`

## 🔄 Business Rules

### Status Change Logic
1. **When status changes to "Active":**
   - Asset should ideally have a user assigned
   - Frontend shows warning if no user assigned

2. **When status changes to "Broken" or "Ceased":**
   - Automatically unassign any current user (`current_user_id = NULL`)
   - Frontend shows warning about user unassignment

3. **Status History:**
   - **MUST** create a new record in `asset_status_history` table for every status change
   - Include: `asset_id`, `status`, `changed_by`, `change_date`, `remarks`
   - `change_date` should be the current timestamp

### Required Backend Processing

```java
// Pseudo-code for status update endpoint
@PutMapping("/api/assets/{id}/status")
public ResponseEntity<ApiResponse> updateAssetStatus(
    @PathVariable Long id,
    @RequestBody StatusUpdateRequest request
) {
    // 1. Validate asset exists
    Asset asset = assetRepository.findById(id)
        .orElseThrow(() -> new AssetNotFoundException("Asset not found"));
    
    // 2. Apply business rules
    if ("Broken".equals(request.getStatus()) || "Ceased".equals(request.getStatus())) {
        asset.setCurrentUserId(null); // Unassign user
    }
    
    // 3. Update asset status
    asset.setStatus(request.getStatus());
    asset.setUpdatedAt(Instant.now());
    Asset updatedAsset = assetRepository.save(asset);
    
    // 4. Create audit record - THIS IS MANDATORY
    AssetStatusHistory historyRecord = new AssetStatusHistory();
    historyRecord.setAssetId(id);
    historyRecord.setStatus(request.getStatus());
    historyRecord.setChangedBy(request.getChangedBy());
    historyRecord.setChangeDate(Instant.now());
    historyRecord.setRemarks(request.getRemarks());
    
    AssetStatusHistory savedHistory = assetStatusHistoryRepository.save(historyRecord);
    
    // 5. Get complete history for response
    List<AssetStatusHistory> fullHistory = assetStatusHistoryRepository
        .findByAssetIdOrderByChangeDateDesc(id);
    
    // 6. Return response
    return ResponseEntity.ok(new ApiResponse(updatedAsset, fullHistory, "Asset status updated successfully"));
}
```

## 🧪 Testing

### Frontend Testing
The frontend will send these exact requests:

1. **Status Update Test:**
   ```javascript
   PUT /api/assets/1/status
   {
     "status": "In Repair",
     "remarks": "Testing backend integration",
     "changedBy": 1
   }
   ```

2. **History Retrieval Test:**
   ```javascript
   GET /api/assets/1/status
   ```

### Expected Frontend Behavior
- ✅ Shows processing toast notification
- ✅ Sends PUT request with exact payload format
- ✅ Updates UI immediately on success
- ✅ Shows success toast with asset name and new status
- ✅ Auto-refreshes asset list
- ✅ Shows error toast on failure
- ✅ Logs all requests/responses to browser console

## 🔗 Integration Points

### Frontend Service Method
```typescript
changeAssetStatus(request: AssetStatusChangeRequest): Observable<AssetStatusChangeResponse> {
  const url = `/api/assets/${request.assetId}/status`;
  const payload = {
    status: request.newStatus,
    remarks: request.remarks || '',
    changedBy: request.changedBy
  };
  
  return this.http.put<any>(url, payload);
}
```

### Request/Response Models
```typescript
// Request
interface AssetStatusChangeRequest {
  assetId: number;
  newStatus: string;
  changedBy: number;
  remarks?: string;
}

// Response
interface AssetStatusChangeResponse {
  asset: Asset;
  statusHistory: AssetStatusHistory[];
  message: string;
}
```

## 🚀 Implementation Checklist

Backend team should ensure:

- [ ] `PUT /api/assets/{id}/status` endpoint implemented
- [ ] `GET /api/assets/{id}/status` endpoint implemented
- [ ] `asset_status_history` table created with proper indexes
- [ ] Automatic audit record creation on every status change
- [ ] Business rules implemented (user unassignment for Broken/Ceased)
- [ ] Proper error handling and HTTP status codes
- [ ] CORS configured for frontend domain
- [ ] Transaction management to ensure data consistency
- [ ] Validation for valid status values
- [ ] Proper JSON response format as specified

## 🔍 Debugging

Frontend logs all requests with:
```
🔄 Sending status update request: { url, method: 'PUT', payload, assetId }
✅ Status update response: [response]
❌ Status update failed: [error]
```

Check browser console for detailed request/response information during testing. 