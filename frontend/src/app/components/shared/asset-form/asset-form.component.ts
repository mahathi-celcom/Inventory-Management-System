import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, distinctUntilChanged, debounceTime, of } from 'rxjs';

// Models
import { Asset, ASSET_CATEGORY, WARRANTY_STATUS, LICENSE_STATUS, AssetHelper } from '../../../models/asset.model';
import { AssetType } from '../../../models/asset-type.model';
import { AssetMake } from '../../../models/asset-make.model';
import { AssetModel } from '../../../models/asset-model.model';
import { User } from '../../../models/user.model';
import { AssetPo } from '../../../models/asset-po.model';
import { OS } from '../../../models/os.model';
import { Vendor } from '../../../models/vendor.model';

// Services
import { AssetService } from '../../../services/asset.service';
import { AssetTypeService } from '../../../services/asset-type.service';
import { AssetMakeService } from '../../../services/asset-make.service';
import { AssetModelService } from '../../../services/asset-model.service';
import { AssetPoService } from '../../../services/asset-po.service';
import { UserService } from '../../../services/user.service';
import { OSService } from '../../../services/os.service';
import { VendorService } from '../../../services/vendor.service';
import { ConfigurationService, StatusOption } from '../../../services/configuration.service';

export interface AssetFormConfig {
  mode: 'create' | 'edit';
  context: 'asset' | 'po'; // Asset module vs PO module context
  preSelectedPONumber?: string; // For PO module context
  asset?: Asset; // For edit mode
}

@Component({
  selector: 'app-asset-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './asset-form.component.html',
  styleUrls: ['./asset-form.component.css']
})
export class AssetFormComponent implements OnInit, OnDestroy {
  @Input() config!: AssetFormConfig;
  @Output() formSubmit = new EventEmitter<Asset>();
  @Output() formCancel = new EventEmitter<void>();

  // Services
  private fb = inject(FormBuilder);
  private assetService = inject(AssetService);
  private assetTypeService = inject(AssetTypeService);
  private assetMakeService = inject(AssetMakeService);
  private assetModelService = inject(AssetModelService);
  private assetPoService = inject(AssetPoService);
  private userService = inject(UserService);
  private osService = inject(OSService);
  private vendorService = inject(VendorService);
  private configService = inject(ConfigurationService);

  // Form
  assetForm!: FormGroup;
  
  // Signals for reactive data
  loading = signal(false);
  submitting = signal(false);
  
  // Dropdown data signals
  assetTypes = signal<AssetType[]>([]);
  assetMakes = signal<AssetMake[]>([]);
  assetModels = signal<AssetModel[]>([]);
  users = signal<User[]>([]);
  purchaseOrders = signal<AssetPo[]>([]);
  operatingSystems = signal<OS[]>([]);
  osVersions = signal<any[]>([]);
  vendors = signal<Vendor[]>([]);
  statusOptions = signal<StatusOption[]>([]);

  // Filtered dropdown signals based on selections
  filteredAssetTypes = computed(() => {
    const category = this.assetForm?.get('assetCategory')?.value;
    if (!category || category === 'ALL') return this.assetTypes();
    return this.assetTypes().filter(type => type.assetCategory === category);
  });

  filteredAssetMakes = computed(() => {
    const typeId = this.assetForm?.get('assetTypeId')?.value;
    if (!typeId) return [];
    return this.assetMakes().filter(make => make.typeId === Number(typeId));
  });

  filteredAssetModels = computed(() => {
    const makeId = this.assetForm?.get('makeId')?.value;
    if (!makeId) return [];
    return this.assetModels().filter(model => model.makeId === Number(makeId));
  });

  filteredOSVersions = computed(() => {
    const osId = this.assetForm?.get('osId')?.value;
    if (!osId) return [];
    return this.osVersions().filter(version => version.osId === Number(osId));
  });

  // Field visibility signals
  showSoftwareFields = signal(false);
  showHardwareFields = signal(true);
  
  // Loading states for individual dropdowns
  typesLoading = signal(false);
  makesLoading = signal(false);
  modelsLoading = signal(false);

