import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';

import { AssetService } from '../../services/asset.service';
import { 
  AssetType, 
  AssetModelWithDetails, 
  User, 
  OperatingSystem, 
  OSVersion, 
  Vendor,
  ASSET_STATUS,
  OWNER_TYPE,
  ACQUISITION_TYPE 
} from '../../models/asset.model';

@Component({
  selector: 'app-asset-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card-celcom">
      <div class="card-celcom-header">
        <h3 class="text-lg font-medium text-celcom-gradient flex items-center">
          <svg class="w-5 h-5 mr-2 text-celcom-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
          {{ title }}
          @if (isEditMode) {
            <span class="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              Editing
            </span>
          }
          <span *ngIf="assetForm.valid" class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✓ Valid
          </span>
          <span *ngIf="assetForm.invalid && (assetForm.dirty || assetForm.touched)" class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            ⚠ Needs attention
          </span>
        </h3>
      </div>
      
      <div class="card-celcom-body">
        <form [formGroup]="assetForm" (ngSubmit)="onSubmit()">
          <!-- Basic Information Row -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="form-celcom-label">Asset Name *</label>
              <input 
                type="text" 
                formControlName="name"
                placeholder="e.g., Dell Laptop XPS"
                class="form-celcom-input"
                [class.form-celcom-input-error]="hasFieldError('name')">
              <div *ngIf="hasFieldError('name')" class="form-celcom-error">
                {{ getFieldError('name') }}
              </div>
            </div>

            <div>
              <label class="form-celcom-label">Serial Number *</label>
              <input 
                type="text" 
                formControlName="serialNumber"
                placeholder="e.g., SN123456789"
                class="form-celcom-input"
                [class.form-celcom-input-error]="hasFieldError('serialNumber')">
              <div *ngIf="hasFieldError('serialNumber')" class="form-celcom-error">
                {{ getFieldError('serialNumber') }}
              </div>
            </div>

            <div>
              <label class="form-celcom-label">IT Asset Code</label>
              <input 
                type="text" 
                formControlName="itAssetCode"
                placeholder="e.g., IT-001"
                class="form-celcom-input">
            </div>
          </div>

          <!-- Network & Hardware Row -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label class="form-celcom-label">Model *</label>
              <select 
                formControlName="modelId"
                class="form-celcom-select"
                [class.form-celcom-input-error]="hasFieldError('modelId')">
                <option value="">Select Model</option>
                <option *ngFor="let model of assetModelsWithDetails" [value]="model.id">
                  {{ model.name }} ({{ model.makeName }})
                </option>
              </select>
              <div *ngIf="hasFieldError('modelId')" class="form-celcom-error">
                {{ getFieldError('modelId') }}
              </div>
            </div>

            <div>
              <label class="form-celcom-label">MAC Address</label>
              <input 
                type="text" 
                formControlName="macAddress"
                placeholder="e.g., 00:11:22:33:44:55"
                class="form-celcom-input">
            </div>

            <div>
              <label class="form-celcom-label">IP Address</label>
              <input 
                type="text" 
                formControlName="ipv4Address"
                placeholder="e.g., 192.168.1.100"
                class="form-celcom-input"
                [class.form-celcom-input-error]="hasFieldError('ipv4Address')">
              <div *ngIf="hasFieldError('ipv4Address')" class="form-celcom-error">
                {{ getFieldError('ipv4Address') }}
              </div>
            </div>

            <div>
              <label class="form-celcom-label">Location</label>
              <input 
                type="text" 
                formControlName="inventoryLocation"
                placeholder="e.g., Office A, Floor 3"
                class="form-celcom-input">
            </div>
          </div>

          <!-- Assignment & Status Row -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="form-celcom-label">Status *</label>
              <select 
                formControlName="status"
                class="form-celcom-select"
                [class.form-celcom-input-error]="hasFieldError('status')">
                <option *ngFor="let status of statusOptions" [value]="status">{{ status }}</option>
              </select>
              <div *ngIf="hasFieldError('status')" class="form-celcom-error">
                {{ getFieldError('status') }}
              </div>
            </div>

            <div>
              <label class="form-celcom-label">Assigned User</label>
              <select 
                formControlName="currentUserId"
                class="form-celcom-select">
                <option value="">Not Assigned</option>
                <option *ngFor="let user of users" [value]="user.id">{{ user.name }}</option>
              </select>
            </div>

            <div>
              <label class="form-celcom-label">OS Version</label>
              <select 
                formControlName="osVersionId"
                class="form-celcom-select">
                <option value="">Select OS Version</option>
                <option *ngFor="let version of osVersions" [value]="version.id">{{ version.name }}</option>
              </select>
            </div>
          </div>

          <!-- ✅ NEW: Warranty Information Section -->
          <div class="mt-6 pt-4 border-t border-gray-200">
            <h4 class="text-sm font-medium text-celcom-text mb-4 flex items-center">
              <svg class="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              Warranty Information
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Warranty Expiry - Editable -->
              <div>
                <label class="form-celcom-label">Warranty Expiry</label>
                <input 
                  type="date" 
                  formControlName="warrantyExpiry"
                  class="form-celcom-input"
                  title="Enter warranty expiration date">
                <p class="text-xs text-gray-500 mt-1">✅ Editable - Enter warranty end date</p>
              </div>
              
              <!-- Extended Warranty Expiry - Editable -->
              <div>
                <label class="form-celcom-label">Extended Warranty Expiry</label>
                <input 
                  type="date" 
                  formControlName="extendedWarrantyExpiry"
                  class="form-celcom-input"
                  title="Enter extended warranty expiration date">
                <p class="text-xs text-gray-500 mt-1">Extended warranty end date</p>
              </div>
              
              <!-- Extended Warranty Vendor ID - Read-only (derived from backend) -->
              <div>
                <label class="form-celcom-label">Extended Warranty Vendor ID</label>
                <input 
                  type="text" 
                  formControlName="extendedWarrantyVendorId"
                  class="form-celcom-input bg-gray-50 text-gray-700"
                  readonly
                  title="Auto-populated from backend - not editable">
                <p class="text-xs text-gray-500 mt-1">🚫 Auto-derived (not editable)</p>
              </div>
            </div>
          </div>

          <!-- Tags Row -->
          <div class="grid grid-cols-1 gap-4 mt-4">
            <div>
              <label class="form-celcom-label">Tags</label>
              <input 
                type="text" 
                formControlName="tags"
                placeholder="e.g., laptop, finance, urgent (comma-separated)"
                class="form-celcom-input">
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-celcom-label {
      @apply block text-sm font-medium text-gray-700 mb-1;
    }
    .form-celcom-input {
      @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200;
    }
    .form-celcom-input-error {
      @apply border-red-500;
    }
    .form-celcom-select {
      @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200;
    }
    .form-celcom-error {
      @apply text-red-500 text-xs mt-1;
    }
    .card-celcom {
      @apply bg-white rounded-lg shadow-sm border border-gray-200;
    }
    .card-celcom-header {
      @apply px-4 py-3 border-b border-gray-200;
    }
    .card-celcom-body {
      @apply p-4;
    }
    .text-celcom-gradient {
      @apply bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent;
    }
    .text-celcom-accent {
      @apply text-blue-600;
    }
  `]
})
export class AssetFormComponent implements OnInit, OnDestroy {
  @Input() title: string = 'Asset Information';
  @Input() isEditMode: boolean = false;
  @Input() initialData: any = null;
  @Input() showCopyOption: boolean = false;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formChange = new EventEmitter<any>();

  private destroy$ = new Subject<void>();
  
  // Form
  assetForm!: FormGroup;
  
  // Dropdown data
  assetModelsWithDetails: AssetModelWithDetails[] = [];
  users: User[] = [];
  osVersions: OSVersion[] = [];
  
  // Form options
  readonly statusOptions = Object.values(ASSET_STATUS);
  readonly ownerTypeOptions = Object.values(OWNER_TYPE);
  readonly acquisitionTypeOptions = Object.values(ACQUISITION_TYPE);

  constructor(
    private fb: FormBuilder,
    private assetService: AssetService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadDropdownData();
    this.setupFormDependencies();
    
    if (this.initialData) {
      this.assetForm.patchValue(this.initialData);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.assetForm = this.fb.group({
      assetId: [''],
      name: ['', [Validators.required, Validators.minLength(3)]],
      serialNumber: ['', [Validators.required, Validators.minLength(3)]],
      itAssetCode: [''],
      macAddress: [''],
      ipv4Address: ['', Validators.pattern(/^(\d{1,3}\.){3}\d{1,3}$/)],
      inventoryLocation: [''],
      tags: [''],
      modelId: [null, Validators.required],
      osVersionId: [null],
      currentUserId: [null],
      status: [ASSET_STATUS.IN_STOCK, Validators.required],
      acquisitionType: [ACQUISITION_TYPE.BOUGHT],
      poNumber: [''],
      invoiceNumber: [''],
      acquisitionDate: [''],
      vendorId: [null],
      ownerType: [OWNER_TYPE.CELCOM],
      leaseEndDate: [''],
      rentalAmount: [null],
      acquisitionPrice: [null],
      depreciationPct: [0],
      currentPrice: [null],
      minContractPeriod: [null],
      warrantyExpiry: [''],
      extendedWarrantyExpiry: [''],
      extendedWarrantyVendorId: [null],
      typeId: [null],
      makeId: [null],
      osId: [null]
    });
  }

  private async loadDropdownData(): Promise<void> {
    try {
      const [assetModelsWithDetails, users, osVersions] = await Promise.all([
        this.assetService.getAssetModelsWithDetails().toPromise(),
        this.assetService.getUsers().toPromise(),
        this.assetService.getOSVersions().toPromise()
      ]);

      this.assetModelsWithDetails = assetModelsWithDetails || [];
      this.users = users || [];
      this.osVersions = osVersions || [];
    } catch (error) {
      console.error('Error loading asset form dropdown data:', error);
    }
  }

  private setupFormDependencies(): void {
    // Model selection auto-fills type and make
    this.assetForm.get('modelId')?.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(modelId => {
        if (modelId) {
          const selectedModel = this.assetModelsWithDetails.find(m => m.id === modelId);
          if (selectedModel) {
            this.assetForm.patchValue({
              typeId: selectedModel.typeId,
              makeId: selectedModel.makeId
            }, { emitEvent: false });
          }
        }
      });

    // Form changes emit to parent
    this.assetForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.formChange.emit(value);
      });
  }

  onSubmit(): void {
    if (this.assetForm.valid) {
      this.formSubmit.emit(this.assetForm.value);
    }
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.assetForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.assetForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['pattern']) return `${fieldName} format is invalid`;
    }
    return '';
  }

  get formValue() {
    return this.assetForm.value;
  }

  get isValid() {
    return this.assetForm.valid;
  }

  patchValue(data: any) {
    this.assetForm.patchValue(data);
  }

  resetForm() {
    this.assetForm.reset();
  }
} 