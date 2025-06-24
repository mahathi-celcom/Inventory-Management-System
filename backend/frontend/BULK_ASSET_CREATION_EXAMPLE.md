# 🚀 Bulk Asset Creation - Complete Implementation Guide

This guide shows how to properly implement bulk asset creation in Angular 20 with Spring Boot backend integration.

## ✅ Key Changes Made

### 1. **AssetDTO Interface** (`src/app/models/asset.model.ts`)

```typescript
// ✅ NEW: AssetDTO for bulk creation - matches backend expectations
export interface AssetDTO {
  name: string;
  serialNumber: string;
  typeId?: number;
  makeId?: number;
  modelId?: number;
  itAssetCode?: string;
  macAddress?: string;
  ipv4Address?: string;
  status: string;
  ownerType: string;
  acquisitionType: string;
  currentUserId?: number;
  inventoryLocation?: string;
  osId?: number;
  osVersionId?: number;
  poNumber?: string;
  invoiceNumber?: string;
  acquisitionDate?: string;
  warrantyExpiry?: string;
  extendedWarrantyExpiry?: string;
  leaseEndDate?: string;
  vendorId?: number;
  extendedWarrantyVendorId?: number;
  rentalAmount?: number;
  acquisitionPrice?: number;
  depreciationPct?: number;
  currentPrice?: number;
  minContractPeriod?: number;
  tags?: string;
}

// ✅ Bulk creation response interface
export interface BulkAssetCreationResponse {
  successCount: number;
  failedAssets: {
    asset: AssetDTO;
    error: string;
  }[];
  createdAssets: Asset[];
  message: string;
}
```

### 2. **Improved Asset Service** (`src/app/services/asset.service.ts`)

```typescript
/**
 * ✅ IMPROVED: Bulk create assets with proper DTO and JSON array format
 * Sends a JSON array directly to the backend as expected
 */
bulkCreateAssets(assets: AssetDTO[]): Observable<BulkAssetCreationResponse> {
  this.setLoading(true);
  this.clearError();

  // ✅ Ensure we're sending a clean JSON array
  const cleanAssets = this.sanitizeAssetsForCreation(assets);
  
  console.log('🚀 Sending bulk assets payload (JSON array):', cleanAssets);

  return this.http.post<any>(
    '/api/assets/bulk', // ✅ Direct endpoint for bulk creation
    cleanAssets,  // ✅ Send array directly, not wrapped in an object
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  ).pipe(
      map(response => {
        // Handle different response formats - some backends wrap response in 'data'
        if (response.data) {
          return response.data as BulkAssetCreationResponse;
        }
        return response as BulkAssetCreationResponse;
      }),
      tap(result => {
        // Add newly created assets to the current list
        if (result.createdAssets && result.createdAssets.length > 0) {
          const currentAssets = this.assetsSubject.value;
          this.assetsSubject.next([...result.createdAssets, ...currentAssets]);
        }
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('❌ Bulk asset creation failed:', error);
        this.setLoading(false);
        return this.handleError(error);
      })
    );
}

/**
 * ✅ NEW: Sanitize assets data for creation (remove null/undefined values)
 */
private sanitizeAssetsForCreation(assets: AssetDTO[]): AssetDTO[] {
  return assets.map(asset => {
    const cleanedAsset: Partial<AssetDTO> = {};
    
    // Only include non-null, non-undefined, non-empty values
    Object.entries(asset).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        cleanedAsset[key as keyof AssetDTO] = value;
      }
    });
    
    return cleanedAsset as AssetDTO;
  });
}
```

### 3. **FormArray Implementation Example**

```typescript
export class BulkAssetCreationComponent implements OnInit, OnDestroy {
  bulkAssetForm!: FormGroup;
  
  /**
   * ✅ Initialize the form with FormArray for multiple assets
   */
  private initializeForm(): void {
    this.bulkAssetForm = this.fb.group({
      assets: this.fb.array([])  // ✅ FormArray for dynamic asset forms
    });
    
    // Start with 3 asset forms by default
    this.addAssetForms(3);
  }

  /**
   * ✅ Get the FormArray for assets
   */
  get assetsFormArray(): FormArray {
    return this.bulkAssetForm.get('assets') as FormArray;
  }

  /**
   * ✅ Add a single asset form to the FormArray
   */
  addAssetForm(): void {
    const assetForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      serialNumber: ['', [Validators.required, Validators.minLength(2)]],
      typeId: [null],
      makeId: [null],
      modelId: [null],
      status: [ASSET_STATUS.IN_STOCK, Validators.required],
      ownerType: [OWNER_TYPE.CELCOM, Validators.required],
      acquisitionType: [ACQUISITION_TYPE.BOUGHT, Validators.required],
      // ... other fields
    });

    this.assetsFormArray.push(assetForm);
  }

  /**
   * ✅ Handle form submission with proper data serialization
   */
  onSubmit(): void {
    if (this.bulkAssetForm.invalid) {
      this.markAllFormsTouched();
      this.showError('Please fix validation errors before submitting.');
      return;
    }

    this.isSubmitting = true;
    this.clearMessages();

    // ✅ Transform FormArray data to AssetDTO[]
    const assetsToCreate: AssetDTO[] = this.serializeAssetsFromForm();
    
    console.log('🚀 Submitting bulk asset creation:', assetsToCreate);

    this.assetService.bulkCreateAssets(assetsToCreate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: BulkAssetCreationResponse) => {
          this.handleBulkCreationSuccess(response);
        },
        error: (error) => {
          this.handleBulkCreationError(error);
        }
      });
  }

  /**
   * ✅ Serialize FormArray data to AssetDTO array
   * This ensures the data is in the exact format expected by the backend
   */
  private serializeAssetsFromForm(): AssetDTO[] {
    const formValue = this.bulkAssetForm.value;
    const assetsFromForm = formValue.assets || [];

    return assetsFromForm.map((asset: any) => {
      // Create a clean DTO object with only the required fields
      const dto: AssetDTO = {
        name: asset.name,
        serialNumber: asset.serialNumber,
        status: asset.status,
        ownerType: asset.ownerType,
        acquisitionType: asset.acquisitionType
      };

      // Add optional fields only if they have values
      if (asset.typeId) dto.typeId = asset.typeId;
      if (asset.makeId) dto.makeId = asset.makeId;
      if (asset.modelId) dto.modelId = asset.modelId;
      if (asset.itAssetCode) dto.itAssetCode = asset.itAssetCode;
      if (asset.macAddress) dto.macAddress = asset.macAddress;
      if (asset.ipv4Address) dto.ipv4Address = asset.ipv4Address;
      // ... add other optional fields

      return dto;
    });
  }
}
```

