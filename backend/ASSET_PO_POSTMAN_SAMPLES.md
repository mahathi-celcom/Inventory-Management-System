# AssetPO API - Postman Sample Request Bodies

## 🚀 Base Configuration
- **Base URL**: `http://localhost:8080/api/asset-pos`
- **Content-Type**: `application/json`

## 📋 Sample Request Bodies for POST Endpoints

### 1. Create Purchase Order AssetPO
```http
POST /api/asset-pos
Content-Type: application/json

{
  "acquisitionType": "Bought",
  "poNumber": "PO-2024-001",
  "invoiceNumber": "INV-2024-001",
  "acquisitionDate": "2024-01-15",
  "vendorId": 1,
  "ownerType": "Celcom",
  "acquisitionPrice": 50000.00,
  "depreciationPct": 20.0,
  "currentPrice": 45000.00,
  "totalDevices": 10
}
```

### 2. Create Lease AssetPO
```http
POST /api/asset-pos
Content-Type: application/json

{
  "acquisitionType": "Leased",
  "poNumber": "PO-LEASE-2024-001",
  "invoiceNumber": "INV-LEASE-001",
  "acquisitionDate": "2024-01-15",
  "vendorId": 2,
  "ownerType": "Vendor",
  "leaseEndDate": "2026-01-15",
  "rentalAmount": 2000.00,
  "minContractPeriod": 24,
  "acquisitionPrice": 48000.00,
  "depreciationPct": 0.0,
  "currentPrice": 48000.00,
  "totalDevices": 5
}
```

### 3. Create Large IT Equipment Purchase
```http
POST /api/asset-pos
Content-Type: application/json

{
  "acquisitionType": "Purchase",
  "poNumber": "PO-IT-2024-002",
  "invoiceNumber": "INV-IT-002",
  "acquisitionDate": "2024-02-01",
  "vendorId": 3,
  "ownerType": "Company",
  "acquisitionPrice": 250000.00,
  "depreciationPct": 25.0,
  "currentPrice": 200000.00,
  "totalDevices": 50
}
```

### 4. Create Laptop Lease Agreement
```http
POST /api/asset-pos
Content-Type: application/json

{
  "acquisitionType": "Lease",
  "poNumber": "PO-LAPTOP-2024-003",
  "invoiceNumber": "INV-LAPTOP-003",
  "acquisitionDate": "2024-03-01",
  "vendorId": 1,
  "ownerType": "Leased",
  "leaseEndDate": "2027-03-01",
  "rentalAmount": 5000.00,
  "minContractPeriod": 36,
  "acquisitionPrice": 180000.00,
  "depreciationPct": 0.0,
  "currentPrice": 180000.00,
  "totalDevices": 25
}
```

### 5. Create Server Purchase (No Vendor)
```http
POST /api/asset-pos
Content-Type: application/json

{
  "acquisitionType": "Purchase",
  "poNumber": "PO-SERVER-2024-004",
  "invoiceNumber": "INV-SERVER-004",
  "acquisitionDate": "2024-02-15",
  "ownerType": "Company",
  "acquisitionPrice": 75000.00,
  "depreciationPct": 30.0,
  "currentPrice": 65000.00,
  "totalDevices": 3
}
```

## 📝 Sample Request Bodies for PUT Endpoints

### Update AssetPO (Example ID: 1)
```http
PUT /api/asset-pos/1
Content-Type: application/json

{
  "acquisitionType": "Purchase",
  "poNumber": "PO-2024-001-UPDATED",
  "invoiceNumber": "INV-2024-001-UPDATED",
  "acquisitionDate": "2024-01-15",
  "vendorId": 1,
  "ownerType": "Company",
  "acquisitionPrice": 55000.00,
  "depreciationPct": 22.0,
  "currentPrice": 42000.00,
  "totalDevices": 12
}
```

## 🔍 Sample GET Requests