  // Error states
  formErrors = signal<{[key: string]: string}>({});

  private destroy$ = new Subject<void>();

  // Constants for templates
  readonly ASSET_CATEGORY = ASSET_CATEGORY;
  readonly WARRANTY_STATUS = WARRANTY_STATUS;
  readonly LICENSE_STATUS = LICENSE_STATUS;

  ngOnInit() {
    this.initializeForm();
    this.loadInitialData();
    this.setupFormDependencies();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.assetForm = this.fb.group({
      // Basic Information
      assetId: [null],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      serialNumber: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      assetCategory: ['HARDWARE', [Validators.required]],
      
      // Cascading Dropdowns
      assetTypeId: ['', [Validators.required]],
      makeId: ['', [Validators.required]],
      modelId: ['', [Validators.required]],
      osId: [''],
      osVersionId: [''],
      
      // Asset Details
      itAssetCode: ['', [Validators.maxLength(50)]],
      macAddress: [''],
      ipv4Address: [''],
      status: ['IN_STOCK', [Validators.required]],
      inventoryLocation: [''],
      
      // Hardware specific
      warrantyExpiry: [''],
      
      // Software specific
      licenseName: [''],
      licenseValidityPeriod: [''],
      
      // Assignment
      currentUserId: [''],
      tags: [''],
      
      // PO Related (contextual editability)
      poNumber: [''],
      invoiceNumber: [{value: '', disabled: true}],
      acquisitionDate: [{value: '', disabled: true}],
      ownerType: [{value: '', disabled: true}],
      acquisitionType: [{value: '', disabled: true}],
      vendorId: [{value: '', disabled: true}],
      rentalAmount: [{value: '', disabled: true}],
      acquisitionPrice: [{value: '', disabled: true}],
      depreciationPct: [{value: '', disabled: true}],
      currentPrice: [{value: '', disabled: true}],
      minContractPeriod: [{value: '', disabled: true}],
      leaseEndDate: [{value: '', disabled: true}]
    });

    // Handle contextual PO number editability
    if (this.config.context === 'po' && this.config.preSelectedPONumber) {
      this.assetForm.patchValue({ poNumber: this.config.preSelectedPONumber });
      this.assetForm.get('poNumber')?.disable();
    }

    // Load existing asset data for edit mode
    if (this.config.mode === 'edit' && this.config.asset) {
      this.loadAssetData(this.config.asset);
    }
  }

  private loadAssetData(asset: Asset) {
    this.assetForm.patchValue({
      ...asset,
      warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split('T')[0] : '',
      licenseValidityPeriod: asset.licenseValidityPeriod ? new Date(asset.licenseValidityPeriod).toISOString().split('T')[0] : ''
    });
    
    // Update field visibility based on category
    this.updateFieldVisibility(asset.assetCategory || 'HARDWARE');
  }

