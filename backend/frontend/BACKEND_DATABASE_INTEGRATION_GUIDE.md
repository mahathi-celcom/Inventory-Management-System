# Backend Database Integration Guide for Analytics Dashboard

## Overview
The frontend analytics dashboard is ready and configured to consume data from backend APIs. This guide provides detailed requirements and implementation suggestions for the backend database integration.

## Required API Endpoints

### 1. Asset Status Summary
**Endpoint:** `GET /api/analytics/status-summary`

**Database Query Logic:**
```sql
SELECT 
    status,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM assets)), 2) as percentage
FROM assets 
GROUP BY status
ORDER BY count DESC;
```

**Expected Response:**
```json
[
    {
        "status": "Active",
        "count": 245,
        "percentage": 65.5
    },
    {
        "status": "In Repair",
        "count": 89,
        "percentage": 23.8
    },
    {
        "status": "Retired",
        "count": 40,
        "percentage": 10.7
    }
]
```

### 2. OS Type Summary
**Endpoint:** `GET /api/analytics/os-summary`

**Database Query Logic:**
```sql
SELECT 
    os.name as osType,
    COUNT(a.id) as count,
    ROUND((COUNT(a.id) * 100.0 / (SELECT COUNT(*) FROM assets WHERE os_id IS NOT NULL)), 2) as percentage
FROM os_versions os
LEFT JOIN assets a ON a.os_id = os.id
WHERE a.id IS NOT NULL
GROUP BY os.id, os.name
ORDER BY count DESC;
```

**Expected Response:**
```json
[
    {
        "osType": "Windows 11",
        "count": 156,
        "percentage": 41.6
    },
    {
        "osType": "Windows 10",
        "count": 134,
        "percentage": 35.7
    },
    {
        "osType": "macOS Ventura",
        "count": 45,
        "percentage": 12.0
    },
    {
        "osType": "Ubuntu 22.04",
        "count": 40,
        "percentage": 10.7
    }
]
```

### 3. Department-Type Matrix
**Endpoint:** `GET /api/analytics/department-type-summary`

**Database Query Logic:**
```sql
SELECT 
    u.department,
    at.name as assetType,
    COUNT(a.id) as count
FROM assets a
JOIN users u ON a.assigned_user_id = u.id
JOIN asset_types at ON a.asset_type_id = at.id
WHERE u.department IS NOT NULL
GROUP BY u.department, at.name
ORDER BY u.department, count DESC;
```

**Expected Response:**
```json
[
    {
        "department": "IT",
        "assetType": "Laptop",
        "count": 45
    },
    {
        "department": "IT",
        "assetType": "Desktop",
        "count": 23
    },
    {
        "department": "Finance",
        "assetType": "Laptop",
        "count": 34
    }
]
```

### 4. Warranty Summary
**Endpoint:** `GET /api/analytics/warranty-summary`

**Database Query Logic:**
```sql
SELECT 
    at.name as assetType,
    SUM(CASE WHEN a.warranty_expiry_date > CURRENT_DATE THEN 1 ELSE 0 END) as inWarranty,
    SUM(CASE WHEN a.warranty_expiry_date <= CURRENT_DATE OR a.warranty_expiry_date IS NULL THEN 1 ELSE 0 END) as outOfWarranty,
    COUNT(*) as totalAssets,
    ROUND((SUM(CASE WHEN a.warranty_expiry_date > CURRENT_DATE THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as warrantyPercentage
FROM assets a
JOIN asset_types at ON a.asset_type_id = at.id
GROUP BY at.id, at.name
ORDER BY totalAssets DESC;
```

**Expected Response:**
```json
[
    {
        "assetType": "Laptop",
        "inWarranty": 89,
        "outOfWarranty": 45,
        "totalAssets": 134,
        "warrantyPercentage": 66.4
    },
    {
        "assetType": "Desktop",
        "inWarranty": 34,
        "outOfWarranty": 78,
        "totalAssets": 112,
        "warrantyPercentage": 30.4
    }
]
```

### 5. Asset Aging Summary (with filters)
**Endpoint:** `GET /api/analytics/aging`

**Query Parameters:**
- `department` (optional): Filter by department
- `assetType` (optional): Filter by asset type

**Database Query Logic:**
```sql
SELECT 
    CASE 
        WHEN DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 < 1 THEN '0-1 years'
        WHEN DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 < 2 THEN '1-2 years'
        WHEN DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 < 3 THEN '2-3 years'
        WHEN DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 < 5 THEN '3-5 years'
        ELSE '5+ years'
    END as ageRange,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM assets WHERE acquisition_date IS NOT NULL)), 2) as percentage
FROM assets a
JOIN users u ON a.assigned_user_id = u.id
JOIN asset_types at ON a.asset_type_id = at.id
WHERE a.acquisition_date IS NOT NULL
    AND (? IS NULL OR u.department = ?)
    AND (? IS NULL OR at.name = ?)
GROUP BY 
    CASE 
        WHEN DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 < 1 THEN '0-1 years'
        WHEN DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 < 2 THEN '1-2 years'
        WHEN DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 < 3 THEN '2-3 years'
        WHEN DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 < 5 THEN '3-5 years'
        ELSE '5+ years'
    END
ORDER BY 
    MIN(DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365);
```

