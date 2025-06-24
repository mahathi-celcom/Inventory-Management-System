# Asset Assignment Management - Test Guide

## Quick Testing Checklist

### 🧪 **Backend API Testing**

#### 1. Dashboard Endpoints
```bash
# Test asset dashboard
curl "http://localhost:8080/api/asset-assignment/dashboard?page=0&size=5"

# Test dashboard search
curl "http://localhost:8080/api/asset-assignment/dashboard/search?searchTerm=laptop&page=0&size=5"
```

#### 2. User Assignment
```bash
# Assign user to asset
curl -X POST "http://localhost:8080/api/asset-assignment/assign-user" \
  -H "Content-Type: application/json" \
  -d '{"assetId": 1, "userId": 1, "remarks": "Test assignment"}'

# Unassign user from asset
curl -X DELETE "http://localhost:8080/api/asset-assignment/unassign-user/1"
```

#### 3. Tag Assignment
```bash
# Assign tag to asset
curl -X POST "http://localhost:8080/api/asset-assignment/assign-tag" \
  -H "Content-Type: application/json" \
  -d '{"assetId": 1, "tagId": 1}'

# Unassign tag from asset
curl -X DELETE "http://localhost:8080/api/asset-assignment/unassign-tag/1"
```

### 📋 **Database Verification**

#### Check Assignment History
```sql
-- Verify assignment history is created
SELECT * FROM asset_assignment_history 
WHERE asset_id = 1 
ORDER BY assigned_date DESC;

-- Check current assignments
SELECT * FROM asset_assignment_history 
WHERE unassigned_date IS NULL;
```

#### Check Tag Assignments
```sql
-- Verify tag assignments
SELECT a.asset_id, a.name, at.tag_name 
FROM asset a 
LEFT JOIN asset_tag at ON a.current_tag_id = at.tag_id 
WHERE a.asset_id = 1;

-- Check tag assignment table
SELECT * FROM asset_tag_assignment WHERE asset_id = 1;
```

### ✅ **Expected Results**

#### Dashboard Response
```json
{
  "content": [
    {
      "assetId": 1,
      "name": "Test Asset",
      "status": "Active",
      "currentUserId": 1,
      "currentUserName": "Test User",
      "currentTagId": 1,
      "currentTagName": "Test Tag"
    }
  ],
  "totalElements": 1,
  "totalPages": 1
}
```

#### Assignment Success Response
```json
{
  "success": true,
  "message": "Asset successfully assigned to Test User",
  "assetId": 1,
  "assignedId": 1,
  "assignedType": "USER"
}
```

### 🚀 **Quick Start Commands**

```bash
# 1. Start the application
mvn spring-boot:run

# 2. Test dashboard (in another terminal)
curl "http://localhost:8080/api/asset-assignment/dashboard"

# 3. Test assignment (replace IDs with actual values)
curl -X POST "http://localhost:8080/api/asset-assignment/assign-user" \
  -H "Content-Type: application/json" \
  -d '{"assetId": [ASSET_ID], "userId": [USER_ID]}'
```

### 📊 **Success Criteria**

- ✅ Dashboard returns paginated asset list with assignment details
- ✅ User assignment creates history record and updates asset
- ✅ Tag assignment creates assignment record and updates asset
- ✅ Unassignment operations work correctly
- ✅ Search functionality filters assets properly
- ✅ All operations are transactional and validated
- ✅ Error handling provides meaningful messages

---

**Implementation Status**: ✅ **COMPLETE**
- All service methods implemented
- REST endpoints created and tested
- Database schema updated
- Comprehensive error handling
- Transaction safety ensured 