# Angular Proxy Configuration Guide

## 🎯 **Overview**
This guide explains how to properly configure Angular's development proxy to ensure all HTTP requests (including DELETE and PUT) are correctly routed to your backend server.

## 🔧 **Configuration Files**

### **1. `proxy.conf.json`**
```json
{
  "/api/*": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug",
    "headers": {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    },
    "onProxyReq": "function(proxyReq, req, res) { console.log('🔗 Proxying:', req.method, req.url, '→', proxyReq.protocol + '//' + proxyReq.host + proxyReq.path); }",
    "onError": "function(err, req, res) { console.error('❌ Proxy Error:', err.message); }"
  }
}
```

### **2. `angular.json` Configuration**
```json
"serve": {
  "builder": "@angular/build:dev-server",
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

## 🚀 **Starting the Development Server**

Always use the proxy configuration:
```bash
ng serve
# or explicitly
ng serve --proxy-config proxy.conf.json
```

## 🔍 **How Proxy Works**

### **Request Flow:**
1. **Frontend** (http://localhost:4200) makes request to `/api/vendors/123`
2. **Angular Proxy** intercepts the request
3. **Proxy** forwards to `http://localhost:8080/api/vendors/123`
4. **Backend** processes and responds
5. **Proxy** returns response to frontend

### **URL Mapping:**
```
Frontend Request    →    Backend Request
/api/vendors       →    http://localhost:8080/api/vendors
/api/vendors/123   →    http://localhost:8080/api/vendors/123
/api/assets        →    http://localhost:8080/api/assets
```

## ✅ **Verified HTTP Methods**

### **GET Requests**
```typescript
// ✅ Correct - Will be proxied
this.http.get('/api/vendors')
this.http.get('/api/vendors/123')
```

### **POST Requests**
```typescript
// ✅ Correct - Will be proxied
this.http.post('/api/vendors', vendorData)
```

### **PUT Requests (Updates)**
```typescript
// ✅ Correct - Will be proxied
this.http.put('/api/vendors/123', updatedVendor)

// ❌ Wrong - Will try to route to Angular route
this.http.put('http://localhost:8080/api/vendors/123', updatedVendor)
```

### **DELETE Requests**
```typescript
// ✅ Correct - Will be proxied
this.http.delete('/api/vendors/123')

// ❌ Wrong - Will try to route to Angular route
this.http.delete('http://localhost:8080/api/vendors/123')
```

## 🛡️ **Why Proxy is Important**

### **1. CORS Prevention**
Without proxy, requests would be:
- **From**: http://localhost:4200
- **To**: http://localhost:8080
- **Result**: CORS error (different origins)

With proxy:
- **Request**: http://localhost:4200/api/vendors
- **Internally routed**: http://localhost:8080/api/vendors
- **Result**: Same origin, no CORS issues

### **2. Route Conflict Prevention**
```typescript
// ❌ Without proxy - Angular might try to route to /dashboard
this.http.delete('/dashboard/vendor/123')

// ✅ With proxy - Clearly API request
this.http.delete('/api/vendors/123')
```

### **3. Development/Production Consistency**
- **Development**: Proxy routes `/api/*` to `localhost:8080`
- **Production**: Server routes `/api/*` to backend service
- **Code**: Identical in both environments

## 🔧 **Service Implementation**

### **Using Centralized Endpoints**
```typescript
@Injectable()
export class VendorService {
  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {
    // Verify proxy configuration in development
    this.apiConfig.checkProxyConfiguration();
  }

  // ✅ Correct implementation
  updateVendor(id: number, vendor: Partial<Vendor>): Observable<Vendor> {
    const url = this.apiConfig.buildUrlWithId('vendors', 'update', id);
    return this.http.put<Vendor>(url, vendor);
  }

  // ✅ Correct implementation
  deleteVendor(id: number): Observable<void> {
    const url = this.apiConfig.buildUrlWithId('vendors', 'delete', id);
    return this.http.delete<void>(url);
  }
}
```

## 🐛 **Troubleshooting**

### **Common Issues:**

#### **1. Proxy Not Working**
**Symptoms**: 404 errors, requests going to Angular routes
**Solution**:
```bash
# Ensure you start with proxy
ng serve --proxy-config proxy.conf.json

# Check browser network tab for correct URLs
```

#### **2. CORS Errors**
**Symptoms**: CORS policy errors in console
**Solution**:
- Ensure using `/api/*` paths (not full URLs)
- Verify proxy configuration includes CORS headers
- Check backend CORS configuration

#### **3. DELETE/PUT Not Working**
**Symptoms**: 405 Method Not Allowed, routing errors
**Solution**:
```typescript
// ❌ Wrong
this.http.delete(`http://localhost:8080/api/vendors/${id}`)

// ✅ Correct
const url = `/api/vendors/${id}`;
this.http.delete(url)
```

### **Verification Steps:**

1. **Check Browser Network Tab**
   - Requests should show: `localhost:4200/api/vendors/123`
   - Not: `localhost:8080/api/vendors/123`

2. **Check Console Logs**
   - Should see proxy logs: `🔗 Proxying: DELETE /api/vendors/123`

3. **Verify Response**
   - Backend logs should show requests from proxy
   - Status codes should be from backend

## 🧪 **Testing Proxy Configuration**

### **Manual Testing:**
```typescript
// In browser console:
fetch('/api/vendors')
  .then(response => {
    if (response.ok) {
      console.log('✅ Proxy working - GET request successful');
    }
  });

// Test DELETE (be careful with real data!)
fetch('/api/vendors/test-id', { method: 'DELETE' })
  .then(response => {
    console.log('✅ Proxy working - DELETE request routed correctly');
  });
```

### **Service Testing:**
```typescript
// Add to component for testing
testProxyConfiguration(): void {
  console.log('🧪 Testing proxy configuration...');
  
  // Test GET
  this.vendorService.getAllVendors().subscribe({
    next: () => console.log('✅ GET request working'),
    error: (err) => console.error('❌ GET request failed:', err)
  });
}
```

## 🚀 **Production Considerations**

### **Environment Differences:**
- **Development**: Uses Angular proxy (localhost:4200 → localhost:8080)
- **Production**: Uses web server routing (same domain)

### **Build Configuration:**
```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: '/api'  // Same path, different handling
};

// environment.ts
export const environment = {
  production: false,
  apiUrl: '/api'  // Proxied in development
};
```

## ✅ **Best Practices**

1. **Always use relative API paths**: `/api/vendors` not `http://localhost:8080/api/vendors`
2. **Start dev server with proxy**: `ng serve` (with proxy configured)
3. **Use centralized endpoint configuration**: Avoid hardcoded URLs
4. **Test all HTTP methods**: GET, POST, PUT, DELETE
5. **Monitor network tab**: Verify requests are proxied correctly
6. **Check browser console**: Look for proxy logs and errors

## 🔗 **Quick Reference**

### **Correct Request Patterns:**
```typescript
// ✅ All these will be proxied correctly
GET    /api/vendors
POST   /api/vendors
PUT    /api/vendors/123
DELETE /api/vendors/123
PATCH  /api/vendors/123
```

### **Incorrect Request Patterns:**
```typescript
// ❌ These will NOT be proxied
GET    http://localhost:8080/api/vendors
PUT    localhost:8080/api/vendors/123
DELETE backend.company.com/api/vendors/123
```

This configuration ensures all your HTTP requests are properly routed through the proxy, preventing CORS issues and maintaining consistency between development and production environments. 