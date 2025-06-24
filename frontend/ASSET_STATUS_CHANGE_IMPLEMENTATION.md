# Asset Status Change Implementation with Audit Trail

## Overview
This implementation provides asset status change functionality with automatic rules and a complete audit trail using the `asset_status_history` table.

## ✅ Frontend Implementation (Angular 20)

### Features Implemented:
1. **Manual Status Changes**: Direct status changes from Asset Dashboard
2. **Automatic Status Rules**: 
   - Employee assignment → Status: "Active"
   - Employee removal → Status: "In Stock" 
   - "Broken"/"Ceased" → Automatically unassign employee
   - "Active" → Requires employee assignment (validated)
3. **Real-time Validation**: Frontend validation with user feedback
4. **Audit Trail UI**: Status history modal with complete change tracking
5. **Removed Assigned User Dropdown**: As requested, user assignment is now handled via status rules

### Key Files Modified:
- `src/app/models/asset.model.ts` - Added status history interfaces and updated status constants
- `src/app/services/asset.service.ts` - Added status change API methods and validation
- `src/app/components/asset-management/asset.component.ts` - Added status change logic and UI controls
- `src/app/components/asset-management/asset.component.html` - Updated UI with status controls and history modal

### Status Options:
- **In Stock** - Available for assignment
- **Active** - Currently assigned to employee (requires currentUserId)
- **In Repair** - Under maintenance
- **Broken** - Non-functional (auto-unassigns employee)
- **Ceased** - End of life (auto-unassigns employee)

## 🔧 Backend Implementation (Spring Boot + Java 23)

### Required Entities:

#### 1. Asset Entity Updates
```java
@Entity
@Table(name = "assets")
public class Asset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long assetId;
    
    // ... existing fields ...
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AssetStatus status = AssetStatus.IN_STOCK;
    
    @Column(name = "current_user_id")
    private Long currentUserId;
    
    // ... other fields ...
}

@Getter
public enum AssetStatus {
    IN_STOCK("In Stock"),
    ACTIVE("Active"),
    IN_REPAIR("In Repair"),
    BROKEN("Broken"),
    CEASED("Ceased");
    
    private final String displayName;
    
    AssetStatus(String displayName) {
        this.displayName = displayName;
    }
}
```

#### 2. Asset Status History Entity
```java
@Entity
@Table(name = "asset_status_history")
@EntityListeners(AuditingEntityListener.class)
public class AssetStatusHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "asset_id", nullable = false)
    private Long assetId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AssetStatus status;
    
    @Column(name = "changed_by", nullable = false)
    private Long changedBy;
    
    @CreatedDate
    @Column(name = "change_date", nullable = false)
    private LocalDateTime changeDate;
    
    @Column(name = "remarks")
    private String remarks;
    
    // Constructors, getters, setters
    public AssetStatusHistory() {}
    
    public AssetStatusHistory(Long assetId, AssetStatus status, Long changedBy, String remarks) {
        this.assetId = assetId;
        this.status = status;
        this.changedBy = changedBy;
        this.remarks = remarks;
    }
}
```

### 3. DTOs
```java
// Request DTO
public class AssetStatusChangeRequest {
    private Long assetId;
    private AssetStatus newStatus;
    private Long changedBy;
    private String remarks;
    private Long currentUserId; // For assignment/unassignment
    
    // getters, setters, validation annotations
}

// Response DTO
public class AssetStatusChangeResponse {
    private Asset asset;
    private List<AssetStatusHistory> statusHistory;
    private String message;
    
    // constructors, getters, setters
}
```

