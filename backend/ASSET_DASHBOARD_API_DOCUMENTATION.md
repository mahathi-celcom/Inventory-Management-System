# Asset Management Dashboard API Documentation

## Overview

This documentation describes the backend APIs for the dynamic asset management dashboard. The dashboard provides comprehensive analytics, reporting, and visualization capabilities for asset management.

## Base URL
```
http://localhost:8080/api/analytics
```

## Authentication
The APIs use basic authentication (if configured) or can be accessed directly based on your security configuration.

## Endpoints

### 1. Get Analytics Summary
**Endpoint:** `GET /api/analytics/summary`

**Description:** Returns comprehensive analytics summary including all dashboard data points.

**Response:**
```json
{
  "assetCountByStatus": {
    "Active": 150,
    "Inactive": 25,
    "Faulty": 8,
    "Retired": 12
  },
  "assetCountByOS": {
    "Windows 10": 85,
    "Windows 11": 45,
    "macOS": 30,
    "Linux": 15,
    "No OS": 20
  },
  "assetCountByDepartmentAndType": {
    "IT": {
      "Laptop": 50,
      "Desktop": 30,
      "Server": 10
    },
    "Finance": {
      "Laptop": 25,
      "Desktop": 15
    },
    "HR": {
      "Laptop": 20,
      "Desktop": 10
    }
  },
  "warrantyStatusByAssetType": {
    "Laptop": {
      "assetType": "Laptop",
      "inWarranty": 75,
      "outOfWarranty": 20,
      "noWarranty": 5,
      "totalAssets": 100,
      "inWarrantyPercentage": 75.0,
      "outOfWarrantyPercentage": 20.0
    },
    "Desktop": {
      "assetType": "Desktop",
      "inWarranty": 40,
      "outOfWarranty": 15,
      "noWarranty": 5,
      "totalAssets": 60,
      "inWarrantyPercentage": 66.67,
      "outOfWarrantyPercentage": 25.0
    }
  },
  "assetAging": [
    {
      "ageRange": "<1 year",
      "count": 45
    },
    {
      "ageRange": "1-2 years",
      "count": 68
    },
    {
      "ageRange": "2-3 years",
      "count": 52
    },
    {
      "ageRange": ">3 years",
      "count": 30
    }
  ]
}
```

### 2. Get Asset Aging Data
**Endpoint:** `GET /api/analytics/aging`

**Parameters:**
- `department` (optional): Filter by department
- `assetType` (optional): Filter by asset type

**Examples:**
```
GET /api/analytics/aging
GET /api/analytics/aging?department=IT
GET /api/analytics/aging?assetType=Laptop
```

**Response:**
```json
[
  {
    "ageRange": "<1 year",
    "count": 45,
    "department": "IT"
  },
  {
    "ageRange": "1-2 years",
    "count": 68,
    "assetType": "Laptop"
  }
]
```

### 3. Get Assets by Age Range
**Endpoint:** `GET /api/analytics/assets/age-range/{ageRange}`

**Parameters:**
- `ageRange` (path): Age range to filter by (`<1 year`, `1-2 years`, `2-3 years`, `>3 years`, `Unknown`)
- `department` (optional): Filter by department
- `assetType` (optional): Filter by asset type

**Examples:**
```
GET /api/analytics/assets/age-range/<1 year
GET /api/analytics/assets/age-range/1-2 years?department=IT
GET /api/analytics/assets/age-range/>3 years?assetType=Laptop
```

**Response:**
```json
[
  {
    "assetId": 1,
    "name": "Dell Laptop XPS 13",
    "serialNumber": "DL123456789",
    "itAssetCode": "IT-LAP-001",
    "status": "Active",
    "assetCategory": "HARDWARE",
    "assetTypeName": "Laptop",
    "makeName": "Dell",
    "modelName": "XPS 13",
    "currentUserName": "John Doe",
    "currentUserDepartment": "IT",
    "currentUserDesignation": "Software Engineer",
    "inventoryLocation": "Office Floor 1",
    "osName": "Windows 10",
    "osVersion": "21H2",
    "poNumber": "PO-2023-001",
    "acquisitionDate": "2023-01-15",
    "acquisitionPrice": 1200.00,
    "warrantyExpiry": "2025-01-15",
    "warrantyStatus": "ACTIVE",
    "ageRange": "<1 year",
    "ageInDays": 180,
    "assignedTags": "High Priority, Development",
    "createdAt": "2023-01-15T10:30:00"
  }
]
```

### 4. Generate CSV Report
**Endpoint:** `GET /api/analytics/export/csv`

**Parameters:**
- `ageRange` (optional): Filter by age range
- `department` (optional): Filter by department
- `assetType` (optional): Filter by asset type

