# API Setup Guide

## 🚀 Quick Start

### 1. Start Your Backend Server
Make sure your backend API server is running on `http://localhost:8080`

### 2. Start Angular with Proxy
```bash
npm run start:proxy
```

This will start the Angular dev server with proxy configuration that routes all `/api/*` requests to your backend.

## 🔧 Configuration Details

### Proxy Configuration (`proxy.conf.json`)
```json
{
  "/api/*": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

### API Endpoints Used
- **Vendors**: `GET /api/vendors`
- **Asset POs**: 
  - `GET /api/asset-pos` (list all)
  - `POST /api/asset-pos` (create)
  - `PUT /api/asset-pos/{id}` (update)
  - `DELETE /api/asset-pos/{id}` (delete)

## 🐛 Troubleshooting

### "Unexpected token '<'" Error
This happens when API calls hit the Angular dev server instead of your backend:
1. Make sure you're using `npm run start:proxy`
2. Verify your backend is running on port 8080
3. Check browser network tab to see if requests go to correct URLs

### CORS Issues
If you see CORS errors, add these headers to your backend:
```
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Connection Refused
- Verify backend server is running
- Check if port 8080 is available
- Try accessing `http://localhost:8080/api/vendors` directly in browser 