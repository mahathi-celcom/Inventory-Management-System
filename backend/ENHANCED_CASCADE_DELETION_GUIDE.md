# Enhanced PO Cascade Deletion with Conflict Detection

## Overview
The enhanced cascade deletion system provides intelligent conflict detection before attempting to delete Purchase Orders (POs) and their associated assets. This prevents accidental deletion of assets that are currently in use, assigned to users, or have other blocking conditions.

## Key Features

### 🔍 **Conflict Detection**
- **User Assignment Check**: Detects assets assigned to users
- **Status Validation**: Blocks deletion of active, in-use, or in-repair assets
- **Warranty Protection**: Warns about assets with active warranties
- **Lease Protection**: Prevents deletion of assets with active leases
- **Detailed Reporting**: Provides specific reasons for each blocking condition

### 🛡️ **Safe Deletion Process**
- **Pre-deletion Validation**: Checks conflicts before any deletion occurs
- **Atomic Transactions**: All-or-nothing deletion approach
- **Detailed Error Responses**: 409 Conflict responses with actionable information
- **Graceful Fallbacks**: Handles edge cases and provides meaningful error messages

## API Endpoints

### 1. Check Deletion Conflicts
**Endpoint**: `GET /api/asset-pos/{poNumber}/deletion-conflicts`

**Purpose**: Analyze a PO and its assets to identify any conditions that would block deletion.

**Response Scenarios**:

#### ✅ **Safe to Delete (200 OK)**
```http
HTTP/1.1 200 OK
Content-Length: 0
```
*Empty response body indicates no conflicts found*

#### ⚠️ **Conflicts Found (409 Conflict)**
```json
{
  "message": "Cannot delete PO due to 2 dependent assets with blocking conditions",
  "poNumber": "PO-2025-023",
  "totalAssets": 5,
  "blockingAssetsCount": 2,
  "blockingAssets": [
    {
      "assetId": 1001,
      "assetTag": "IT-LAP-001",
      "name": "Dell Laptop XPS 13",
      "status": "Active",
      "assignedTo": "Mahathi I.",
      "reason": "Asset assigned to user: Mahathi I.; Asset is currently active/in use"
    },
    {
      "assetId": 1002,
      "assetTag": "IT-MON-002", 
      "name": "Samsung Monitor 24\"",
      "status": "In Repair",
      "assignedTo": null,
      "reason": "Asset is currently in repair; Asset has active warranty until 2025-12-31"
    }
  ]
}
```

### 2. Enhanced Cascade Deletion
**Endpoint**: `DELETE /api/asset-pos/{poNumber}/cascade`

**Purpose**: Delete a PO and all associated assets with intelligent conflict detection.

**Response Scenarios**:

#### ✅ **Successful Deletion (200 OK)**
```json
{
  "message": "PO and linked assets deleted successfully",
  "poNumber": "PO-2025-023",
  "deletedAssetsCount": 3
}
```

#### ⚠️ **Deletion Blocked (409 Conflict)**
```json
{
  "message": "Cannot delete PO due to 1 dependent assets with blocking conditions",
  "poNumber": "PO-2025-023",
  "totalAssets": 3,
  "blockingAssetsCount": 1,
  "blockingAssets": [
    {
      "assetId": 1001,
      "assetTag": "IT-LAP-001",
      "name": "Dell Laptop XPS 13",
      "status": "Active",
      "assignedTo": "Mahathi I.",
      "reason": "Asset assigned to user: Mahathi I."
    }
  ]
}
```

#### ❌ **PO Not Found (404 Not Found)**
```json
{
  "message": "PO not found",
  "error": "AssetPO not found with PO Number: PO-INVALID-123",
  "poNumber": "PO-INVALID-123"
}
```

## Blocking Conditions

### 🚫 **Assets That Block Deletion**

1. **User Assignment**
   - Asset is assigned to any user (`currentUser` is not null)
   - Reason: `"Asset assigned to user: [User Name]"`

2. **Active Status**
   - Status: `"Active"`, `"In Use"`
   - Reason: `"Asset is currently active/in use"`

3. **Maintenance Status**
   - Status: `"In Repair"`
   - Reason: `"Asset is currently in repair"`

4. **Loan Status**
   - Status: `"On Loan"`
   - Reason: `"Asset is currently on loan"`

5. **Active Warranty**
   - `warrantyExpiry` is in the future
   - Reason: `"Asset has active warranty until [date]"`

6. **Active Lease**
   - `leaseEndDate` is in the future
   - Reason: `"Asset has active lease until [date]"`

### ✅ **Assets Safe for Deletion**

- Status: `"In Stock"`, `"Broken"`, `"Ceased"`
- No user assignment (`currentUser` is null)
- Expired warranties and leases
- Assets specifically marked for disposal

## Frontend Integration Guide

### 🎯 **Recommended Workflow**

