# Simplified Asset Tag Assignment API Documentation

## Overview
This document provides API documentation for the simplified asset tag assignment functionality that automatically updates the `asset.tags` column and creates mapping records in the `asset_tag_assignment` table.

## 🔧 Backend Implementation Features

### ✅ Core Functionality
1. **Asset Tags Column Update**: Automatically updates the `tags` column in the asset table with the assigned tag name
2. **Mapping Table**: Creates records in `asset_tag_assignment` table for relationship tracking
3. **Transactional Safety**: All operations happen within a single transaction
4. **Duplicate Prevention**: Prevents duplicate assignment records
5. **Comprehensive Logging**: Full audit trail for debugging and monitoring

## 📊 Database Schema

### `asset_tag_assignment` Table
```sql
CREATE TABLE asset_tag_assignment (
    asset_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (asset_id, tag_id),
    FOREIGN KEY (asset_id) REFERENCES asset(asset_id),
    FOREIGN KEY (tag_id) REFERENCES asset_tag(tag_id)
);
```

### Asset Table `tags` Column
```sql
-- The asset table has a tags column for immediate access
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
  "tagId": 12
}
```

#### Request DTO Structure
```typescript
interface AssetTagAssignmentRequestDTO {
  assetId: number;        // Required
  tagId: number;          // Required
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
  assetName: string;      // For display purposes
  tagName: string;        // For display purposes
}
```

### 4. Get Asset Dashboard
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
  tagId: 12
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

#### 2. Get Asset Tag Assignments
```typescript
interface AssetTagAssignment {
  id: number;
  assetId: number;
  tagId: number;
  assetName: string;
  tagName: string;
}

async function getAssetTagAssignments(assetId: number): Promise<AssetTagAssignment[]> {
  try {
    const response = await fetch(`/api/asset-tag-assignments/asset/${assetId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const assignments: AssetTagAssignment[] = await response.json();
    return assignments;
  } catch (error) {
    console.error('Error fetching tag assignments:', error);
    throw error;
  }
}

// Usage example
getAssetTagAssignments(5)
  .then(assignments => {
    console.log('Tag assignments:', assignments);
    // Display assignments in UI
    displayTagAssignments(assignments);
  })
  .catch(error => {
    console.error('Failed to load tag assignments:', error);
  });

function displayTagAssignments(assignments: AssetTagAssignment[]) {
  const container = document.getElementById('tag-assignments');
  if (!container) return;

  container.innerHTML = '';
  
  assignments.forEach(assignment => {
    const div = document.createElement('div');
    div.className = 'tag-assignment';
    div.innerHTML = `
      <span class="tag-name">${assignment.tagName}</span>
      <span class="asset-name">${assignment.assetName}</span>
    `;
    container.appendChild(div);
  });
}
```

#### 3. Unassign Tag from Asset
```typescript
async function unassignTagFromAsset(assetId: number): Promise<AssignmentResponseDTO> {
  try {
    const response = await fetch(`/api/asset-assignment/unassign-tag/${assetId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: AssignmentResponseDTO = await response.json();
    
    if (result.success) {
      console.log('Tag unassignment successful:', result.message);
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error unassigning tag:', error);
    throw error;
  }
}

// Usage example
unassignTagFromAsset(5)
  .then(result => {
    console.log('Unassignment completed:', result);
    // Refresh asset list or update UI
  })
  .catch(error => {
    console.error('Unassignment failed:', error);
    // Show error message to user
  });
```

## 🔍 Key Implementation Details

### Backend Process Flow
1. **Validation**: Validates asset and tag existence
2. **Cleanup**: Removes previous tag assignments
3. **Asset Update**: Updates `asset.tags` column with tag name
4. **Collection Update**: Adds tag to asset's `assignedTags` collection
5. **Mapping Record**: Creates record in `asset_tag_assignment` table
6. **Transaction Commit**: All operations committed atomically

### Database Operations
```sql
-- 1. Update asset tags column
UPDATE asset SET tags = 'High Priority' WHERE asset_id = 5;

-- 2. Insert assignment record
INSERT INTO asset_tag_assignment (asset_id, tag_id) 
VALUES (5, 12);
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
- ✅ Transaction behavior validation

### Integration Testing
```bash
# Run specific test class
mvn test -Dtest=AssetTagAssignmentTest

# Run all asset assignment tests
mvn test -Dtest="*AssetTagAssignment*"
```

## 🎯 Benefits

1. **Quick Access**: `asset.tags` column provides immediate tag information without joins
2. **Simple Mapping**: Clean relationship tracking in `asset_tag_assignment` table
3. **Atomic Operations**: All updates happen in single transaction
4. **Frontend Ready**: Simple DTOs for easy frontend integration
5. **Performance**: Optimized for fast queries and minimal complexity

The simplified implementation provides a clean, efficient solution for asset tag management with immediate access and relationship tracking capabilities. 