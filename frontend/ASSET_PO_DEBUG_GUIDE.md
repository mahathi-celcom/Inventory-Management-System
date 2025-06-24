# Asset PO ID Debug Guide

## Issue Summary
Asset PO update and delete operations are failing because the ID is undefined, causing API requests like `/api/asset-pos/undefined` which result in 400 Bad Request errors.

## Enhanced Debugging Features

### 1. Browser Console Debugging
Open your browser's Developer Tools (F12) and watch the console when:
- Loading the Asset PO list
- Clicking Edit on an Asset PO
- Clicking Delete on an Asset PO

### 2. Debug Log Messages

#### When Loading Data:
```
📦 Mapped Asset POs: X items
```

#### When Editing:
```
🔍 Edit Asset PO Debug: {
  originalPo: {...},
  poId: X,
  hasPoId: true/false,
  idType: "number/undefined",
  allKeys: [array of all object keys]
}
✅ Edit mode activated: {
  editingPo: {...},
  editingPoId: X
}
```

#### When Deleting:
```
🔍 Delete Asset PO Debug: {same structure as edit}
🗑️ Proceeding with DELETE for Asset PO ID: X
🗑️ DELETE URL: /api/asset-pos/X
```

#### When Submitting Updates:
```
Submitting Asset PO: {
  isEditMode: true/false,
  editingPo: {...},
  editingPoId: X,
  formValue: {...}
}
📝 Proceeding with UPDATE for Asset PO ID: X
📝 UPDATE URL: /api/asset-pos/X
```

### 3. What to Look For

#### Problem Indicators:
- `poId: undefined` in debug logs
- `hasPoId: false` in debug logs
- `idType: "undefined"` in debug logs
- Error messages about "Missing ID information"
- API URLs containing "undefined": `/api/asset-pos/undefined`

#### Expected Behavior:
- `poId: [some number]` in debug logs
- `hasPoId: true` in debug logs
- `idType: "number"` in debug logs
- API URLs with actual IDs: `/api/asset-pos/123`

## Potential Root Causes & Solutions

### 1. Backend ID Field Mismatch
**Problem**: Backend returns `id` instead of `poId`
**Detection**: Check the `allKeys` array in debug logs
**Solution**: Our enhanced service automatically maps `id`, `poId`, and `assetPoId` fields

### 2. Data Type Issues
**Problem**: ID comes as string instead of number
**Detection**: `idType: "string"` in debug logs
**Solution**: Our utility functions handle type conversion

### 3. Missing ID in Backend Response
**Problem**: Backend doesn't return ID field at all
**Detection**: `allKeys` array doesn't contain any ID-related fields
**Solution**: Check your backend API endpoint

### 4. Frontend Data Corruption
**Problem**: Data gets corrupted during processing
**Detection**: ID present in `originalPo` but missing after processing
**Solution**: Enhanced validation prevents this

## Manual Testing Steps

### Step 1: Check Data Loading
1. Open Asset PO management page
2. Open browser console
3. Look for `📦 Mapped Asset POs: X items` message
4. If you see warnings about missing IDs, the backend data is the issue

### Step 2: Test Edit Operation
1. Click "Edit" on any Asset PO
2. Check for `🔍 Edit Asset PO Debug:` message
3. Verify `poId` is not undefined
4. Verify `hasPoId: true`

### Step 3: Test Delete Operation
1. Click "Delete" on any Asset PO
2. Check for similar debug messages
3. Verify the DELETE URL doesn't contain "undefined"

### Step 4: Test Update Operation
1. Edit an Asset PO and submit
2. Check for `📝 UPDATE URL:` message
3. Verify it contains a valid ID number

## Backend API Verification

### Test with Postman/curl:
```bash
GET /api/asset-pos
```

Check if the response contains:
- `poId` field (preferred)
- `id` field (will be mapped)
- `assetPoId` field (will be mapped)

Example expected response:
```json
[
  {
    "poId": 1,  // or "id": 1
    "poNumber": "PO-001",
    "acquisitionType": "Bought",
    // ... other fields
  }
]
```

## Quick Fixes to Try

### 1. If Backend Uses Different ID Field
The service now automatically handles these variations:
- `id` → mapped to `poId`
- `assetPoId` → mapped to `poId`
- `poId` → used as-is

### 2. If IDs are Strings
The service converts string IDs to numbers automatically.

### 3. If Backend Returns No ID
This is a backend issue that needs to be fixed on the server side.

## Error Prevention

The enhanced code now:
- ✅ Validates IDs before API calls
- ✅ Shows user-friendly error messages
- ✅ Prevents undefined API calls
- ✅ Logs detailed debugging information
- ✅ Handles multiple ID field formats
- ✅ Converts ID types automatically

## Next Steps

1. **Run the app** and check browser console for debug messages
2. **Share the debug output** with specific error details
3. **Test each operation** (load, edit, delete, update) individually
4. **Check backend API responses** if frontend debugging shows missing IDs

The enhanced debugging will help us identify exactly where the ID is getting lost! 