### 4. **Template with FormArray** (HTML)

```html
<form [formGroup]="bulkAssetForm" (ngSubmit)="onSubmit()">
  
  <!-- Form Controls -->
  <div class="form-controls">
    <button type="button" (click)="addAssetForm()" class="btn btn-secondary">
      Add Asset
    </button>
    <span>Total Assets: {{ assetsFormArray.length }}</span>
  </div>

  <!-- ✅ Dynamic Asset Forms using FormArray -->
  <div formArrayName="assets">
    
    <div 
      *ngFor="let assetForm of assetsFormArray.controls; let i = index" 
      [formGroupName]="i" 
      class="asset-form-card">
      
      <div class="card-header">
        <h3>Asset {{ i + 1 }}</h3>
        <button 
          type="button" 
          (click)="removeAssetForm(i)" 
          class="btn btn-danger">
          Remove
        </button>
      </div>

      <!-- Asset Form Fields -->
      <div class="card-content">
        
        <div class="form-group">
          <label>Asset Name *</label>
          <input 
            type="text" 
            formControlName="name" 
            class="form-input"
            [class.error]="hasAssetFieldError(i, 'name')">
          <div *ngIf="hasAssetFieldError(i, 'name')" class="error-message">
            {{ getAssetFieldError(i, 'name') }}
          </div>
        </div>

        <div class="form-group">
          <label>Serial Number *</label>
          <input 
            type="text" 
            formControlName="serialNumber" 
            class="form-input"
            [class.error]="hasAssetFieldError(i, 'serialNumber')">
          <div *ngIf="hasAssetFieldError(i, 'serialNumber')" class="error-message">
            {{ getAssetFieldError(i, 'serialNumber') }}
          </div>
        </div>

        <!-- ... other form fields -->
      </div>
    </div>
  </div>

  <!-- Form Actions -->
  <div class="form-actions">
    <button 
      type="submit" 
      class="btn btn-primary"
      [disabled]="isSubmitting || bulkAssetForm.invalid">
      {{ isSubmitting ? 'Creating Assets...' : 'Create All Assets' }}
    </button>
  </div>
</form>
```

## 🔑 Key Points

### ✅ **Correct JSON Format**
- The backend expects: `[{asset1}, {asset2}, {asset3}]`
- **NOT**: `{data: [{asset1}, {asset2}]}` or `{assets: [...]}`
- Send the array directly as the request body

### ✅ **Proper Data Serialization**
```typescript
// ❌ Wrong - sending form data directly
this.http.post('/api/assets/bulk', this.form.value.assets)

// ✅ Correct - serialize to proper DTO first
const assetsToCreate: AssetDTO[] = this.serializeAssetsFromForm();
this.http.post('/api/assets/bulk', assetsToCreate)
```

### ✅ **FormArray Benefits**
- Dynamic addition/removal of forms
- Individual validation per asset
- Clean data binding
- Proper TypeScript typing

### ✅ **Data Cleaning**
```typescript
// ✅ Remove null/undefined/empty values before sending
private sanitizeAssetsForCreation(assets: AssetDTO[]): AssetDTO[] {
  return assets.map(asset => {
    const cleanedAsset: Partial<AssetDTO> = {};
    
    Object.entries(asset).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        cleanedAsset[key as keyof AssetDTO] = value;
      }
    });
    
    return cleanedAsset as AssetDTO;
  });
}
```

## 🚀 Expected Backend Request

Your Angular frontend will now send:

```json
[
  {
    "name": "Asset 1",
    "serialNumber": "SN001",
    "status": "In Stock",
    "ownerType": "Celcom",
    "acquisitionType": "Bought",
    "typeId": 1,
    "makeId": 2,
    "modelId": 3
  },
  {
    "name": "Asset 2", 
    "serialNumber": "SN002",
    "status": "In Stock",
    "ownerType": "Celcom",
    "acquisitionType": "Bought"
  }
]
```

This matches exactly what your Spring Boot backend expects! 🎯 