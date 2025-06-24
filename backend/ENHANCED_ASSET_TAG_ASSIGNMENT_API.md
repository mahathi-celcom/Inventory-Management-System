# Enhanced Asset Tag Assignment API Documentation

## Overview
This document provides comprehensive API documentation for the enhanced asset tag assignment functionality that automatically updates both the `asset.tags` column and creates historical tracking records in the `asset_tag_assignment` table.

## 🔧 Backend Implementation Features

### ✅ Enhanced Functionality
1. **Asset Tags Column Update**: Automatically updates the `tags` column in the asset table with the assigned tag name
2. **Historical Tracking**: Creates records in `asset_tag_assignment` table with timestamp and remarks
3. **Transactional Safety**: All operations happen within a single transaction
4. **Duplicate Prevention**: Prevents duplicate assignment records
5. **Comprehensive Logging**: Full audit trail for debugging and monitoring

## 📊 Database Schema Changes

### Enhanced `asset_tag_assignment` Table
```sql
CREATE TABLE asset_tag_assignment (
    asset_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks VARCHAR(500),
    PRIMARY KEY (asset_id, tag_id),
    FOREIGN KEY (asset_id) REFERENCES asset(asset_id),
    FOREIGN KEY (tag_id) REFERENCES asset_tag(tag_id)
);
```

### Asset Table `tags` Column
```sql
-- The asset table already has a tags column
ALTER TABLE asset ADD COLUMN tags VARCHAR(255); -- If not exists
```

## 🚀 API Endpoints

### 1. Assign Tag to Asset
```http
POST /api/asset-assignment/assign-tag
Content-Type: application/json
```

#### Request Body
```json
{
  "assetId": 5,
  "tagId": 12,
  "remarks": "High priority asset for project Alpha"
}
```

#### Request DTO Structure
```typescript
interface AssetTagAssignmentRequestDTO {
  assetId: number;        // Required
  tagId: number;          // Required
  remarks?: string;       // Optional - defaults to "Tag assigned via API"
}
```

#### Response
```json
{
  "success": true,
  "message": "Tag 'High Priority' successfully assigned to asset",
  "assetId": 5,
  "assignedId": 12,
  "assignedType": "TAG"
}
```

#### Response DTO Structure
```typescript
interface AssignmentResponseDTO {
  success: boolean;
  message: string;
  assetId: number;
  assignedId: number | null;
  assignedType: string;
}
```

### 2. Unassign Tag from Asset
```http
DELETE /api/asset-assignment/unassign-tag/{assetId}
```

#### Response
```json
{
  "success": true,
  "message": "Tag 'High Priority' successfully unassigned from asset",
  "assetId": 5,
  "assignedId": null,
  "assignedType": "TAG"
}
```

### 3. Get Asset Tag Assignments
```http
GET /api/asset-tag-assignments/asset/{assetId}
```

#### Response
```json
[
  {
    "id": 5,
    "assetId": 5,
    "tagId": 12,
    "assignedAt": "2024-01-15T10:30:00",
    "remarks": "High priority asset for project Alpha",
    "assetName": "Dell Laptop XPS 13",
    "tagName": "High Priority"
  }
]
```

#### Response DTO Structure
```typescript
interface AssetTagAssignmentDTO {
  id: number;
  assetId: number;
  tagId: number;
  assignedAt: string;     // ISO 8601 timestamp
  remarks?: string;
  assetName: string;      // For display purposes
  tagName: string;        // For display purposes
}
```

### 4. Get Asset Dashboard (Enhanced)
```http
GET /api/asset-assignment/dashboard?page=0&size=10
```

#### Response
```json
{
  "content": [
    {
      "assetId": 5,
      "name": "Dell Laptop XPS 13",
      "status": "ACTIVE",
      "serialNumber": "DL123456789",
      "itAssetCode": "IT-LAP-001",
      "tags": "High Priority",
      "currentTagId": 12,
      "currentTagName": "High Priority",
      "currentUserId": 101,
      "currentUserName": "John Doe",
      "inventoryLocation": "Office Floor 1"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true
}
```

## 💻 Frontend Integration Examples

### JavaScript/TypeScript Examples

