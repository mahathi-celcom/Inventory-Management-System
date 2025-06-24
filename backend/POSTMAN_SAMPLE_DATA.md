# Postman Sample Data for Asset API Testing

## Base URL
```
http://localhost:8080/api/assets
```

## 1. Create Asset (POST /api/assets)

### Sample 1: Basic Laptop Asset
```json
{
  "assetTypeId": 1,
  "makeId": 1,
  "modelId": 1,
  "name": "Dell Latitude 5520 - John Doe",
  "serialNumber": "DL5520-2024-001",
  "itAssetCode": "IT-LAPTOP-001",
  "macAddress": "00:1B:44:11:3A:B7",
  "ipv4Address": "192.168.1.101",
  "status": "ACTIVE",
  "ownerType": "COMPANY",
  "acquisitionType": "PURCHASE",
  "currentUserId": 1,
  "inventoryLocation": "Floor 3, Desk 15A",
  "osId": 1,
  "osVersionId": 1,
  "poNumber": "PO-2024-001",
  "invoiceNumber": "INV-001-2024",
  "acquisitionDate": "2024-01-15",
  "warrantyExpiry": "2027-01-15",
  "extendedWarrantyExpiry": "2029-01-15",
  "leaseEndDate": null,
  "vendorId": 1,
  "extendedWarrantyVendorId": 2,
  "rentalAmount": null,
  "acquisitionPrice": 1250.00,
  "depreciationPct": 20.00,
  "currentPrice": 1000.00,
  "minContractPeriod": null,
  "tags": "laptop,development,remote-work"
}
```

### Sample 2: Desktop Computer
```json
{
  "assetTypeId": 2,
  "makeId": 2,
  "modelId": 2,
  "name": "HP ProDesk 600 G6 - Marketing Dept",
  "serialNumber": "HP600G6-2024-002",
  "itAssetCode": "IT-DESKTOP-002",
  "macAddress": "00:1A:2B:3C:4D:5E",
  "ipv4Address": "192.168.1.102",
  "status": "ACTIVE",
  "ownerType": "COMPANY",
  "acquisitionType": "PURCHASE",
  "currentUserId": 2,
  "inventoryLocation": "Floor 2, Marketing Wing",
  "osId": 1,
  "osVersionId": 2,
  "poNumber": "PO-2024-002",
  "invoiceNumber": "INV-002-2024",
  "acquisitionDate": "2024-02-01",
  "warrantyExpiry": "2027-02-01",
  "extendedWarrantyExpiry": null,
  "leaseEndDate": null,
  "vendorId": 1,
  "extendedWarrantyVendorId": null,
  "rentalAmount": null,
  "acquisitionPrice": 850.00,
  "depreciationPct": 25.00,
  "currentPrice": 637.50,
  "minContractPeriod": null,
  "tags": "desktop,marketing,office"
}
```

### Sample 3: Server Equipment
```json
{
  "assetTypeId": 3,
  "makeId": 3,
  "modelId": 3,
  "name": "Dell PowerEdge R740 - Production Server",
  "serialNumber": "PE-R740-2024-003",
  "itAssetCode": "IT-SERVER-003",
  "macAddress": "00:14:22:01:23:45",
  "ipv4Address": "10.0.1.50",
  "status": "ACTIVE",
  "ownerType": "COMPANY",
  "acquisitionType": "PURCHASE",
  "currentUserId": null,
  "inventoryLocation": "Data Center Rack A1",
  "osId": 2,
  "osVersionId": 3,
  "poNumber": "PO-2024-003",
  "invoiceNumber": "INV-003-2024",
  "acquisitionDate": "2024-01-10",
  "warrantyExpiry": "2027-01-10",
  "extendedWarrantyExpiry": "2030-01-10",
  "leaseEndDate": null,
  "vendorId": 1,
  "extendedWarrantyVendorId": 2,
  "rentalAmount": null,
  "acquisitionPrice": 5500.00,
  "depreciationPct": 15.00,
  "currentPrice": 4675.00,
  "minContractPeriod": null,
  "tags": "server,production,critical,24x7"
}
```

### Sample 4: Leased Equipment
```json
{
  "assetTypeId": 1,
  "makeId": 4,
  "modelId": 4,
  "name": "MacBook Pro 16 - Design Team",
  "serialNumber": "MBP16-2024-004",
  "itAssetCode": "IT-LAPTOP-004",
  "macAddress": "A4:83:E7:12:34:56",
  "ipv4Address": "192.168.1.104",
  "status": "ACTIVE",
  "ownerType": "LEASED",
  "acquisitionType": "LEASE",
  "currentUserId": 3,
  "inventoryLocation": "Floor 4, Design Studio",
  "osId": 3,
  "osVersionId": 4,
  "poNumber": "PO-LEASE-2024-001",
  "invoiceNumber": "LEASE-001-2024",
  "acquisitionDate": "2024-03-01",
  "warrantyExpiry": "2027-03-01",
  "extendedWarrantyExpiry": null,
  "leaseEndDate": "2027-02-28",
  "vendorId": 3,
  "extendedWarrantyVendorId": null,
  "rentalAmount": 150.00,
  "acquisitionPrice": null,
  "depreciationPct": null,
  "currentPrice": null,
  "minContractPeriod": 36,
  "tags": "laptop,design,creative,leased"
}
```

