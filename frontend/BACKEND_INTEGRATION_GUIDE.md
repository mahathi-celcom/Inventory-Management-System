# Backend Integration Guide for Asset Management DTOs

## 🎯 Required Spring Boot Endpoints

### 1. **AssetModelDTO Endpoints**

```java
@RestController
@RequestMapping("/api/asset-models")
public class AssetModelController {

    @GetMapping("/{id}")
    public ResponseEntity<AssetModelDTO> getAssetModelById(@PathVariable Long id) {
        AssetModelDTO dto = assetModelService.getAssetModelWithDetails(id);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/with-make")
    public ResponseEntity<List<AssetModelDTO>> getAllAssetModelsWithMake() {
        List<AssetModelDTO> dtos = assetModelService.getAllModelsWithMakeDetails();
        return ResponseEntity.ok(dtos);
    }
}
```

**AssetModelDTO Structure:**
```java
public class AssetModelDTO {
    private Long id;
    @NotNull 
    private Long makeId;
    @NotBlank 
    private String name;
    private String ram;
    private String storage;
    private String processor;
    private String status = "Active";
    
    // Include make details for cascading
    private String makeName;
    private Long typeId;
    private String assetTypeName;
}
```

### 2. **OSVersionDTO Endpoints**

```java
@RestController
@RequestMapping("/api/os-versions")
public class OSVersionController {

    @GetMapping("/{id}")
    public ResponseEntity<OSVersionDTO> getOSVersionById(@PathVariable Long id) {
        OSVersionDTO dto = osVersionService.getOSVersionWithDetails(id);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/with-os")
    public ResponseEntity<List<OSVersionDTO>> getAllOSVersionsWithOS() {
        List<OSVersionDTO> dtos = osVersionService.getAllVersionsWithOSDetails();
        return ResponseEntity.ok(dtos);
    }
}
```

**OSVersionDTO Structure:**
```java
public class OSVersionDTO {
    private Long id;
    @NotNull 
    private Long osId;
    @NotBlank 
    private String versionNumber;
    private String status = "Active";
    
    // Include OS details for cascading
    private String osName;
}
```

### 3. **AssetPODTO Endpoints**

```java
@RestController
@RequestMapping("/api/asset-pos")
public class AssetPOController {

    @GetMapping("/by-po-number/{poNumber}")
    public ResponseEntity<AssetPODTO> getPODetailsByNumber(@PathVariable String poNumber) {
        AssetPODTO dto = assetPOService.getPODetailsByNumber(poNumber);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/available-po-numbers")
    public ResponseEntity<List<String>> getAvailablePONumbers() {
        List<String> poNumbers = assetPOService.getAvailablePONumbers();
        return ResponseEntity.ok(poNumbers);
    }

    @GetMapping("/validate-po/{poNumber}")
    public ResponseEntity<Boolean> validatePONumber(@PathVariable String poNumber) {
        boolean exists = assetPOService.poNumberExists(poNumber);
        return ResponseEntity.ok(exists);
    }
}
```

**AssetPODTO Structure:**
```java
public class AssetPODTO {
    private Long id;
    @NotBlank 
    @Pattern(regexp = "^(Bought|Leased|Rented)$") 
    private String acquisitionType;
    @NotBlank 
    private String poNumber;
    private String invoiceNumber;
    private LocalDate acquisitionDate;
    private Long vendorId;
    private String name;
    @NotBlank 
    @Pattern(regexp = "^(Celcom|Vendor)$") 
    private String ownerType;
    private LocalDate leaseEndDate;
    private BigDecimal rentalAmount;
    private Integer minContractPeriod;
    private BigDecimal acquisitionPrice;
    private BigDecimal currentPrice;
    private Double depreciationPct;
    private Integer totalDevices;
}
```

### 4. **Enhanced Asset Endpoints**

```java
@RestController
@RequestMapping("/api/assets")
public class AssetController {

    @GetMapping("/{id}/with-details")
    public ResponseEntity<AssetWithDetailsDTO> getAssetWithDetails(@PathVariable Long id) {
        AssetWithDetailsDTO dto = assetService.getAssetWithAllDetails(id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}/with-po")
    public ResponseEntity<Asset> updateAssetWithPO(
            @PathVariable Long id,
            @RequestBody AssetPOUpdateRequest request) {
        Asset updatedAsset = assetService.updateAssetWithPOData(id, request);
        return ResponseEntity.ok(updatedAsset);
    }
}
```

**AssetPOUpdateRequest Structure:**
```java
public class AssetPOUpdateRequest {
    private Asset asset;
    private AssetPODTO po;
}
```

## 🔄 Service Layer Implementation Examples

### 1. **AssetModelService**

```java
@Service
@Transactional
public class AssetModelService {

    public AssetModelDTO getAssetModelWithDetails(Long id) {
        AssetModel model = assetModelRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Asset model not found"));
        
        AssetMake make = model.getAssetMake();
        AssetType type = make.getAssetType();
        
        return AssetModelDTO.builder()
            .id(model.getId())
            .makeId(model.getMakeId())
            .name(model.getName())
            .ram(model.getRam())
            .storage(model.getStorage())
            .processor(model.getProcessor())
            .status(model.getStatus())
            .makeName(make.getName())
            .typeId(type.getId())
            .assetTypeName(type.getName())
            .build();
    }
}
```

### 2. **AssetPOService**

