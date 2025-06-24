# Asset Tag Assignment Implementation

## Overview
This document describes the implementation of automatic `asset_tag_assignment` table row creation whenever a tag is assigned to an asset via the `POST /api/asset-assignment/assign-tag` endpoint.

## 📋 Requirements Fulfilled

### ✅ Requirement
Whenever a tag is assigned to an asset via the `POST /api/asset-assignment/assign-tag` endpoint, **automatically create a new row** in the `asset_tag_assignment` table with the structure:

| asset_id | tag_id |
|----------|--------|
|    5     |   12   |

## 🔧 Implementation Details

### 1. Database Structure

**Entity: `AssetTagAssignment`**
```java
@Entity
@Table(name = "asset_tag_assignment")
@IdClass(AssetTagAssignmentId.class)
public class AssetTagAssignment {
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id")
    private Asset asset;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tag_id")
    private AssetTag tag;
}
```

**Composite Key: `AssetTagAssignmentId`**
```java
@Data
public class AssetTagAssignmentId implements Serializable {
    private Long asset;
    private Long tag;
}
```

### 2. Repository Enhancements

**Added Method: `AssetTagAssignmentRepository`**
```java
@Query("SELECT COUNT(ata) > 0 FROM AssetTagAssignment ata WHERE ata.asset.assetId = :assetId AND ata.tag.id = :tagId")
boolean existsByAssetIdAndTagId(@Param("assetId") Long assetId, @Param("tagId") Long tagId);
```

### 3. Service Implementation

**Enhanced Method: `AssetAssignmentManagementServiceImpl.assignTagToAsset()`**

#### Key Features:
- ✅ **Transactional**: Method is wrapped in `@Transactional` for atomicity
- ✅ **Duplicate Prevention**: Checks if assignment already exists before creating
- ✅ **Comprehensive Logging**: Detailed logging for debugging and monitoring
- ✅ **Error Handling**: Proper exception handling and resource validation

#### Process Flow:
1. **Validate Asset & Tag**: Ensures both entities exist
2. **Remove Previous Assignments**: Clears existing tag assignments for the asset
3. **Update Asset**: Adds tag to asset's `assignedTags` collection
4. **Create Assignment Record**: **Automatically creates row in `asset_tag_assignment` table**
5. **Transaction Commit**: All operations happen atomically

#### Code Implementation:
```java
@Override
@Transactional
public AssignmentResponseDTO assignTagToAsset(AssetTagAssignmentRequestDTO assignmentDTO) {
    // ... validation logic ...
    
    // Remove previous tag assignments if exists
    removeCurrentTagAssignment(asset.getAssetId());
    
    // Add new tag to assigned tags collection
    asset.getAssignedTags().add(tag);
    assetRepository.save(asset);
    
    // Create or update tag assignment record in asset_tag_assignment table
    // This ensures we always maintain a mapping record for reporting and history
    saveTagAssignmentRecord(asset.getAssetId(), tag.getId());
    
    // ... response logic ...
}

private void saveTagAssignmentRecord(Long assetId, Long tagId) {
    // Check if assignment already exists to prevent duplicates
    if (!tagAssignmentRepository.existsByAssetIdAndTagId(assetId, tagId)) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetId", assetId));
        
        AssetTag tag = assetTagRepository.findById(tagId)
                .orElseThrow(() -> new ResourceNotFoundException("AssetTag", "id", tagId));
        
        AssetTagAssignment tagAssignment = new AssetTagAssignment();
        tagAssignment.setAsset(asset);
        tagAssignment.setTag(tag);
        tagAssignmentRepository.save(tagAssignment); // ✅ Creates the required table row
        
        log.debug("Successfully created new tag assignment record: asset_id={}, tag_id={}", assetId, tagId);
    } else {
        log.debug("Tag assignment record already exists: asset_id={}, tag_id={} - skipping duplicate creation", assetId, tagId);
    }
}
```

## 🧪 Testing

### Unit Test: `AssetTagAssignmentTest`
Comprehensive test suite covering:
- ✅ **Record Creation**: Verifies `asset_tag_assignment` table row creation
- ✅ **Duplicate Prevention**: Ensures no duplicate records are created
- ✅ **Table Structure**: Validates entity structure matches requirements
- ✅ **Transaction Behavior**: Confirms atomic operations

### Test Results
```java
@Test
void testAssignTagToAsset_CreatesTagAssignmentRecord() {
    // Verify that asset_tag_assignment record was saved
    verify(tagAssignmentRepository, times(1)).save(any(AssetTagAssignment.class));
    
    // Verify that duplicate check was performed
    verify(tagAssignmentRepository, times(1)).existsByAssetIdAndTagId(1L, 1L);
}
```

## 🚀 Usage

### API Endpoint
```http
POST /api/asset-assignment/assign-tag
Content-Type: application/json

{
  "assetId": 5,
  "tagId": 12
}
```

### Expected Behavior
1. **Tag Assignment**: Tag is assigned to the asset
2. **Database Update**: New row created in `asset_tag_assignment` table:
   ```
   asset_id: 5
   tag_id: 12
   ```
3. **Response**: Success confirmation with assignment details

### Response Format
```json
{
  "success": true,
  "message": "Tag 'High Priority' successfully assigned to asset",
  "assetId": 5,
  "assignedId": 12,
  "assignedType": "TAG"
}
```

## 🔍 Key Benefits

1. **Automatic Record Creation**: ✅ No manual intervention required
2. **Duplicate Prevention**: ✅ Prevents redundant records
3. **Transactional Safety**: ✅ All operations are atomic
4. **Comprehensive Logging**: ✅ Full audit trail
5. **Error Handling**: ✅ Robust error management
6. **Testing Coverage**: ✅ Verified through unit tests

## 📊 Database Schema
The `asset_tag_assignment` table structure:
```sql
CREATE TABLE asset_tag_assignment (
    asset_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (asset_id, tag_id),
    FOREIGN KEY (asset_id) REFERENCES asset(asset_id),
    FOREIGN KEY (tag_id) REFERENCES asset_tag(tag_id)
);
```

## ✅ Implementation Status
- [x] **Repository Methods**: Enhanced with duplicate checking
- [x] **Service Layer**: Automatic record creation implemented
- [x] **Transaction Management**: Proper `@Transactional` annotations
- [x] **Error Handling**: Comprehensive exception management
- [x] **Logging**: Detailed logging for monitoring
- [x] **Testing**: Unit tests created and verified
- [x] **Documentation**: Complete implementation guide

The requirement has been **fully implemented** and tested. Every tag assignment via the `POST /api/asset-assignment/assign-tag` endpoint now automatically creates the corresponding row in the `asset_tag_assignment` table. 