### Sample 5: Network Equipment
```json
{
  "assetTypeId": 4,
  "makeId": 5,
  "modelId": 5,
  "name": "Cisco Catalyst 2960-X Switch",
  "serialNumber": "CSC2960X-2024-005",
  "itAssetCode": "IT-SWITCH-005",
  "macAddress": "00:1E:BD:12:34:56",
  "ipv4Address": "192.168.1.250",
  "status": "ACTIVE",
  "ownerType": "COMPANY",
  "acquisitionType": "PURCHASE",
  "currentUserId": null,
  "inventoryLocation": "Network Closet Floor 1",
  "osId": null,
  "osVersionId": null,
  "poNumber": "PO-2024-005",
  "invoiceNumber": "INV-005-2024",
  "acquisitionDate": "2024-01-20",
  "warrantyExpiry": "2026-01-20",
  "extendedWarrantyExpiry": "2028-01-20",
  "leaseEndDate": null,
  "vendorId": 4,
  "extendedWarrantyVendorId": 4,
  "rentalAmount": null,
  "acquisitionPrice": 1200.00,
  "depreciationPct": 20.00,
  "currentPrice": 960.00,
  "minContractPeriod": null,
  "tags": "network,switch,infrastructure"
}
```

## 2. Update Asset (PUT /api/assets/{assetId})

### Sample Update - Change User Assignment
```json
{
  "assetId": 1,
  "assetTypeId": 1,
  "makeId": 1,
  "modelId": 1,
  "name": "Dell Latitude 5520 - Jane Smith",
  "serialNumber": "DL5520-2024-001",
  "itAssetCode": "IT-LAPTOP-001",
  "macAddress": "00:1B:44:11:3A:B7",
  "ipv4Address": "192.168.1.101",
  "status": "ACTIVE",
  "ownerType": "COMPANY",
  "acquisitionType": "PURCHASE",
  "currentUserId": 2,
  "inventoryLocation": "Floor 2, Desk 10B",
  "osId": 1,
  "osVersionId": 1,
  "poNumber": "PO-2024-001",
  "invoiceNumber": "INV-001-2024",
  "acquisitionDate": "2024-01-15",
  "warrantyExpiry": "2027-01-15",
  "extendedWarrantyExpiry": "2029-01-15",
  "leaseEndDate": null,
  "vendorId": 1,
  "extendedWarrantyVendorId": 2,
  "rentalAmount": null,
  "acquisitionPrice": 1250.00,
  "depreciationPct": 20.00,
  "currentPrice": 950.00,
  "minContractPeriod": null,
  "tags": "laptop,development,remote-work,reassigned"
}
```

## 3. API Endpoint Testing Examples

### GET /api/assets
**Purpose:** Get all active assets
**Method:** GET
**URL:** `{{baseUrl}}/api/assets?page=0&size=10&sort=assetId,desc`

### GET /api/assets/{assetId}
**Purpose:** Get specific asset
**Method:** GET
**URL:** `{{baseUrl}}/api/assets/1`

### GET /api/assets/search
**Purpose:** Search assets
**Method:** GET
**URL:** `{{baseUrl}}/api/assets/search?search=laptop&page=0&size=10`

### GET /api/assets/status/{status}
**Purpose:** Get assets by status
**Method:** GET
**URL:** `{{baseUrl}}/api/assets/status/ACTIVE?page=0&size=10`

### GET /api/assets/user/{userId}
**Purpose:** Get assets assigned to user
**Method:** GET
**URL:** `{{baseUrl}}/api/assets/user/1?page=0&size=10`

### GET /api/assets/warranty/expiring
**Purpose:** Get assets with warranty expiring soon
**Method:** GET
**URL:** `{{baseUrl}}/api/assets/warranty/expiring?startDate=2024-12-01&endDate=2025-06-30&page=0&size=10`

### GET /api/assets/extended-warranty/expiring
**Purpose:** Get assets with extended warranty expiring
**Method:** GET
**URL:** `{{baseUrl}}/api/assets/extended-warranty/expiring?startDate=2024-12-01&endDate=2025-12-31&page=0&size=10`

### GET /api/assets/warranty/expired
**Purpose:** Get assets with expired warranty
**Method:** GET
**URL:** `{{baseUrl}}/api/assets/warranty/expired?page=0&size=10`

### GET /api/assets/deleted
**Purpose:** Get soft deleted assets
**Method:** GET
**URL:** `{{baseUrl}}/api/assets/deleted?page=0&size=10`