**Examples:**
```
GET /api/analytics/export/csv
GET /api/analytics/export/csv?department=IT
GET /api/analytics/export/csv?ageRange=<1 year&department=IT
```

**Response:** CSV file download with headers:
```
Content-Type: text/csv
Content-Disposition: attachment; filename=asset_report_2024-01-15_14-30-00.csv
```

### 5. Generate Full CSV Report
**Endpoint:** `GET /api/analytics/export/csv/full`

**Description:** Downloads a complete CSV report of all assets without filters.

**Response:** CSV file download with all asset data.

### 6. Get Asset Status Summary
**Endpoint:** `GET /api/analytics/status-summary`

**Description:** Returns asset counts grouped by status (for widgets/charts).

**Response:**
```json
{
  "Active": 150,
  "Inactive": 25,
  "Faulty": 8,
  "Retired": 12
}
```

### 7. Get Asset OS Summary
**Endpoint:** `GET /api/analytics/os-summary`

**Description:** Returns asset counts grouped by operating system (for widgets/charts).

**Response:**
```json
{
  "Windows 10": 85,
  "Windows 11": 45,
  "macOS": 30,
  "Linux": 15,
  "No OS": 20
}
```

### 8. Get Warranty Summary
**Endpoint:** `GET /api/analytics/warranty-summary`

**Description:** Returns warranty status summary by asset type (for charts/tables).

**Response:**
```json
{
  "Laptop": {
    "assetType": "Laptop",
    "inWarranty": 75,
    "outOfWarranty": 20,
    "noWarranty": 5,
    "totalAssets": 100,
    "inWarrantyPercentage": 75.0,
    "outOfWarrantyPercentage": 20.0
  }
}
```

### 9. Get Department-Type Summary
**Endpoint:** `GET /api/analytics/department-type-summary`

**Description:** Returns asset counts grouped by department and asset type (for tabular display).

**Response:**
```json
{
  "IT": {
    "Laptop": 50,
    "Desktop": 30,
    "Server": 10
  },
  "Finance": {
    "Laptop": 25,
    "Desktop": 15
  }
}
```

## Data Models

### AssetAnalyticsSummaryDTO
Main container for all analytics data.

### AssetReportDTO
Detailed asset information for reporting.

### WarrantySummaryDTO
```json
{
  "assetType": "string",
  "inWarranty": "number",
  "outOfWarranty": "number", 
  "noWarranty": "number",
  "totalAssets": "number",
  "inWarrantyPercentage": "number",
  "outOfWarrantyPercentage": "number"
}
```

### AssetAgingDTO
```json
{
  "ageRange": "string",
  "count": "number",
  "department": "string (optional)",
  "assetType": "string (optional)"
}
```

## Frontend Integration Examples

### 1. Status Chart
```javascript
// Fetch data for status pie chart
fetch('/api/analytics/status-summary')
  .then(response => response.json())
  .then(data => {
    // Use data for Chart.js, D3.js, or any charting library
    createPieChart(data);
  });
```

### 2. Asset Aging Chart
```javascript
// Fetch aging data for bar chart
fetch('/api/analytics/aging')
  .then(response => response.json())
  .then(data => {
    createBarChart(data);
  });
```

### 3. Department-Type Table
```javascript
// Fetch data for data table
fetch('/api/analytics/department-type-summary')
  .then(response => response.json())
  .then(data => {
    createDataTable(data);
  });
```

### 4. Export CSV
```javascript
// Download CSV report
function exportCSV(filters = {}) {
  const params = new URLSearchParams(filters);
  window.open(`/api/analytics/export/csv?${params}`);
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200 OK`: Successful response
- `400 Bad Request`: Invalid parameters
- `500 Internal Server Error`: Server error

Error responses include:
```json
{
  "timestamp": "2024-01-15T14:30:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Error description",
  "path": "/api/analytics/summary"
}
```

## Performance Considerations

1. **Caching**: Consider implementing Redis caching for frequently accessed analytics data
2. **Database Optimization**: Ensure proper indexing on fields used in GROUP BY clauses
3. **Pagination**: For large datasets, implement pagination in detailed asset lists
4. **Async Processing**: For large CSV exports, consider async processing with download links

## Security

1. **CORS**: Configured for specified origins
2. **Authentication**: Basic auth or JWT (based on security configuration)
3. **Input Validation**: All parameters are validated
4. **SQL Injection**: Protected by using JPA queries

## Usage Tips

1. Use specific endpoints for widgets rather than the full summary for better performance
2. Implement client-side caching for data that doesn't change frequently
3. Use filters effectively to reduce data transfer
4. Consider implementing real-time updates using WebSockets for live dashboards 