### 1. Get All AssetPOs (Paginated)
```http
GET /api/asset-pos?page=0&size=10&sortBy=poNumber&sortDir=ASC&status=Active
```

### 2. Get AssetPO by ID
```http
GET /api/asset-pos/1
```

### 3. Search AssetPOs
```http
GET /api/asset-pos/search?searchTerm=PO-2024&page=0&size=10&sortBy=acquisitionDate&sortDir=DESC
```

### 4. Get Active AssetPOs
```http
GET /api/asset-pos/active
```

### 5. Advanced Filtering
```http
GET /api/asset-pos/filter?acquisitionType=Leased&vendorId=2&page=0&size=10
```

### 6. Filter by Acquisition Type
```http
GET /api/asset-pos/by-acquisition-type?acquisitionType=Purchase&page=0&size=10
```

### 7. Filter by Vendor
```http
GET /api/asset-pos/by-vendor/1?page=0&size=10
```

### 8. Filter by Owner Type
```http
GET /api/asset-pos/by-owner-type?ownerType=Company&page=0&size=10
```

### 9. Filter by Date Range
```http
GET /api/asset-pos/by-date-range?startDate=2024-01-01&endDate=2024-12-31&page=0&size=10&sortBy=acquisitionDate&sortDir=DESC
```

### 10. Get Expiring Leases
```http
GET /api/asset-pos/leases/expiring?daysAhead=90
```

### 11. Get Leases Expiring Between Dates
```http
GET /api/asset-pos/leases/expiring-between?startDate=2024-12-01&endDate=2025-03-31
```

## ⚙️ Sample PATCH Requests

### Activate AssetPO
```http
PATCH /api/asset-pos/1/activate
```

### Deactivate AssetPO
```http
PATCH /api/asset-pos/1/deactivate
```

## 🗑️ Sample DELETE Request

### Delete AssetPO
```http
DELETE /api/asset-pos/1
```

## 📊 Expected Response Examples

### Successful POST Response
```json
{
  "id": 1,
  "acquisitionType": "Purchase",
  "poNumber": "PO-2024-001",
  "invoiceNumber": "INV-2024-001",
  "acquisitionDate": "2024-01-15",
  "vendorId": 1,
  "vendorName": "Tech Solutions Ltd",
  "ownerType": "Company",
  "leaseEndDate": null,
  "rentalAmount": null,
  "minContractPeriod": null,
  "acquisitionPrice": 50000.00,
  "depreciationPct": 20.0,
  "currentPrice": 45000.00,
  "totalDevices": 10,
  "status": "Active",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": null
}
```

### Paginated GET Response
```json
{
  "content": [
    {
      "id": 1,
      "acquisitionType": "Purchase",
      "poNumber": "PO-2024-001",
      // ... other fields
    }
  ],
  "pageNumber": 0,
  "pageSize": 10,
  "totalElements": 25,
  "totalPages": 3,
  "last": false,
  "first": true
}
```

## 🚨 Validation Error Examples

### Missing Required Fields
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    {
      "field": "poNumber",
      "message": "PO Number is required"
    },
    {
      "field": "acquisitionPrice",
      "message": "Acquisition price is required"
    }
  ]
}
```

## 💡 Testing Tips

1. **Create Vendors First**: If using vendorId, make sure vendors exist in the system
2. **Date Format**: Use `yyyy-MM-dd` format for dates
3. **Decimal Values**: Use proper decimal format for monetary values
4. **Status**: Will be automatically set to "Active" for new records
5. **Pagination**: Default page=0, size=10 if not specified
6. **Sorting**: Available sort fields: `poNumber`, `acquisitionDate`, `acquisitionPrice`, `totalDevices`

## 🔧 Postman Environment Variables

Create these variables in Postman for easier testing:
- `baseUrl`: `http://localhost:8080`
- `assetPoId`: `1` (update after creating records)
- `vendorId`: `1` (use existing vendor ID)

Example usage: `{{baseUrl}}/api/asset-pos/{{assetPoId}}` 