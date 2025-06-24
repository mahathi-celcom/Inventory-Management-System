# Troubleshooting Asset API 500 Error

## Common Causes and Solutions

### 1. **Check Server Logs First**
Look at your Spring Boot console/logs for the actual error. The 500 error is generic, but the logs will show the real issue.

**Common error patterns to look for:**
- `ConstraintViolationException` - Missing required fields
- `DataIntegrityViolationException` - Foreign key constraint violations
- `EntityNotFoundException` - Referenced entities don't exist
- `ValidationException` - Data validation failures

### 2. **Most Likely Issue: Missing Master Data**

The sample data references foreign keys that probably don't exist in your database. Let's start with minimal data.

## Quick Fix: Minimal Test Data

### Step 1: Create Master Data First

Before testing assets, insert this basic master data:

```sql
-- Asset Types
INSERT INTO asset_type (id, name, description) VALUES (1, 'Laptop', 'Portable computers');

-- Asset Makes  
INSERT INTO asset_make (id, name) VALUES (1, 'Dell');

-- Asset Models
INSERT INTO asset_model (id, name, make_id) VALUES (1, 'Latitude 5520', 1);

-- Users
INSERT INTO user_table (id, username, email, first_name, last_name) VALUES 
(1, 'john.doe', 'john.doe@company.com', 'John', 'Doe');

-- Vendors
INSERT INTO vendor (id, name, contact_email, contact_phone) VALUES 
(1, 'Dell Technologies', 'support@dell.com', '+1-800-DELL');
```

### Step 2: Test with Minimal Asset Data

Use this simplified JSON for your first test:

```json
{
  "assetTypeId": 1,
  "makeId": 1,
  "modelId": 1,
  "name": "Test Laptop",
  "serialNumber": "TEST-001",
  "status": "ACTIVE",
  "ownerType": "COMPANY",
  "acquisitionType": "PURCHASE"
}
```

## Step-by-Step Debugging

### Step 1: Check Database Connection
Test a simple endpoint first (if you have any basic GET endpoints working).

### Step 2: Verify Table Structure
Make sure all your database migrations have run:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'your_database_name';

-- Check asset table structure
DESCRIBE asset;
```

### Step 3: Test with Postman - Basic Request

**URL:** `POST http://localhost:8080/api/assets`

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Body (start with this minimal data):**
```json
{
  "assetTypeId": 1,
  "makeId": 1,
  "modelId": 1,
  "name": "Test Asset",
  "serialNumber": "TEST-001",
  "status": "ACTIVE",
  "ownerType": "COMPANY",
  "acquisitionType": "PURCHASE"
}
```

### Step 4: If Still Getting 500 Error

1. **Check Spring Boot logs** - This is crucial!
2. **Verify application.properties** database settings
3. **Test database connectivity**

## Common Spring Boot Application Issues

### Issue 1: Database Migration Problems
```bash
# Check if migrations ran
SELECT * FROM flyway_schema_history;
```

### Issue 2: Missing Required Configuration
Check your `application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/inventory_db
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
```

### Issue 3: Entity Validation Issues
The Asset entity might have validation constraints that aren't being met.

## Debug Steps by Error Type

### If you see: `ConstraintViolationException`
- Check all `@NotNull` and `@NotBlank` fields in Asset entity
- Ensure required fields are provided in JSON

### If you see: `DataIntegrityViolationException`
- Foreign key IDs don't exist (assetTypeId, makeId, etc.)
- Unique constraint violations (serialNumber, itAssetCode)

### If you see: `EntityNotFoundException`
- The referenced entities (AssetType, AssetMake, etc.) don't exist in database

## Test with Curl (Alternative to Postman)

```bash
curl -X POST http://localhost:8080/api/assets \
  -H "Content-Type: application/json" \
  -d '{
    "assetTypeId": 1,
    "makeId": 1,
    "modelId": 1,
    "name": "Test Asset",
    "serialNumber": "TEST-001",
    "status": "ACTIVE",
    "ownerType": "COMPANY",
    "acquisitionType": "PURCHASE"
  }'
```

## Simplified Test Without Foreign Keys

If foreign key issues persist, temporarily test with a modified Asset entity that doesn't require foreign keys:

```json
{
  "name": "Test Asset",
  "serialNumber": "TEST-001",
  "status": "ACTIVE",
  "ownerType": "COMPANY",
  "acquisitionType": "PURCHASE",
  "inventoryLocation": "Test Location",
  "acquisitionDate": "2024-01-01",
  "acquisitionPrice": 1000.00
}
```

## Check Application Startup

Make sure your Spring Boot application started without errors:
```
Started InventoryManagementSystemApplication in X.XXX seconds
```

If you see any errors during startup, fix those first.

## Next Steps

1. **Share the actual server logs** - The specific error will help pinpoint the issue
2. **Verify master data exists** - Run the SQL inserts above
3. **Test with minimal data** - Use the simplified JSON
4. **Check database connectivity** - Ensure your app can connect to the database

Once you share the specific error from the logs, I can provide a more targeted solution! 