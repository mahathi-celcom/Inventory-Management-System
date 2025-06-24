# Asset Assignment Management API Documentation

## Overview
The Asset Assignment Management system provides comprehensive functionality for managing asset assignments to users and tags within the Celcom Asset Management system. This feature includes dashboard views, assignment operations, and historical tracking.

## Key Features

### 🎯 **Core Functionality**
- **Dashboard View**: Paginated asset list with current assignments
- **User Assignment**: Assign/unassign users to assets with history tracking
- **Tag Assignment**: Assign/unassign tags to assets with logging
- **Search & Filter**: Search assets by name, serial number, or asset code
- **Transaction Safety**: All operations are atomic and validated

### 📊 **Data Models**

#### Asset Dashboard Information
- Asset ID, Name, Status, Serial Number, Asset Code
- Asset Type, Make, Model information
- PO Number and Invoice details
- Current User assignment (if any)
- Current Tag assignment (if any)
- Location and ownership details

## API Endpoints

### 1. Asset Dashboard

#### **Get Asset Dashboard**
```http
GET /api/asset-assignment/dashboard
```

**Parameters:**
- `page` (optional): Page number (default: 0)
- `size` (optional): Page size (default: 10)
- `sortBy` (optional): Sort field (default: "assetId")
- `sortDir` (optional): Sort direction - ASC/DESC (default: "ASC")

**Response:**
```json
{
  "content": [
    {
      "assetId": 1001,
      "name": "Dell Laptop XPS 13",
      "status": "Active",
      "serialNumber": "DL123456789",
      "itAssetCode": "IT-LAP-001",
      "assetTypeId": 1,
      "assetTypeName": "Laptop",
      "makeId": 2,
      "makeName": "Dell",
      "modelId": 3,
      "modelName": "XPS 13",
      "poNumber": "PO-2025-001",
      "invoiceNumber": "INV-2025-001",
      "currentUserId": 101,
      "currentUserName": "Mahathi I.",
      "currentUserEmail": "mahathi@celcom.com",
      "currentUserDepartment": "IT",
      "currentTagId": 5,
      "currentTagName": "High Priority",
      "inventoryLocation": "Office Floor 1",
      "ownerType": "Company",
      "acquisitionType": "Purchase"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 150,
  "totalPages": 15,
  "first": true,
  "last": false
}
```

#### **Search Asset Dashboard**
```http
GET /api/asset-assignment/dashboard/search?searchTerm={term}
```

**Parameters:**
- `searchTerm` (required): Search term for asset name, serial number, or asset code
- `page`, `size`, `sortBy`, `sortDir`: Same as dashboard endpoint

**Response:** Same structure as dashboard endpoint

### 2. User Assignment Operations

#### **Assign User to Asset**
```http
POST /api/asset-assignment/assign-user
```

**Request Body:**
```json
{
  "assetId": 1001,
  "userId": 101,
  "remarks": "Assigned for project work"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Asset successfully assigned to Mahathi I.",
  "assetId": 1001,
  "assignedId": 101,
  "assignedType": "USER"
}
```

#### **Unassign User from Asset**
```http
DELETE /api/asset-assignment/unassign-user/{assetId}
```

**Response:**
```json
{
  "success": true,
  "message": "Asset successfully unassigned from Mahathi I.",
  "assetId": 1001,
  "assignedId": null,
  "assignedType": "USER"
}
```

### 3. Tag Assignment Operations

#### **Assign Tag to Asset**
```http
POST /api/asset-assignment/assign-tag
```

**Request Body:**
```json
{
  "assetId": 1001,
  "tagId": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tag 'High Priority' successfully assigned to asset",
  "assetId": 1001,
  "assignedId": 5,
  "assignedType": "TAG"
}
```

#### **Unassign Tag from Asset**
```http
DELETE /api/asset-assignment/unassign-tag/{assetId}
```

**Response:**
```json
{
  "success": true,
  "message": "Tag 'High Priority' successfully unassigned from asset",
  "assetId": 1001,
  "assignedId": null,
  "assignedType": "TAG"
}
```

## Error Handling

### **Error Response Format**
```json
{
  "success": false,
  "message": "Asset not found with ID: 1001",
  "assetId": 1001
}
```

### **Common Error Scenarios**
- **404 Not Found**: Asset, User, or Tag not found
- **400 Bad Request**: Invalid request data or validation errors
- **409 Conflict**: Assignment conflicts (e.g., asset already assigned)
- **500 Internal Server Error**: Unexpected server errors

