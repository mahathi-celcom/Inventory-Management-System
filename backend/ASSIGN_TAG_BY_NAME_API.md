# Assign Tag by Name API Documentation

## Overview
This API allows you to assign a tag to an asset using only the tag name. If the tag doesn't exist, it will be automatically created. The API also updates the asset's tags column and prevents duplicate assignments.

## Endpoint Details

### Assign Tag by Name
**POST** `/api/asset-tag-assignments/by-name`

#### Request Body
```json
{
  "assetId": 123,
  "tagName": "High Priority"
}
```

#### Response (Success - 201 Created)
```json
{
  "id": 123,
  "assetId": 123,
  "tagId": 45,
  "assetName": "Dell Laptop XPS 13",
  "tagName": "High Priority"
}
```

#### Error Responses

**400 Bad Request** - Validation Error
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Tag name is required",
  "path": "/api/asset-tag-assignments/by-name"
}
```

**400 Bad Request** - Duplicate Assignment
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Tag 'High Priority' is already assigned to this asset",
  "path": "/api/asset-tag-assignments/by-name"
}
```

**404 Not Found** - Asset Not Found
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Asset not found with assetId: 123",
  "path": "/api/asset-tag-assignments/by-name"
}
```

## DTO Structure

### AssetTagAssignmentByNameDTO (Request)
```typescript
interface AssetTagAssignmentByNameDTO {
  assetId: number;     // Required - ID of the asset
  tagName: string;     // Required - Name of the tag (will be created if doesn't exist)
}
```

### AssetTagAssignmentDTO (Response)
```typescript
interface AssetTagAssignmentDTO {
  id: number;          // Assignment ID (same as assetId for composite key)
  assetId: number;     // Asset ID
  tagId: number;       // Tag ID (auto-generated if tag was created)
  assetName: string;   // Asset name for display
  tagName: string;     // Tag name for display
}
```

## Frontend Integration Examples

### JavaScript/TypeScript (Fetch API)
```typescript
async function assignTagByName(assetId: number, tagName: string): Promise<AssetTagAssignmentDTO> {
  const response = await fetch('/api/asset-tag-assignments/by-name', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assetId: assetId,
      tagName: tagName
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to assign tag');
  }

  return await response.json();
}

// Usage example
try {
  const assignment = await assignTagByName(123, "High Priority");
  console.log('Tag assigned successfully:', assignment);
  // Update UI with assignment details
} catch (error) {
  console.error('Error assigning tag:', error.message);
  // Show error message to user
}
```

### Angular Service Example
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssetTagAssignmentService {
  private baseUrl = '/api/asset-tag-assignments';

  constructor(private http: HttpClient) {}

  assignTagByName(assetId: number, tagName: string): Observable<AssetTagAssignmentDTO> {
    const request: AssetTagAssignmentByNameDTO = {
      assetId: assetId,
      tagName: tagName
    };
    
    return this.http.post<AssetTagAssignmentDTO>(`${this.baseUrl}/by-name`, request);
  }
}

// Component usage
export class AssetDetailComponent {
  constructor(private assignmentService: AssetTagAssignmentService) {}

  onAssignTag(assetId: number, tagName: string) {
    this.assignmentService.assignTagByName(assetId, tagName).subscribe({
      next: (assignment) => {
        console.log('Tag assigned:', assignment);
        // Update component state
        this.refreshAssetDetails();
      },
      error: (error) => {
        console.error('Error:', error);
        // Show error message
      }
    });
  }
}
```

### React Hook Example
```typescript
import { useState } from 'react';

interface UseAssetTagAssignment {
  assignTagByName: (assetId: number, tagName: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useAssetTagAssignment(): UseAssetTagAssignment {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignTagByName = async (assetId: number, tagName: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/asset-tag-assignments/by-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assetId, tagName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign tag');
      }

      const assignment = await response.json();
      console.log('Tag assigned successfully:', assignment);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { assignTagByName, loading, error };
}

// Component usage
function AssetTagForm({ assetId }: { assetId: number }) {
  const [tagName, setTagName] = useState('');
  const { assignTagByName, loading, error } = useAssetTagAssignment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    try {
      await assignTagByName(assetId, tagName.trim());
      setTagName(''); // Clear form
      // Show success message
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={tagName}
        onChange={(e) => setTagName(e.target.value)}
        placeholder="Enter tag name"
        disabled={loading}
      />
      <button type="submit" disabled={loading || !tagName.trim()}>
        {loading ? 'Assigning...' : 'Assign Tag'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

## Key Features

1. **Auto-Creation**: If the tag doesn't exist, it will be automatically created
2. **Duplicate Prevention**: Prevents assigning the same tag to an asset multiple times
3. **Asset Tags Column Update**: Updates the `tags` column in the asset table for quick reference
4. **Comprehensive Response**: Returns complete assignment details for immediate UI updates
5. **Validation**: Validates both asset existence and tag name requirements
6. **Transaction Safety**: All operations are wrapped in a transaction for data consistency

## Comparison with Existing Endpoint

### Existing Endpoint (by ID)
```
POST /api/asset-tag-assignments
{
  "assetId": 123,
  "tagId": 45
}
```

### New Endpoint (by Name)
```
POST /api/asset-tag-assignments/by-name
{
  "assetId": 123,
  "tagName": "High Priority"
}
```

The new endpoint is more user-friendly as it doesn't require the frontend to:
1. Search for existing tags first
2. Create tags separately if they don't exist
3. Handle the complexity of tag ID management

This simplifies frontend development and provides a better user experience. 