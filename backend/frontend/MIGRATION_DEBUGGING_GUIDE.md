# 🔧 PO Migration Debugging Guide

## 🚨 Current Issue Analysis

### **Error Description:**
```
Key (po_number)=(PO-2025-011) is not present in table "asset_po".
ERROR: insert or update on table "asset" violates foreign key constraint "asset_po_number_fk"
```

### **Root Cause:**
The backend is trying to update assets with the **NEW** PO number before creating the **NEW** asset_po record, causing a foreign key constraint violation.

## 🔍 Backend Migration Logic Issues

### **Current (Incorrect) Backend Flow:**
```
1. ❌ Try to update assets.po_number = 'PO-2025-011' (NEW)
2. ❌ Foreign key constraint fails because 'PO-2025-011' doesn't exist in asset_po table
3. ❌ Migration fails
```

### **Correct Backend Flow Should Be:**
```
1. ✅ Find assets with po_number = 'PO-2025-001' (OLD)  
2. ✅ Create new asset_po record with po_number = 'PO-2025-011' (NEW)
3. ✅ Update assets SET po_number = 'PO-2025-011' WHERE po_number = 'PO-2025-001'
4. ✅ Optional: Remove old asset_po record if no longer needed
```

## 📦 Frontend Payload (Already Correct)

The frontend is sending the correct payload:

```json
{
  "oldPoNumber": "PO-2025-001", 
  "newPoNumber": "PO-2025-011",
  "migrationType": "FULL_MIGRATION",
  "updateAssetsFirst": true
}
```

## 🛠️ Backend Fix Required

### **The backend needs to implement this logic:**

```java
@Transactional
public AssetPoMigrationResponse migratePoNumber(MigrationRequest request) {
    String oldPo = request.getOldPoNumber();
    String newPo = request.getNewPoNumber();
    
    // Step 1: Validate old PO exists
    AssetPo oldAssetPo = assetPoRepository.findByPoNumber(oldPo)
        .orElseThrow(() -> new EntityNotFoundException("Old PO not found: " + oldPo));
    
    // Step 2: Validate new PO doesn't exist
    if (assetPoRepository.findByPoNumber(newPo).isPresent()) {
        throw new ConflictException("New PO already exists: " + newPo);
    }
    
    // Step 3: Create new AssetPO record (copy from old one)
    AssetPo newAssetPo = createNewAssetPo(oldAssetPo, newPo);
    assetPoRepository.save(newAssetPo);
    
    // Step 4: Update all assets to reference new PO
    int assetsUpdated = assetRepository.updateAssetsPoNumber(oldPo, newPo);
    
    // Step 5: Optional - Remove old AssetPO if no other references
    // assetPoRepository.delete(oldAssetPo);
    
    return new AssetPoMigrationResponse(oldPo, newPo, newAssetPo, assetsUpdated, "SUCCESS");
}
```

### **Required Repository Method:**
```java
@Modifying
@Query("UPDATE Asset a SET a.poNumber = :newPo WHERE a.poNumber = :oldPo")
int updateAssetsPoNumber(@Param("oldPo") String oldPo, @Param("newPo") String newPo);
```

## 🧪 Frontend Testing Steps

### **1. Test with Valid Old PO:**
```
Old PO: PO-2025-001 (must exist)
New PO: PO-2025-011 (must not exist)
```

### **2. Check Browser Console:**
```
🔍 Validating PO exists: PO-2025-001
✅ PO PO-2025-001 exists
🔍 Validating PO exists: PO-2025-011  
❌ PO PO-2025-011 not found
🔄 Migrating PO number: PO-2025-001 → PO-2025-011
📦 Migration payload: { oldPoNumber: "PO-2025-001", newPoNumber: "PO-2025-011", ... }
```

### **3. Network Tab Verification:**
```
POST /api/asset-pos/migrate-po-number
Request Body:
{
  "oldPoNumber": "PO-2025-001",
  "newPoNumber": "PO-2025-011", 
  "migrationType": "FULL_MIGRATION",
  "updateAssetsFirst": true
}
```

## 🔧 Quick Backend Debug Commands

### **Check if PO exists:**
```sql
SELECT * FROM asset_po WHERE po_number = 'PO-2025-001';
```

### **Check assets referencing the PO:**
```sql
SELECT COUNT(*) FROM asset WHERE po_number = 'PO-2025-001';
```

### **Check foreign key constraint:**
```sql
SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name 
FROM information_schema.key_column_usage 
WHERE constraint_name = 'asset_po_number_fk';
```

## 📋 Frontend Enhancements Made

### **1. Enhanced Validation:**
- ✅ Pre-migration validation to check old PO exists
- ✅ Check that new PO doesn't already exist
- ✅ Clear error messages for validation failures

### **2. Better Error Handling:**
- ✅ Specific error messages for foreign key issues
- ✅ Detailed debugging information in console
- ✅ User-friendly error dialogs

### **3. Improved UX:**
- ✅ Detailed confirmation dialog explaining steps
- ✅ Success message with migration details
- ✅ Migration history tracking

## 🎯 Expected Results After Backend Fix

### **Successful Migration:**
```
✅ Migration Completed Successfully!

• Old PO: PO-2025-001
• New PO: PO-2025-011  
• Assets Updated: 25

All asset records have been safely migrated to the new PO number.
```

The frontend is now ready and will provide much better error reporting to help debug the backend issue! 