#### 1. Assign Tag to Asset
```typescript
interface TagAssignmentRequest {
  assetId: number;
  tagId: number;
  remarks?: string;
}

async function assignTagToAsset(request: TagAssignmentRequest): Promise<AssignmentResponseDTO> {
  try {
    const response = await fetch('/api/asset-assignment/assign-tag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: AssignmentResponseDTO = await response.json();
    
    if (result.success) {
      console.log('Tag assignment successful:', result.message);
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error assigning tag:', error);
    throw error;
  }
}

// Usage example
const assignmentRequest: TagAssignmentRequest = {
  assetId: 5,
  tagId: 12,
  remarks: "Critical asset for Q1 project"
};

assignTagToAsset(assignmentRequest)
  .then(result => {
    console.log('Assignment completed:', result);
    // Refresh asset list or update UI
  })
  .catch(error => {
    console.error('Assignment failed:', error);
    // Show error message to user
  });
```

#### 2. Get Asset Tag Assignment History
```typescript
interface AssetTagAssignment {
  id: number;
  assetId: number;
  tagId: number;
  assignedAt: string;
  remarks?: string;
  assetName: string;
  tagName: string;
}

async function getAssetTagHistory(assetId: number): Promise<AssetTagAssignment[]> {
  try {
    const response = await fetch(`/api/asset-tag-assignments/asset/${assetId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const assignments: AssetTagAssignment[] = await response.json();
    return assignments;
  } catch (error) {
    console.error('Error fetching tag history:', error);
    throw error;
  }
}

// Usage example
getAssetTagHistory(5)
  .then(history => {
    console.log('Tag assignment history:', history);
    // Display history in UI table
    displayTagHistory(history);
  })
  .catch(error => {
    console.error('Failed to load tag history:', error);
  });

function displayTagHistory(history: AssetTagAssignment[]) {
  const tableBody = document.getElementById('tag-history-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '';
  
  history.forEach(assignment => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${assignment.tagName}</td>
      <td>${new Date(assignment.assignedAt).toLocaleString()}</td>
      <td>${assignment.remarks || 'N/A'}</td>
    `;
    tableBody.appendChild(row);
  });
}
```

## 🔍 Key Implementation Details

### Backend Process Flow
1. **Validation**: Validates asset and tag existence
2. **Cleanup**: Removes previous tag assignments
3. **Asset Update**: Updates `asset.tags` column with tag name
4. **Collection Update**: Adds tag to asset's `assignedTags` collection
5. **History Record**: Creates record in `asset_tag_assignment` table with timestamp and remarks
6. **Transaction Commit**: All operations committed atomically

### Database Operations
```sql
-- 1. Update asset tags column
UPDATE asset SET tags = 'High Priority' WHERE asset_id = 5;

-- 2. Insert assignment record
INSERT INTO asset_tag_assignment (asset_id, tag_id, assigned_at, remarks) 
VALUES (5, 12, CURRENT_TIMESTAMP, 'Tag assigned via API');
```

### Error Handling
- **Asset Not Found**: Returns 400 with "Asset not found" message
- **Tag Not Found**: Returns 400 with "Tag not found" message  
- **Database Error**: Returns 500 with generic error message
- **Validation Error**: Returns 400 with validation details

## 📋 Testing

### Unit Tests Included
- ✅ Tag assignment record creation
- ✅ Asset tags column update
- ✅ Duplicate prevention
- ✅ Custom remarks handling
- ✅ Transaction rollback on error

### Integration Testing
```bash
# Run specific test class
mvn test -Dtest=AssetTagAssignmentTest

# Run all asset assignment tests
mvn test -Dtest="*AssetTagAssignment*"
```

## 🎯 Benefits

1. **Quick Access**: `asset.tags` column provides immediate tag information without joins
2. **Historical Tracking**: Complete audit trail in `asset_tag_assignment` table
3. **Flexible Remarks**: Support for custom assignment notes
4. **Atomic Operations**: All updates happen in single transaction
5. **Frontend Ready**: Comprehensive DTOs for easy frontend integration

The enhanced implementation provides a robust, scalable solution for asset tag management with both immediate access and historical tracking capabilities. 