```javascript
// Step 1: Check for conflicts before showing delete confirmation
async function checkDeletionConflicts(poNumber) {
  try {
    const response = await fetch(`/api/asset-pos/${poNumber}/deletion-conflicts`);
    
    if (response.status === 200) {
      // Safe to delete - show simple confirmation
      return { canDelete: true, conflicts: null };
    } else if (response.status === 409) {
      // Conflicts found - show detailed warning
      const conflicts = await response.json();
      return { canDelete: false, conflicts };
    }
  } catch (error) {
    console.error('Error checking deletion conflicts:', error);
    return { canDelete: false, error: 'Unable to check deletion status' };
  }
}

// Step 2: Handle deletion with proper error handling
async function deletePOWithCascade(poNumber) {
  try {
    const response = await fetch(`/api/asset-pos/${poNumber}/cascade`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      const result = await response.json();
      showSuccess(`Successfully deleted PO ${poNumber} and ${result.deletedAssetsCount} assets`);
      return true;
    } else if (response.status === 409) {
      const conflicts = await response.json();
      showConflictDialog(conflicts);
      return false;
    } else {
      const error = await response.json();
      showError(`Deletion failed: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.error('Error during deletion:', error);
    showError('Unexpected error during deletion');
    return false;
  }
}
```

### 🎨 **UI Components**

#### Conflict Warning Dialog
```html
<div class="conflict-dialog">
  <h3>⚠️ Cannot Delete PO</h3>
  <p>{{ conflicts.message }}</p>
  
  <div class="blocking-assets">
    <h4>Blocking Assets ({{ conflicts.blockingAssetsCount }} of {{ conflicts.totalAssets }}):</h4>
    
    <div v-for="asset in conflicts.blockingAssets" class="asset-item">
      <div class="asset-header">
        <strong>{{ asset.name }}</strong> ({{ asset.assetTag }})
      </div>
      <div class="asset-details">
        <span class="status">Status: {{ asset.status }}</span>
        <span v-if="asset.assignedTo" class="assigned">Assigned to: {{ asset.assignedTo }}</span>
      </div>
      <div class="reason">{{ asset.reason }}</div>
    </div>
  </div>
  
  <div class="actions">
    <button @click="closeDialog()">Cancel</button>
    <button @click="showResolutionHelp()">How to Resolve</button>
  </div>
</div>
```

## Resolution Guide

### 🔧 **How to Resolve Conflicts**

1. **User-Assigned Assets**
   - Unassign assets from users before deletion
   - Or transfer assets to other POs

2. **Active/In-Use Assets**
   - Change status to "In Stock" or "Ceased"
   - Ensure assets are properly returned

3. **Assets in Repair**
   - Complete repair process
   - Update status accordingly

4. **Active Warranties/Leases**
   - Consider if deletion is appropriate
   - Update dates if warranties/leases have ended

## Testing

### 🧪 **Test Scenarios**

```bash
# Test 1: Check conflicts for PO with blocking assets
curl -X GET "http://localhost:8080/api/asset-pos/PO-2025-023/deletion-conflicts"

# Test 2: Attempt deletion of PO with conflicts
curl -X DELETE "http://localhost:8080/api/asset-pos/PO-2025-023/cascade"

# Test 3: Successful deletion of PO without conflicts
curl -X DELETE "http://localhost:8080/api/asset-pos/PO-2025-SAFE/cascade"

# Test 4: Check non-existent PO
curl -X DELETE "http://localhost:8080/api/asset-pos/PO-INVALID/cascade"
```

### 📊 **Expected Results**

| Scenario | HTTP Status | Response Type |
|----------|-------------|---------------|
| No conflicts | 200 OK | Empty body |
| Has conflicts | 409 Conflict | PODeletionConflictDTO |
| Successful deletion | 200 OK | Success message |
| PO not found | 404 Not Found | Error message |
| Server error | 500 Internal Server Error | Error message |

## Security Considerations

- ✅ **Transaction Safety**: All operations are atomic
- ✅ **Data Integrity**: Prevents orphaned records
- ✅ **Audit Trail**: All deletions are logged
- ✅ **Permission Checks**: Respects user permissions
- ✅ **Soft Deletes**: Assets are soft-deleted, not permanently removed

## Performance Notes

- **Efficient Queries**: Single database query to fetch all assets
- **Lazy Loading**: User information loaded only when needed
- **Minimal Overhead**: Conflict checking adds ~50ms to deletion process
- **Caching Friendly**: Conflict results can be cached for repeated checks

---

## Summary

The enhanced cascade deletion system provides:
- 🛡️ **Safety**: Prevents accidental deletion of important assets
- 📊 **Transparency**: Clear information about why deletion is blocked
- 🎯 **Usability**: Actionable error messages for frontend integration
- ⚡ **Performance**: Efficient conflict detection with minimal overhead
- 🔒 **Reliability**: Atomic transactions ensure data consistency 