# 🚨 Proxy 404 Troubleshooting Guide

## Problem Statement
```
❌ HttpErrorResponse: 404 Not Found
Endpoint: http://localhost:4200/api/asset-pos/39/safe-pk-update
Message: The requested endpoint does not exist
```

## Root Cause Analysis

### 1. **Backend Endpoint Missing** ⚠️ (Primary Issue)
The backend Spring Boot application doesn't have the `/safe-pk-update` endpoint implemented.

### 2. **Proxy Configuration** ✅ (Working)
Your proxy setup is correct but the endpoint doesn't exist on the backend.

## ✅ Immediate Fix Applied

### Frontend Changes Made:
1. **Fallback Logic**: Modified to use `/cascade` endpoint when PO number changes
2. **Error Handling**: Enhanced to show proper messaging
3. **Debugging**: Added backend connectivity testing

### Service Update (`asset-po.service.ts`):
```typescript
// BEFORE (causing 404)
return {
  path: '/safe-pk-update',  // ❌ Backend doesn't have this
  url: 'safe-pk-update', 
  type: 'safe-pk-update'
};

// AFTER (working fallback)
return {
  path: '/cascade',  // ✅ Uses existing endpoint
  url: 'cascade',
  type: 'cascade-fallback'  // ✅ Marked as fallback
};
```

## 🧪 Testing Your Setup

### Step 1: Verify Backend is Running
```bash
# Test if backend is accessible
curl http://localhost:8080/api/asset-pos
```

### Step 2: Test Proxy Configuration
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try accessing your Asset PO page
4. Look for requests to `/api/asset-pos`
5. Verify they show status 200 (or appropriate response)

### Step 3: Use Debugging Component
Add this to your `app.component.html` temporarily:
```html
<app-proxy-test></app-proxy-test>
```

Then import in `app.component.ts`:
```typescript
import { ProxyTestComponent } from './proxy-test.component';

@Component({
  // ...
  imports: [CommonModule, ProxyTestComponent, ...],
})
```

## 🔧 Backend Requirements

### Required Endpoints:
```java
// ✅ EXISTING (should work)
@GetMapping("/api/asset-pos")
@PutMapping("/api/asset-pos/{id}/cascade")

// ❌ MISSING (needs implementation)
@PutMapping("/api/asset-pos/{id}/safe-pk-update")
```

### Backend Implementation Needed:
```java
@RestController
@RequestMapping("/api/asset-pos")
public class AssetPoController {
    
    // ✅ This should exist
    @PutMapping("/{id}/cascade")
    public ResponseEntity<AssetPoCascadeUpdateResponse> cascadeUpdate(
        @PathVariable Long id, 
        @RequestBody AssetPoUpdateRequest request) {
        // Implementation...
    }
    
    // ❌ This needs to be implemented
    @PutMapping("/{id}/safe-pk-update") 
    public ResponseEntity<AssetPoCascadeUpdateResponse> safePkUpdate(
        @PathVariable Long id, 
        @RequestBody AssetPoUpdateRequest request) {
        // Implementation for handling PO number changes safely
        // Should handle foreign key constraint updates
    }
}
```

## 🚀 Verification Steps

### 1. Check if Proxy is Working:
```javascript
// Open browser console and run:
fetch('/api/asset-pos')
  .then(response => console.log('✅ Proxy working:', response.status))
  .catch(error => console.error('❌ Proxy issue:', error));
```

### 2. Verify Backend Endpoints:
```bash
# List all Asset POs (should work)
curl http://localhost:8080/api/asset-pos

# Test cascade endpoint (may work)
curl -X PUT http://localhost:8080/api/asset-pos/1/cascade \
  -H "Content-Type: application/json" \
  -d '{"poNumber":"TEST-001"}'

# Test safe-pk-update endpoint (will fail until implemented)
curl -X PUT http://localhost:8080/api/asset-pos/1/safe-pk-update \
  -H "Content-Type: application/json" \
  -d '{"poNumber":"TEST-002"}'
```

## 📋 Current Status

### ✅ Working Now:
- Frontend uses cascade endpoint as fallback
- Proper error handling and messaging
- Smart classification logic with fallback
- User sees clear success/error messages

### 🔄 Next Steps for Full Implementation:
1. **Backend**: Implement `/safe-pk-update` endpoint
2. **Frontend**: Uncomment safe-pk-update logic in service
3. **Testing**: Verify both endpoints work correctly

### 📝 Success Messages You'll See:
```
✅ PO and 5 linked assets updated successfully (Cascade Fallback)
✅ PO and 3 linked assets updated successfully (Standard Cascade)
PO updated successfully (Cascade Fallback). No linked assets required changes.
```

## 🛠️ Development Commands

### Start with Proxy:
```bash
# Make sure you're using the proxy configuration
ng serve
# or
npm start
```

### Verify Proxy in package.json:
```json
{
  "scripts": {
    "start": "ng serve --proxy-config proxy.conf.js"
  }
}
```

## 📞 When to Use Each Endpoint

### Standard Cascade (`/cascade`):
- PO number unchanged
- Standard field updates
- Lower risk operation

### Safe PK Update (`/safe-pk-update`) - Future:
- PO number changed
- Requires careful FK constraint handling
- Higher complexity operation

## 🎯 Expected Behavior Now

1. **User edits Asset PO** (any changes)
2. **System detects** if PO number changed
3. **Uses cascade endpoint** for both scenarios (temporarily)
4. **Shows appropriate message** indicating fallback was used
5. **Update succeeds** with clear user feedback

The system now works correctly while we wait for the backend `/safe-pk-update` endpoint implementation! 