**Expected Response:**
```json
[
    {
        "ageRange": "0-1 years",
        "count": 67,
        "percentage": 18.5
    },
    {
        "ageRange": "1-2 years",
        "count": 89,
        "percentage": 24.6
    },
    {
        "ageRange": "2-3 years",
        "count": 123,
        "percentage": 34.0
    },
    {
        "ageRange": "3-5 years",
        "count": 67,
        "percentage": 18.5
    },
    {
        "ageRange": "5+ years",
        "count": 16,
        "percentage": 4.4
    }
]
```

### 6. Detailed Assets by Age Range
**Endpoint:** `GET /api/analytics/assets/age-range/{ageRange}`

**Query Parameters:**
- `department` (optional): Filter by department
- `assetType` (optional): Filter by asset type

**Database Query Logic:**
```sql
SELECT 
    a.id,
    a.asset_tag as assetTag,
    a.serial_number as serialNumber,
    at.name as assetType,
    u.department,
    CONCAT(u.first_name, ' ', u.last_name) as assignedUser,
    a.acquisition_date as acquisitionDate,
    ROUND(DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365.0, 1) as ageInYears,
    a.status
FROM assets a
JOIN users u ON a.assigned_user_id = u.id
JOIN asset_types at ON a.asset_type_id = at.id
WHERE a.acquisition_date IS NOT NULL
    AND (
        (? = '0-1 years' AND DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 < 1) OR
        (? = '1-2 years' AND DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 >= 1 AND DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 < 2) OR
        (? = '2-3 years' AND DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 >= 2 AND DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 < 3) OR
        (? = '3-5 years' AND DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 >= 3 AND DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 < 5) OR
        (? = '5+ years' AND DATEDIFF(CURRENT_DATE, a.acquisition_date) / 365 >= 5)
    )
    AND (? IS NULL OR u.department = ?)
    AND (? IS NULL OR at.name = ?)
ORDER BY a.acquisition_date DESC;
```

**Expected Response:**
```json
[
    {
        "id": 123,
        "assetTag": "LAP-2023-001",
        "serialNumber": "SN123456789",
        "assetType": "Laptop",
        "department": "IT",
        "assignedUser": "John Doe",
        "acquisitionDate": "2023-01-15",
        "ageInYears": 1.2,
        "status": "Active"
    }
]
```

### 7. CSV Export (Filtered)
**Endpoint:** `GET /api/analytics/export/csv`

**Query Parameters:**
- `department` (optional): Filter by department
- `assetType` (optional): Filter by asset type
- `ageRange` (optional): Filter by age range

**Response:** CSV file with filtered asset data

### 8. CSV Export (Full)
**Endpoint:** `GET /api/analytics/export/csv/full`

**Response:** CSV file with all asset data

## Database Schema Requirements

### Assets Table
```sql
CREATE TABLE assets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    asset_tag VARCHAR(50) UNIQUE NOT NULL,
    serial_number VARCHAR(100),
    asset_type_id INT,
    asset_model_id INT,
    assigned_user_id INT,
    os_id INT,
    status ENUM('Active', 'In Repair', 'Retired', 'Lost', 'Disposed') DEFAULT 'Active',
    acquisition_date DATE,
    warranty_expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_type_id) REFERENCES asset_types(id),
    FOREIGN KEY (asset_model_id) REFERENCES asset_models(id),
    FOREIGN KEY (assigned_user_id) REFERENCES users(id),
    FOREIGN KEY (os_id) REFERENCES os_versions(id)
);
```

### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(50),
    position VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Asset Types Table
```sql
CREATE TABLE asset_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### OS Versions Table
```sql
CREATE TABLE os_versions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Backend Implementation Suggestions

### 1. API Controller Structure (Node.js/Express)
```javascript
// analytics.controller.js
const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics.service');

router.get('/status-summary', async (req, res) => {
    try {
        const data = await analyticsService.getStatusSummary();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/os-summary', async (req, res) => {
    try {
        const data = await analyticsService.getOSSummary();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ... other endpoints
```

### 2. Service Layer Structure
```javascript
// analytics.service.js
const db = require('../config/database');

class AnalyticsService {
    async getStatusSummary() {
        const query = `
            SELECT 
                status,
                COUNT(*) as count,
                ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM assets)), 2) as percentage
            FROM assets 
            GROUP BY status
            ORDER BY count DESC
        `;
        return await db.query(query);
    }

    async getOSSummary() {
        const query = `
            SELECT 
                os.name as osType,
                COUNT(a.id) as count,
                ROUND((COUNT(a.id) * 100.0 / (SELECT COUNT(*) FROM assets WHERE os_id IS NOT NULL)), 2) as percentage
            FROM os_versions os
            LEFT JOIN assets a ON a.os_id = os.id
            WHERE a.id IS NOT NULL
            GROUP BY os.id, os.name
            ORDER BY count DESC
        `;
        return await db.query(query);
    }

    // ... other methods
}
```

