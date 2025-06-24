# Vendor Status Filtering API Documentation

## Overview
The vendor API has been enhanced to support flexible status filtering with optional query parameters. This allows for single status, multi-status, and "ALL" status filtering in a clean and intuitive way.

## Enhanced Endpoints

### 1. Get All Vendors with Status Filtering
```
GET /api/vendors?status={statusParam}
```

**Supported Status Parameters:**

#### Single Status Filtering
```bash
# Get only active vendors
GET /api/vendors?status=Active

# Get only inactive vendors  
GET /api/vendors?status=Inactive

# Get only vendors marked as not for buying
GET /api/vendors?status=NotForBuying
```

#### Multi-Status Filtering
```bash
# Get vendors with multiple statuses (comma-separated)
GET /api/vendors?status=Active,Inactive

# Get active and not-for-buying vendors
GET /api/vendors?status=Active,NotForBuying

# Get all except active vendors
GET /api/vendors?status=Inactive,NotForBuying
```

#### All Vendors
```bash
# Get all vendors regardless of status
GET /api/vendors?status=ALL

# Get all vendors (default behavior - no status param)
GET /api/vendors
```

### 2. Search Vendors with Status Filtering
```
GET /api/vendors/search?searchTerm={term}&status={statusParam}
```

**Examples:**
```bash
# Search for vendors containing "tech" with active status
GET /api/vendors/search?searchTerm=tech&status=Active

# Search for vendors containing "corp" with multiple statuses
GET /api/vendors/search?searchTerm=corp&status=Active,Inactive

# Search for vendors containing "solutions" in all statuses
GET /api/vendors/search?searchTerm=solutions&status=ALL
```

## Valid Status Values
- `Active` - Vendor is active and available for operations
- `Inactive` - Vendor is inactive but still in the system
- `NotForBuying` - Vendor is not available for purchasing operations

## Request Parameters

### Common Parameters (Both Endpoints)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | int | No | 0 | Page number (0-based) |
| `size` | int | No | 10 | Number of records per page |
| `sortBy` | string | No | "name" | Field to sort by |
| `sortDir` | string | No | "ASC" | Sort direction (ASC/DESC) |
| `status` | string | No | null | Status filter parameter |

### Search-Specific Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `searchTerm` | string | Yes | - | Term to search in vendor name and contact info |

## Response Format

### Success Response
```json
{
  "content": [
    {
      "id": 1,
      "name": "Tech Solutions Inc",
      "contactInfo": "contact@techsolutions.com",
      "status": "Active"
    },
    {
      "id": 2,
      "name": "Hardware Corp",
      "contactInfo": "info@hardwarecorp.com", 
      "status": "Inactive"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 25,
  "totalPages": 3,
  "last": false,
  "first": true
}
```

### Error Response
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid status: INVALID_STATUS. Valid statuses are: Active, Inactive, NotForBuying",
  "path": "/api/vendors"
}
```

## Implementation Details

### Status Parameter Parsing
- **Single Status**: `status=Active` → Filters by single status
- **Multi-Status**: `status=Active,Inactive` → Filters by any of the specified statuses
- **All Statuses**: `status=ALL` → Returns all vendors regardless of status
- **Empty/Null**: `status=` or no parameter → Returns all vendors (default behavior)

### Validation
- All status values are validated against the allowed values: `Active`, `Inactive`, `NotForBuying`
- Invalid status values result in a 400 Bad Request error with descriptive message
- Status matching is case-insensitive
- Whitespace is automatically trimmed from status values

### Database Queries
- **Single Status**: Uses existing `findByStatus()` repository method
- **Multi-Status**: Uses new `findByStatusIn()` repository method with IN clause
- **Search + Single Status**: Uses existing search methods
- **Search + Multi-Status**: Uses new `findByStatusInAndNameOrContactInfoContaining()` method

## Usage Examples

### Frontend Integration
```javascript
// Get active vendors
const activeVendors = await fetch('/api/vendors?status=Active');

// Get vendors for dropdown (active and not-for-buying)  
const availableVendors = await fetch('/api/vendors?status=Active,NotForBuying');

// Search with status filter
const searchResults = await fetch('/api/vendors/search?searchTerm=tech&status=Active');

// Get all vendors for admin view
const allVendors = await fetch('/api/vendors?status=ALL');
```

### Backend Service Usage
```java
// Single status
PageResponse<VendorDTO> activeVendors = vendorService.getVendorsByStatuses("Active", pageable);

// Multiple statuses  
PageResponse<VendorDTO> purchaseableVendors = vendorService.getVendorsByStatuses("Active,NotForBuying", pageable);

// All vendors
PageResponse<VendorDTO> allVendors = vendorService.getVendorsByStatuses("ALL", pageable);

// Search with status filter
PageResponse<VendorDTO> searchResults = vendorService.searchVendorsByStatuses("tech", "Active,Inactive", pageable);
```

## Migration Notes

### Backward Compatibility
- All existing API calls continue to work without modification
- The original `/api/vendors/active` endpoint is maintained for backward compatibility
- Existing single-status filtering behavior is preserved

### Performance Considerations
- Single status queries use existing optimized database indexes
- Multi-status queries use IN clauses which are well-optimized in modern databases
- Consider adding composite indexes for frequently used status combinations if needed

### Testing
- All status combinations should be tested
- Edge cases like empty strings, whitespace, and invalid statuses are handled
- Pagination works correctly with all filtering options 