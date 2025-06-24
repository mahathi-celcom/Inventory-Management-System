# Quick Asset API Test - Minimal Data

## 🚨 **Start Here for 500 Error Fix**

### **Step 1: Check Your Server Logs**
Before anything else, look at your Spring Boot console output. You'll see something like:
```
Caused by: org.springframework.dao.DataIntegrityViolationException: 
could not execute statement; SQL [n/a]; constraint [fk_asset_type_id]; 
nested exception is org.hibernate.exception.ConstraintViolationException
```

### **Step 2: Insert Basic Master Data**
Run these SQL commands in your database first:

```sql
-- Insert basic master data
INSERT INTO asset_type (id, name, description) VALUES (1, 'Computer', 'Computing equipment');
INSERT INTO asset_make (id, name) VALUES (1, 'Generic');
INSERT INTO asset_model (id, name, make_id) VALUES (1, 'Standard Model', 1);
```

### **Step 3: Test with This Minimal JSON**

**Postman Setup:**
- **Method:** POST
- **URL:** `http://localhost:8080/api/assets`
- **Headers:** 
  - `Content-Type: application/json`
  - `Accept: application/json`

**Body (Raw JSON):**
```json
{
  "assetTypeId": 1,
  "makeId": 1,
  "modelId": 1,
  "name": "Test Computer",
  "serialNumber": "TEST-12345",
  "status": "ACTIVE",
  "ownerType": "COMPANY",
  "acquisitionType": "PURCHASE"
}
```

## 🔍 **If Still Getting 500 Error**

### **Check These Common Issues:**

1. **Database not running?**
   ```bash
   # Check if PostgreSQL is running
   sudo service postgresql status
   ```

2. **Wrong database name/credentials?**
   Check your `application.properties`:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/your_db_name
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

3. **Tables not created?**
   ```sql
   -- Check if asset table exists
   SELECT * FROM information_schema.tables WHERE table_name = 'asset';
   ```

### **Even Simpler Test (No Foreign Keys)**

If the above still fails, try this ultra-minimal test:

```json
{
  "name": "Simple Test",
  "serialNumber": "SIMPLE-001",
  "status": "ACTIVE",
  "ownerType": "COMPANY",
  "acquisitionType": "PURCHASE",
  "inventoryLocation": "Test Location"
}
```

## 📋 **Copy-Paste Ready Commands**

### **1. Database Setup (PostgreSQL)**
```sql
-- Run this in your database
INSERT INTO asset_type (id, name, description) VALUES (1, 'Computer', 'Computing equipment') ON CONFLICT (id) DO NOTHING;
INSERT INTO asset_make (id, name) VALUES (1, 'Generic') ON CONFLICT (id) DO NOTHING;
INSERT INTO asset_model (id, name, make_id) VALUES (1, 'Standard Model', 1) ON CONFLICT (id) DO NOTHING;
```

### **2. Postman Test**
- URL: `http://localhost:8080/api/assets`
- Method: POST
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "assetTypeId": 1,
  "makeId": 1,
  "modelId": 1,
  "name": "My First Asset",
  "serialNumber": "FIRST-001",
  "status": "ACTIVE",
  "ownerType": "COMPANY",
  "acquisitionType": "PURCHASE"
}
```

### **3. Expected Success Response**
```json
{
  "assetId": 1,
  "assetTypeId": 1,
  "makeId": 1,
  "modelId": 1,
  "name": "My First Asset",
  "serialNumber": "FIRST-001",
  "status": "ACTIVE",
  "ownerType": "COMPANY",
  "acquisitionType": "PURCHASE",
  "deleted": false,
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-01T10:00:00"
}
```

## 🆘 **Still Not Working?**

**Please share:**
1. **Exact error from Spring Boot logs** (not just the 500 response)
2. **Your database type** (PostgreSQL, MySQL, etc.)
3. **Output of:** `SELECT table_name FROM information_schema.tables;`

The most common cause is missing foreign key references in the database! 