### DELETE /api/assets/{assetId}
**Purpose:** Soft delete an asset
**Method:** DELETE
**URL:** `{{baseUrl}}/api/assets/1`

### POST /api/assets/{assetId}/restore
**Purpose:** Restore a soft deleted asset
**Method:** POST
**URL:** `{{baseUrl}}/api/assets/1/restore`

### DELETE /api/assets/{assetId}/permanent
**Purpose:** Permanently delete an asset
**Method:** DELETE
**URL:** `{{baseUrl}}/api/assets/1/permanent`

## 4. Environment Variables for Postman

Create these environment variables in Postman:

```json
{
  "baseUrl": "http://localhost:8080/api/assets",
  "assetId": "1",
  "userId": "1",
  "vendorId": "1"
}
```

## 5. Test Data for Master Tables

You'll need these master data records in your database first:

### Asset Types
```sql
INSERT INTO asset_type (id, name, description) VALUES 
(1, 'Laptop', 'Portable computers'),
(2, 'Desktop', 'Desktop computers'),
(3, 'Server', 'Server equipment'),
(4, 'Network', 'Network equipment'),
(5, 'Mobile', 'Mobile devices');
```

### Asset Makes
```sql
INSERT INTO asset_make (id, name) VALUES 
(1, 'Dell'),
(2, 'HP'),
(3, 'Lenovo'),
(4, 'Apple'),
(5, 'Cisco');
```

### Asset Models
```sql
INSERT INTO asset_model (id, name, make_id) VALUES 
(1, 'Latitude 5520', 1),
(2, 'ProDesk 600 G6', 2),
(3, 'PowerEdge R740', 1),
(4, 'MacBook Pro 16', 4),
(5, 'Catalyst 2960-X', 5);
```

### Users
```sql
INSERT INTO user_table (id, username, email, first_name, last_name) VALUES 
(1, 'john.doe', 'john.doe@company.com', 'John', 'Doe'),
(2, 'jane.smith', 'jane.smith@company.com', 'Jane', 'Smith'),
(3, 'bob.wilson', 'bob.wilson@company.com', 'Bob', 'Wilson');
```

### Vendors
```sql
INSERT INTO vendor (id, name, contact_email, contact_phone) VALUES 
(1, 'Dell Technologies', 'support@dell.com', '+1-800-DELL'),
(2, 'Extended Warranty Corp', 'service@extwarranty.com', '+1-800-EXT'),
(3, 'Apple Inc', 'business@apple.com', '+1-800-APPLE'),
(4, 'Cisco Systems', 'support@cisco.com', '+1-800-CISCO');
```

### Operating Systems
```sql
INSERT INTO os (id, name, version) VALUES 
(1, 'Windows', '11'),
(2, 'Linux', 'Ubuntu'),
(3, 'macOS', 'Sonoma');
```

### OS Versions
```sql
INSERT INTO os_version (id, version_name, os_id) VALUES 
(1, 'Windows 11 Pro', 1),
(2, 'Windows 11 Enterprise', 1),
(3, 'Ubuntu 22.04 LTS', 2),
(4, 'macOS Sonoma 14.0', 3);
```

## 6. Common Test Scenarios

### Scenario 1: Asset Lifecycle Test
1. **Create Asset** - POST with Sample 1 data
2. **Get Asset** - GET /api/assets/{assetId}
3. **Update Asset** - PUT with modified data
4. **Soft Delete** - DELETE /api/assets/{assetId}
5. **Verify Hidden** - GET /api/assets (shouldn't appear)
6. **Restore Asset** - POST /api/assets/{assetId}/restore
7. **Permanent Delete** - DELETE /api/assets/{assetId}/permanent

### Scenario 2: Warranty Management Test
1. **Create Asset with Warranties** - POST with Sample 3 data
2. **Query Warranty Expiring** - GET /api/assets/warranty/expiring
3. **Query Extended Warranty** - GET /api/assets/extended-warranty/expiring
4. **Query Expired Warranties** - GET /api/assets/warranty/expired

### Scenario 3: Search and Filter Test
1. **Search by Name** - GET /api/assets/search?search=Dell
2. **Filter by Status** - GET /api/assets/status/ACTIVE
3. **Filter by User** - GET /api/assets/user/1
4. **Filter by Location** - GET /api/assets/location/Floor%203

## 7. Error Testing

### Test Invalid Asset ID
**URL:** `{{baseUrl}}/api/assets/99999`
**Expected:** 404 Not Found

### Test Updating Deleted Asset
1. Soft delete an asset
2. Try to update it
**Expected:** 400 Bad Request with error message

### Test Duplicate Serial Number
1. Create an asset
2. Try to create another with same serial number
**Expected:** 400 Bad Request

## 8. Headers for All Requests
```
Content-Type: application/json
Accept: application/json
```

This comprehensive sample data covers all the major scenarios for testing your Asset API endpoints in Postman! 