## Database Schema Changes

### **New Field Added to Asset Table**
```sql
ALTER TABLE asset 
ADD COLUMN current_tag_id INT,
ADD CONSTRAINT fk_asset_current_tag 
    FOREIGN KEY (current_tag_id) 
    REFERENCES asset_tag(tag_id) 
    ON DELETE SET NULL;
```

### **Existing Tables Used**
- `asset_assignment_history`: Tracks user assignment history
- `asset_tag_assignment`: Tracks tag assignments
- `asset`: Main asset table with current user and tag references
- `user`: User information
- `asset_tag`: Available tags

## Business Logic

### **User Assignment Process**
1. **Validation**: Check asset and user exist
2. **End Previous Assignment**: Set `unassigned_date` on current assignment
3. **Update Asset**: Set new `current_user_id`
4. **Create History**: Add new record to `asset_assignment_history`
5. **Transaction Commit**: All operations in single transaction

### **Tag Assignment Process**
1. **Validation**: Check asset and tag exist
2. **Remove Previous Tag**: Delete existing tag assignments
3. **Update Asset**: Set new `current_tag_id`
4. **Create Assignment**: Add record to `asset_tag_assignment`
5. **Transaction Commit**: All operations in single transaction

## Frontend Integration Examples

### **JavaScript/TypeScript Examples**

#### **Fetch Dashboard Data**
```javascript
async function fetchAssetDashboard(page = 0, size = 10) {
  try {
    const response = await fetch(
      `/api/asset-assignment/dashboard?page=${page}&size=${size}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    throw error;
  }
}
```

#### **Assign User to Asset**
```javascript
async function assignUserToAsset(assetId, userId, remarks = '') {
  try {
    const response = await fetch('/api/asset-assignment/assign-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assetId,
        userId,
        remarks
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Assignment successful:', result.message);
      return result;
    } else {
      console.error('Assignment failed:', result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error assigning user:', error);
    throw error;
  }
}
```

#### **Search Assets**
```javascript
async function searchAssets(searchTerm, page = 0, size = 10) {
  try {
    const response = await fetch(
      `/api/asset-assignment/dashboard/search?searchTerm=${encodeURIComponent(searchTerm)}&page=${page}&size=${size}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching assets:', error);
    throw error;
  }
}
```

## Testing

### **Test Scenarios**

#### **Dashboard Tests**
```bash
# Test dashboard pagination
curl "http://localhost:8080/api/asset-assignment/dashboard?page=0&size=5"

# Test dashboard search
curl "http://localhost:8080/api/asset-assignment/dashboard/search?searchTerm=laptop"
```

#### **Assignment Tests**
```bash
# Test user assignment
curl -X POST "http://localhost:8080/api/asset-assignment/assign-user" \
  -H "Content-Type: application/json" \
  -d '{"assetId": 1, "userId": 1, "remarks": "Test assignment"}'

# Test tag assignment
curl -X POST "http://localhost:8080/api/asset-assignment/assign-tag" \
  -H "Content-Type: application/json" \
  -d '{"assetId": 1, "tagId": 1}'

# Test unassignment
curl -X DELETE "http://localhost:8080/api/asset-assignment/unassign-user/1"
curl -X DELETE "http://localhost:8080/api/asset-assignment/unassign-tag/1"
```

## Security Considerations

- ✅ **Input Validation**: All inputs validated using Bean Validation
- ✅ **Transaction Safety**: All operations are atomic
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **CORS Configuration**: Properly configured for frontend integration
- ✅ **SQL Injection Prevention**: Using parameterized queries

## Performance Notes

- **Efficient Queries**: Optimized JPA queries with proper indexing
- **Lazy Loading**: Related entities loaded only when needed
- **Pagination**: All list endpoints support pagination
- **Caching**: Consider adding caching for frequently accessed data

---

## Summary

The Asset Assignment Management API provides:
- 📊 **Comprehensive Dashboard**: Complete asset view with assignments
- 🔄 **Assignment Operations**: User and tag assignment with history
- 🔍 **Search Functionality**: Flexible search and filtering
- 📝 **Audit Trail**: Complete history tracking for all assignments
- 🛡️ **Data Integrity**: Transactional operations with validation
- 🚀 **Frontend Ready**: RESTful API with proper error handling

This system enables efficient management of asset assignments while maintaining complete audit trails and data integrity. 