  private async loadInitialData() {
    this.loading.set(true);
    
    try {
      const [
        assetTypesData,
        assetMakesData,
        assetModelsData,
        usersData,
        purchaseOrdersData,
        operatingSystemsData,
        osVersionsData,
        vendorsData,
        statusOptionsData
      ] = await Promise.all([
        this.assetTypeService.getAllAssetTypes().toPromise(),
        this.assetMakeService.getAllAssetMakes().toPromise(),
        this.assetModelService.getAllAssetModels().toPromise(),
        this.userService.getAllUsers().toPromise(),
        this.assetPoService.getAllAssetPos().toPromise(),
        this.osService.getAllOS().toPromise(),
        this.assetService.getOSVersions().toPromise(),
        this.vendorService.getAllVendors().toPromise(),
        of(this.configService.getAssetStatuses()).toPromise()
      ]);

      this.assetTypes.set(assetTypesData || []);
      this.assetMakes.set(assetMakesData || []);
      this.assetModels.set(assetModelsData || []);
      this.users.set(Array.isArray(usersData) ? usersData : usersData?.content || []);
      this.purchaseOrders.set(purchaseOrdersData || []);
      this.operatingSystems.set(Array.isArray(operatingSystemsData) ? operatingSystemsData : operatingSystemsData?.content || []);
      this.osVersions.set(osVersionsData || []);
      this.vendors.set(vendorsData || []);
      this.statusOptions.set(statusOptionsData || []);

    } catch (error) {
      console.error('❌ Error loading initial data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private setupFormDependencies() {
    // Asset Category → Asset Type
    this.assetForm.get('assetCategory')?.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(category => {
        this.updateFieldVisibility(category);
        this.resetDependentFields(['assetTypeId', 'makeId', 'modelId']);
      });

    // Asset Type → Asset Make
    this.assetForm.get('assetTypeId')?.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(typeId => {
        if (typeId) {
          this.loadAssetMakesForType(typeId);
        }
        this.resetDependentFields(['makeId', 'modelId']);
      });

    // Asset Make → Asset Model
    this.assetForm.get('makeId')?.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(makeId => {
        if (makeId) {
          this.loadAssetModelsForMake(makeId);
        }
        this.resetDependentFields(['modelId']);
      });

    // Asset Model → Auto-fill details and ensure type consistency
    this.assetForm.get('modelId')?.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(modelId => {
        if (modelId) {
          this.ensureAssetTypeConsistency(modelId);
        }
      });

    // OS → OS Version
    this.assetForm.get('osId')?.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(osId => {
        this.resetDependentFields(['osVersionId']);
      });

    // PO Number → Auto-fill PO details
    this.assetForm.get('poNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged(), debounceTime(300))
      .subscribe(poNumber => {
        if (poNumber && this.config.context !== 'po') {
          this.loadPODetails(poNumber);
        }
      });
  }

  private updateFieldVisibility(category: string) {
    const isSoftware = category === 'SOFTWARE';
    const isHardware = category === 'HARDWARE';

    this.showSoftwareFields.set(isSoftware);
    this.showHardwareFields.set(isHardware);

    // Update validation rules based on category
    const licenseNameControl = this.assetForm.get('licenseName');
    const licenseValidityControl = this.assetForm.get('licenseValidityPeriod');

    if (isSoftware) {
      licenseNameControl?.setValidators([Validators.required]);
      licenseValidityControl?.setValidators([Validators.required]);
    } else {
      licenseNameControl?.clearValidators();
      licenseValidityControl?.clearValidators();
    }

    licenseNameControl?.updateValueAndValidity();
    licenseValidityControl?.updateValueAndValidity();
  }

  private resetDependentFields(fields: string[]) {
    fields.forEach(field => {
      this.assetForm.get(field)?.setValue('');
    });
  }

  private async loadAssetMakesForType(typeId: number) {
    this.makesLoading.set(true);
    try {
      const makes = await this.assetMakeService.getAssetMakesByType(typeId).toPromise();
      console.log('✅ Asset Makes loaded for type ID', typeId, ':', makes);
    } catch (error) {
      console.error('❌ Error loading makes for type:', error);
    } finally {
      this.makesLoading.set(false);
    }
  }

  private async loadAssetModelsForMake(makeId: number) {
    this.modelsLoading.set(true);
    try {
      const models = await this.assetModelService.getAssetModelsByMake(makeId).toPromise();
      console.log('✅ Asset Models loaded for make ID', makeId, ':', models);
    } catch (error) {
      console.error('❌ Error loading models for make:', error);
    } finally {
      this.modelsLoading.set(false);
    }
  }

  private ensureAssetTypeConsistency(modelId: number) {
    console.log('🔧 [FORM CONSISTENCY] Ensuring asset type consistency for model ID:', modelId);
    
    // Find the selected model
    const selectedModel = this.filteredAssetModels().find(model => model.id === modelId);
    if (selectedModel) {
      // Find the make for this model
      const selectedMake = this.assetMakes().find(make => make.id === selectedModel.makeId);
      if (selectedMake) {
        // Ensure the asset type is set correctly
        const currentTypeId = this.assetForm.get('assetTypeId')?.value;
        if (currentTypeId != selectedMake.typeId) {
          console.log('🔧 [FORM CONSISTENCY] Auto-correcting asset type from', currentTypeId, 'to', selectedMake.typeId);
          this.assetForm.patchValue({ assetTypeId: selectedMake.typeId });
        }
      }
    }
  }

  private async loadPODetails(poNumber: string) {
    try {
      // Find PO by number from our loaded POs
      const poDetails = this.purchaseOrders().find(po => po.poNumber === poNumber);
      if (poDetails) {
        this.assetForm.patchValue({
          invoiceNumber: poDetails.invoiceNumber,
          acquisitionDate: poDetails.acquisitionDate,
          ownerType: poDetails.ownerType,
          acquisitionType: poDetails.acquisitionType,
          vendorId: poDetails.vendorId,
          rentalAmount: poDetails.rentalAmount,
          acquisitionPrice: poDetails.acquisitionPrice,
          depreciationPct: poDetails.depreciationPct,
          currentPrice: poDetails.currentPrice,
          minContractPeriod: poDetails.minContractPeriod,
          leaseEndDate: poDetails.leaseEndDate
        });
        console.log('✅ PO details loaded for', poNumber);
      }
    } catch (error) {
      console.error('❌ Error loading PO details:', error);
    }
  }

  // Helper methods for templates
  getFieldError(fieldName: string): string | null {
    const field = this.assetForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
      if (field.errors?.['minlength']) return `${this.getFieldDisplayName(fieldName)} is too short`;
      if (field.errors?.['maxlength']) return `${this.getFieldDisplayName(fieldName)} is too long`;
      if (field.errors?.['min']) return `${this.getFieldDisplayName(fieldName)} must be greater than 0`;
    }
    return null;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: {[key: string]: string} = {
      name: 'Asset Name',
      serialNumber: 'Serial Number',
      assetCategory: 'Asset Category',
      assetTypeId: 'Asset Type',
      makeId: 'Asset Make',
      modelId: 'Asset Model',
      licenseName: 'License Name',
      licenseValidityPeriod: 'License Expiry Date'
    };
    return displayNames[fieldName] || fieldName;
  }

  getAssetTypeName(id: number): string {
    return this.assetTypes().find(type => type.id === id)?.assetTypeName || 'Unknown';
  }

  getAssetMakeName(id: number): string {
    return this.assetMakes().find(make => make.id === id)?.name || 'Unknown';
  }

  getAssetModelName(id: number): string {
    return this.assetModels().find(model => model.id === id)?.name || 'Unknown';
  }

  getOSName(id: number): string {
    return this.operatingSystems().find(os => os.id === id)?.osType || 'Unknown';
  }

  getname(id: number): string {
    return this.vendors().find(vendor => vendor.vendorId === id)?.name || 'Unknown';
  }

  getUserName(id: number): string {
    return this.users().find(user => user.id === id)?.fullNameOrOfficeName || 'Unknown';
  }

  isPONumberEditable(): boolean {
    return this.config.context !== 'po';
  }

  onSubmit() {
    if (this.assetForm.valid) {
      this.submitting.set(true);
      const formValue = { ...this.assetForm.value };
      
      // Convert date strings back to proper format
      if (formValue.warrantyExpiry) {
        formValue.warrantyExpiry = new Date(formValue.warrantyExpiry).toISOString();
      }
      if (formValue.licenseValidityPeriod) {
        formValue.licenseValidityPeriod = new Date(formValue.licenseValidityPeriod).toISOString();
      }

      // Convert string IDs to numbers where needed
      const numericFields = ['assetTypeId', 'makeId', 'modelId', 'osId', 'osVersionId', 'currentUserId', 'vendorId'];
      numericFields.forEach(field => {
        if (formValue[field] && formValue[field] !== '') {
          formValue[field] = Number(formValue[field]);
        }
      });

      console.log('✅ [FORM SUBMIT] Submitting asset form with data:', formValue);
      this.formSubmit.emit(formValue);
      this.submitting.set(false);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.assetForm.controls).forEach(key => {
        this.assetForm.get(key)?.markAsTouched();
      });
      console.log('❌ [FORM SUBMIT] Form is invalid, marking all fields as touched');
    }
  }

  onCancel() {
    this.formCancel.emit();
  }
} 