### 4. Service Implementation
```java
@Service
@Transactional
public class AssetStatusService {
    
    private final AssetRepository assetRepository;
    private final AssetStatusHistoryRepository statusHistoryRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public AssetStatusChangeResponse changeAssetStatus(AssetStatusChangeRequest request) {
        // 1. Validate asset exists
        Asset asset = assetRepository.findById(request.getAssetId())
            .orElseThrow(() -> new EntityNotFoundException("Asset not found"));
        
        // 2. Apply business rules
        AssetStatus newStatus = request.getNewStatus();
        validateStatusChange(asset, newStatus, request.getCurrentUserId());
        
        // 3. Apply automatic rules
        applyAutomaticRules(asset, newStatus, request);
        
        // 4. Update asset status
        asset.setStatus(newStatus);
        asset.setUpdatedAt(LocalDateTime.now());
        Asset savedAsset = assetRepository.save(asset);
        
        // 5. Create audit trail entry
        AssetStatusHistory historyEntry = new AssetStatusHistory(
            asset.getAssetId(),
            newStatus,
            request.getChangedBy(),
            request.getRemarks()
        );
        statusHistoryRepository.save(historyEntry);
        
        // 6. Get updated status history
        List<AssetStatusHistory> statusHistory = getAssetStatusHistory(asset.getAssetId());
        
        return new AssetStatusChangeResponse(
            savedAsset,
            statusHistory,
            "Status changed to " + newStatus.getDisplayName() + " successfully"
        );
    }
    
    private void validateStatusChange(Asset asset, AssetStatus newStatus, Long proposedUserId) {
        // Rule: Active status requires user assignment
        if (newStatus == AssetStatus.ACTIVE && proposedUserId == null) {
            throw new IllegalArgumentException("Active status requires an employee to be assigned");
        }
        
        // Rule: Validate user exists if being assigned
        if (proposedUserId != null && !userRepository.existsById(proposedUserId)) {
            throw new IllegalArgumentException("Assigned user not found");
        }
    }
    
    private void applyAutomaticRules(Asset asset, AssetStatus newStatus, AssetStatusChangeRequest request) {
        switch (newStatus) {
            case ACTIVE:
                // Ensure user is assigned when setting to Active
                if (request.getCurrentUserId() != null) {
                    asset.setCurrentUserId(request.getCurrentUserId());
                }
                break;
                
            case BROKEN:
            case CEASED:
                // Automatically unassign user for these statuses
                asset.setCurrentUserId(null);
                break;
                
            case IN_STOCK:
            case IN_REPAIR:
                // These statuses can optionally have users assigned
                if (request.getCurrentUserId() != null) {
                    asset.setCurrentUserId(request.getCurrentUserId());
                }
                break;
        }
    }
    
    public List<AssetStatusHistory> getAssetStatusHistory(Long assetId) {
        return statusHistoryRepository.findByAssetIdOrderByChangeDateDesc(assetId);
    }
}
```

### 5. Controller Implementation
```java
@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "http://localhost:4200")
public class AssetStatusController {
    
    private final AssetStatusService assetStatusService;
    
    @PostMapping("/{assetId}/status")
    public ResponseEntity<AssetStatusChangeResponse> changeAssetStatus(
            @PathVariable Long assetId,
            @RequestBody @Valid AssetStatusChangeRequest request) {
        
        request.setAssetId(assetId); // Ensure consistency
        AssetStatusChangeResponse response = assetStatusService.changeAssetStatus(request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{assetId}/status")
    public ResponseEntity<List<AssetStatusHistory>> getAssetStatusHistory(@PathVariable Long assetId) {
        List<AssetStatusHistory> history = assetStatusService.getAssetStatusHistory(assetId);
        return ResponseEntity.ok(history);
    }
}
```

### 6. Database Migration
```sql
-- Create asset_status_history table
CREATE TABLE asset_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    asset_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    changed_by BIGINT NOT NULL,
    change_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    
    INDEX idx_asset_status_history_asset_id (asset_id),
    INDEX idx_asset_status_history_change_date (change_date),
    
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Update assets table status column
ALTER TABLE assets 
MODIFY COLUMN status ENUM('In Stock', 'Active', 'In Repair', 'Broken', 'Ceased') 
NOT NULL DEFAULT 'In Stock';
```

## 📋 Business Logic Flow

### Manual Status Change:
1. User selects new status from dropdown
2. Frontend validates status requirements
3. API call to `POST /api/assets/{id}/status`
4. Backend applies business rules and automatic user assignment/unassignment
5. Status history entry created
6. Frontend updates UI and shows success message

### Automatic Rules:
- **User Assignment**: Status automatically changes to "Active"
- **User Removal**: Status changes to "In Stock" (unless Broken/Ceased)
- **Broken/Ceased Selection**: User automatically unassigned

## 🚀 Testing:

```bash
# Test status change endpoint
curl -X POST http://localhost:8080/api/assets/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "newStatus": "ACTIVE",
    "changedBy": 1,
    "remarks": "Setting to active for testing",
    "currentUserId": 2
  }'

# Test status history endpoint
curl -X GET http://localhost:8080/api/assets/1/status
```

This implementation provides a complete asset status management system with proper audit trails and business rule enforcement. 