### 3. Database Connection Setup
```javascript
// config/database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'asset_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = {
    query: async (sql, params) => {
        const [rows] = await pool.execute(sql, params);
        return rows;
    }
};
```

## Sample Data Population

### 1. Asset Types
```sql
INSERT INTO asset_types (name, description) VALUES
('Laptop', 'Portable computers'),
('Desktop', 'Desktop computers'),
('Monitor', 'Display monitors'),
('Printer', 'Printing devices'),
('Server', 'Server hardware'),
('Network Equipment', 'Routers, switches, etc.');
```

### 2. OS Versions
```sql
INSERT INTO os_versions (name, version) VALUES
('Windows 11', '22H2'),
('Windows 10', '22H2'),
('macOS Ventura', '13.0'),
('Ubuntu', '22.04 LTS'),
('CentOS', '8'),
('Red Hat Enterprise Linux', '9');
```

### 3. Sample Users
```sql
INSERT INTO users (first_name, last_name, email, department, position) VALUES
('John', 'Doe', 'john.doe@company.com', 'IT', 'System Administrator'),
('Jane', 'Smith', 'jane.smith@company.com', 'Finance', 'Financial Analyst'),
('Bob', 'Johnson', 'bob.johnson@company.com', 'HR', 'HR Manager'),
('Alice', 'Brown', 'alice.brown@company.com', 'Marketing', 'Marketing Specialist');
```

### 4. Sample Assets
```sql
INSERT INTO assets (asset_tag, serial_number, asset_type_id, assigned_user_id, os_id, status, acquisition_date, warranty_expiry_date) VALUES
('LAP-2023-001', 'SN123456789', 1, 1, 1, 'Active', '2023-01-15', '2026-01-15'),
('DES-2022-001', 'SN987654321', 2, 2, 2, 'Active', '2022-06-10', '2025-06-10'),
('MON-2021-001', 'SN456789123', 3, 3, NULL, 'Active', '2021-03-20', '2024-03-20');
```

## Testing the Integration

### 1. Backend API Testing
```bash
# Test status summary
curl -X GET http://localhost:3000/api/analytics/status-summary

# Test OS summary
curl -X GET http://localhost:3000/api/analytics/os-summary

# Test with filters
curl -X GET "http://localhost:3000/api/analytics/aging?department=IT&assetType=Laptop"
```

### 2. Frontend Integration Testing
1. Start your backend server
2. Ensure proxy configuration is correct in `proxy.conf.js`
3. Run `ng serve --proxy-config proxy.conf.js`
4. Navigate to `http://localhost:4200/dashboard`
5. Check browser console for any API errors

## Performance Considerations

### 1. Database Indexing
```sql
-- Add indexes for better query performance
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_acquisition_date ON assets(acquisition_date);
CREATE INDEX idx_assets_assigned_user ON assets(assigned_user_id);
CREATE INDEX idx_assets_asset_type ON assets(asset_type_id);
CREATE INDEX idx_users_department ON users(department);
```

### 2. Caching Strategy
- Implement Redis caching for frequently accessed analytics data
- Set appropriate cache expiration times (e.g., 5-15 minutes)
- Invalidate cache when asset data is modified

### 3. Query Optimization
- Use database views for complex queries
- Implement pagination for large datasets
- Consider materialized views for heavy analytical queries

## Error Handling

### 1. Backend Error Responses
```javascript
// Standard error response format
{
    "error": "Error message",
    "code": "ERROR_CODE",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Frontend Error Handling
The frontend already includes comprehensive error handling:
- Network errors are caught and displayed to users
- Loading states prevent multiple simultaneous requests
- Fallback to empty arrays when API calls fail

## Security Considerations

### 1. API Authentication
- Implement JWT token authentication
- Add role-based access control for analytics endpoints
- Rate limiting to prevent abuse

### 2. Data Validation
- Validate all query parameters
- Sanitize inputs to prevent SQL injection
- Implement proper CORS settings

## Deployment Checklist

- [ ] Database schema created with proper indexes
- [ ] Sample data populated for testing
- [ ] Backend API endpoints implemented and tested
- [ ] Error handling and logging configured
- [ ] Caching strategy implemented
- [ ] Security measures in place
- [ ] Frontend proxy configuration updated for production
- [ ] Performance monitoring setup

## Next Steps

1. **Implement Backend APIs**: Start with the status summary endpoint and gradually add others
2. **Test Each Endpoint**: Use tools like Postman or curl to verify API responses
3. **Update Proxy Configuration**: Ensure frontend can communicate with backend
4. **Monitor Performance**: Track query execution times and optimize as needed
5. **Add Real Data**: Replace sample data with actual asset information
6. **Implement Caching**: Add Redis or similar caching solution for better performance

The frontend dashboard is fully prepared to consume real data from these backend endpoints. Once implemented, the analytics will automatically display live data from your asset management database. 