```java
@Service
@Transactional
public class AssetPOService {

    public AssetPODTO getPODetailsByNumber(String poNumber) {
        AssetPO po = assetPORepository.findByPoNumber(poNumber)
            .orElseThrow(() -> new EntityNotFoundException("PO not found: " + poNumber));
        
        Vendor vendor = po.getVendor();
        
        return AssetPODTO.builder()
            .id(po.getId())
            .acquisitionType(po.getAcquisitionType())
            .poNumber(po.getPoNumber())
            .invoiceNumber(po.getInvoiceNumber())
            .acquisitionDate(po.getAcquisitionDate())
            .vendorId(po.getVendorId())
            .name(vendor != null ? vendor.getname() : null)
            .ownerType(po.getOwnerType())
            .leaseEndDate(po.getLeaseEndDate())
            .rentalAmount(po.getRentalAmount())
            .minContractPeriod(po.getMinContractPeriod())
            .acquisitionPrice(po.getAcquisitionPrice())
            .currentPrice(po.getCurrentPrice())
            .depreciationPct(po.getDepreciationPct())
            .totalDevices(po.getTotalDevices())
            .build();
    }

    public List<String> getAvailablePONumbers() {
        return assetPORepository.findAllActivePONumbers();
    }

    public boolean poNumberExists(String poNumber) {
        return assetPORepository.existsByPoNumber(poNumber);
    }
}
```

### 3. **Enhanced AssetService**

```java
@Service
@Transactional
public class AssetService {

    public Asset updateAssetWithPOData(Long assetId, AssetPOUpdateRequest request) {
        Asset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new EntityNotFoundException("Asset not found"));
        
        // Update asset fields
        updateAssetFromRequest(asset, request.getAsset());
        
        // Update PO fields if provided
        if (request.getPo() != null && asset.getPoNumber() != null) {
            updatePOFromRequest(asset.getPoNumber(), request.getPo());
        }
        
        return assetRepository.save(asset);
    }

    private void updatePOFromRequest(String poNumber, AssetPODTO poData) {
        AssetPO po = assetPORepository.findByPoNumber(poNumber)
            .orElseThrow(() -> new EntityNotFoundException("PO not found: " + poNumber));
        
        // Update PO fields
        if (poData.getAcquisitionPrice() != null) {
            po.setAcquisitionPrice(poData.getAcquisitionPrice());
        }
        if (poData.getCurrentPrice() != null) {
            po.setCurrentPrice(poData.getCurrentPrice());
        }
        // ... update other fields as needed
        
        assetPORepository.save(po);
    }
}
```

## 🗃️ Repository Requirements

### **Required Query Methods:**

```java
// AssetPORepository
public interface AssetPORepository extends JpaRepository<AssetPO, Long> {
    Optional<AssetPO> findByPoNumber(String poNumber);
    boolean existsByPoNumber(String poNumber);
    
    @Query("SELECT DISTINCT po.poNumber FROM AssetPO po WHERE po.status = 'Active'")
    List<String> findAllActivePONumbers();
}

// AssetModelRepository  
public interface AssetModelRepository extends JpaRepository<AssetModel, Long> {
    @Query("SELECT m FROM AssetModel m LEFT JOIN FETCH m.assetMake make LEFT JOIN FETCH make.assetType WHERE m.id = :id")
    Optional<AssetModel> findByIdWithMakeAndType(@Param("id") Long id);
}

// OSVersionRepository
public interface OSVersionRepository extends JpaRepository<OSVersion, Long> {
    @Query("SELECT v FROM OSVersion v LEFT JOIN FETCH v.operatingSystem WHERE v.id = :id")
    Optional<OSVersion> findByIdWithOS(@Param("id") Long id);
}
```

## 🔒 Security & Validation

### **Input Validation:**

```java
@Valid
public class AssetPODTO {
    @Pattern(regexp = "^(Bought|Leased|Rented)$", 
             message = "Acquisition type must be Bought, Leased, or Rented")
    private String acquisitionType;
    
    @Pattern(regexp = "^(Celcom|Vendor)$", 
             message = "Owner type must be Celcom or Vendor")
    private String ownerType;
    
    @DecimalMin(value = "0.0", message = "Price must be non-negative")
    private BigDecimal acquisitionPrice;
    
    @Min(value = 0, message = "Contract period must be non-negative")
    private Integer minContractPeriod;
}
```

### **Exception Handling:**

```java
@ControllerAdvice
public class AssetManagementExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(EntityNotFoundException ex) {
        ErrorResponse error = new ErrorResponse("ENTITY_NOT_FOUND", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex) {
        ErrorResponse error = new ErrorResponse("VALIDATION_ERROR", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}
```

## 🚀 Testing the Integration

### **Test the endpoints with these sample requests:**

```bash
# Test AssetModel DTO
GET /api/asset-models/1
Expected: Full model details with make and type info

# Test OSVersion DTO  
GET /api/os-versions/1
Expected: Version details with OS info

# Test PO DTO
GET /api/asset-pos/by-po-number/PO-2024-001
Expected: Complete PO details with vendor info

# Test Available PO Numbers
GET /api/asset-pos/available-po-numbers
Expected: Array of active PO numbers

# Test Asset with Details
GET /api/assets/1/with-details
Expected: Asset with embedded DTO details
```

This backend implementation will fully support the frontend fixes and provide the cascading functionality, proper error handling, and data integrity required for the asset management system. 