# Backend Cascade Update Implementation Guide

## Problem Statement
The current `/api/asset-pos/{id}/cascade` endpoint fails with **409 Conflict: "Cannot delete record as it is referenced by other entities"** because it tries to delete the AssetPO record while assets are still referencing it.

## Root Cause
The backend is attempting to DELETE and recreate the AssetPO record, which violates foreign key constraints when assets reference the PO.

## Required Solution: Two-Phase Safe Update

### Phase 1: Update Asset References
```java
@Modifying
@Query("UPDATE Asset a SET a.poNumber = :newPoNumber WHERE a.poNumber = :oldPoNumber")
int updateAssetPoReferences(@Param("oldPoNumber") String oldPoNumber, 
                           @Param("newPoNumber") String newPoNumber);
```

### Phase 2: Update AssetPO Primary Key
```java
@Modifying
@Query(value = "UPDATE asset_po SET po_number = :newPoNumber WHERE po_number = :oldPoNumber", 
       nativeQuery = true)
int updateAssetPoPrimaryKey(@Param("oldPoNumber") String oldPoNumber, 
                           @Param("newPoNumber") String newPoNumber);
```

## Complete Implementation

### 1. Controller Method
```java
@PutMapping("/api/asset-pos/{id}/cascade")
@Transactional
public ResponseEntity<AssetPoCascadeUpdateResponse> updateAssetPoWithCascade(
    @PathVariable Long id, 
    @RequestBody AssetPoUpdateRequest request) {
    
    try {
        AssetPoCascadeUpdateResponse response = assetPoService.updateAssetPoWithCascade(id, request);
        return ResponseEntity.ok(response);
        
    } catch (DataIntegrityViolationException e) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, 
            "Cannot update PO: " + e.getMessage());
            
    } catch (EntityNotFoundException e) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, 
            "AssetPO not found with id: " + id);
    }
}
```

### 2. Service Implementation
```java
@Transactional
public AssetPoCascadeUpdateResponse updateAssetPoWithCascade(Long id, AssetPoUpdateRequest request) {
    
    // Get current PO
    AssetPo currentPo = assetPoRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("AssetPO not found: " + id));
    
    String oldPoNumber = currentPo.getPoNumber();
    String newPoNumber = request.getPoNumber();
    
    int linkedAssetsUpdated = 0;
    
    // Phase 1: Update asset references if PO number changed
    if (!oldPoNumber.equals(newPoNumber)) {
        linkedAssetsUpdated = assetRepository.updateAssetPoReferences(oldPoNumber, newPoNumber);
        
        // Phase 2: Update AssetPO primary key
        int poUpdated = assetPoRepository.updateAssetPoPrimaryKey(oldPoNumber, newPoNumber);
        
        if (poUpdated == 0) {
            throw new DataIntegrityViolationException("Failed to update AssetPO primary key");
        }
    }
    
    // Phase 3: Update other AssetPO fields
    updateAssetPoFields(currentPo, request);
    AssetPo updatedPo = assetPoRepository.save(currentPo);
    
    return AssetPoCascadeUpdateResponse.builder()
        .assetPO(updatedPo)
        .linkedAssetsUpdated(linkedAssetsUpdated)
        .message("Successfully updated PO and " + linkedAssetsUpdated + " linked assets")
        .build();
}
```

### 3. Repository Methods
```java
// In AssetRepository
@Modifying
@Query("UPDATE Asset a SET a.poNumber = :newPoNumber WHERE a.poNumber = :oldPoNumber")
int updateAssetPoReferences(@Param("oldPoNumber") String oldPoNumber, 
                           @Param("newPoNumber") String newPoNumber);

// In AssetPoRepository  
@Modifying
@Query(value = "UPDATE asset_po SET po_number = :newPoNumber WHERE po_number = :oldPoNumber", 
       nativeQuery = true)
int updateAssetPoPrimaryKey(@Param("oldPoNumber") String oldPoNumber, 
                           @Param("newPoNumber") String newPoNumber);
```

### 4. Response DTO
```java
public class AssetPoCascadeUpdateResponse {
    private AssetPo assetPO;
    private int linkedAssetsUpdated;
    private String message;
    
    // constructors, getters, setters, builder
}
```

## Transaction Management
- Use `@Transactional` on service method
- Ensure ROLLBACK on any failure
- Consider using `@Transactional(isolation = Isolation.SERIALIZABLE)` for high concurrency

## Error Handling
```java
try {
    // Update logic
} catch (DataIntegrityViolationException e) {
    if (e.getMessage().contains("duplicate key")) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, 
            "PO number already exists: " + newPoNumber);
    }
    throw new ResponseStatusException(HttpStatus.CONFLICT, 
        "Data integrity violation: " + e.getMessage());
}
```

## Testing
1. **Test PO number change**: Verify assets get updated first
2. **Test duplicate PO**: Should return 409 with clear message
3. **Test concurrent updates**: Verify transaction isolation
4. **Test rollback**: Ensure partial updates don't persist

## Current Error Analysis
**Frontend Error**: `409 Conflict: "Cannot delete record as it is referenced by other entities"`

**Backend Issue**: The current implementation is trying to delete the AssetPO record instead of safely updating it.

**Fix Required**: Implement the two-phase update above to avoid foreign key constraint violations.

## Priority: HIGH
This is blocking the cascade update functionality in production. 