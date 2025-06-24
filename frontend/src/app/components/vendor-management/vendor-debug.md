# Vendor Management Debug Guide

## Overview
This guide helps debug and validate vendor update and delete operations.

## Debug Steps

### 1. Check Browser Network Tab
1. Open Browser Developer Tools (F12)
2. Go to Network tab
3. Perform vendor operations (create/update/delete)
4. Look for:
   - `PUT /api/vendors/{id}` for updates
   - `DELETE /api/vendors/{id}` for deletions
   - Check request payload and response

### 2. Console Logging
The component now includes detailed console logging:
- Look for 🔍, 🔄, ✅, ❌ emojis in console
- Check operation flow and error details

### 3. API Endpoint Verification

#### Update Operation
- **URL**: `PUT /api/vendors/{id}`
- **Payload**: `{ "name": "...", "contactInfo": "...", "status": "..." }`
- **Response**: Updated vendor object

#### Delete Operation
- **URL**: `DELETE /api/vendors/{id}`
- **Response**: Empty (204) or success message

### 4. Common Issues & Solutions

#### Update Issues:
1. **Vendor ID missing**: Check if `editingVendor.vendorId` exists
2. **Field mapping**: Backend expects `name` field, not `name`
3. **Status validation**: Ensure status is "Active" or "Inactive"

#### Delete Issues:
1. **404 Error**: Vendor already deleted or doesn't exist
2. **409 Conflict**: Vendor referenced by other entities
3. **Permission issues**: Check backend authorization

### 5. Test Scenarios

#### Update Test:
1. Click Edit on any vendor
2. Modify vendor name/contact/status
3. Click Save
4. Check console for PUT request
5. Verify UI updates immediately

#### Delete Test:
1. Click Delete on any vendor
2. Confirm deletion
3. Check console for DELETE request
4. Verify vendor removed from list

### 6. Debug Helper
Call `debugCurrentState()` in component to log current state:
```typescript
// In browser console:
// Find the component instance and call:
component.debugCurrentState();
```

### 7. Backend Validation
Ensure backend endpoints exist:
- `PUT /api/vendors/{id}` - Update vendor
- `DELETE /api/vendors/{id}` - Delete vendor

### 8. CORS Issues
If seeing CORS errors:
1. Check proxy.conf.json configuration
2. Ensure backend allows PUT/DELETE methods
3. Verify Content-Type headers

## Quick Fixes

### If Updates Don't Reflect:
1. Check form validation
2. Verify vendor ID is passed correctly
3. Look for backend validation errors
4. Check response mapping

### If Deletes Don't Work:
1. Confirm vendor ID exists
2. Check backend response (200/204)
3. Verify frontend removes from list
4. Look for constraint violations

## Error Messages
Enhanced error messages now provide specific feedback:
- Network connectivity issues
- Server errors (500)
- Not found errors (404)
- Validation errors (400)
- Conflict errors (409) 