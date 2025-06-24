import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AssetService } from '../../services/asset.service';
import { ConfigurationService, StatusOption, OwnerTypeOption, AcquisitionTypeOption, AssetConfigSettings, DefaultValues } from '../../services/configuration.service';
import { 
  AssetDTO, 
  BulkAssetCreationResponse,
  AssetType,
  AssetMake,
  AssetModel,
  Vendor,
  User,
  OperatingSystem,
  OSVersion,
  ASSET_STATUS,
  OWNER_TYPE,
  ACQUISITION_TYPE
} from '../../models/asset.model';

@Component({
  selector: 'app-bulk-asset-creation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './bulk-asset-creation.component.html',
  styleUrls: ['./bulk-asset-creation.component.css']
})
export class BulkAssetCreationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Form management
  bulkAssetForm!: FormGroup;
  isSubmitting = false;
  
  // Dropdown data
  assetTypes: AssetType[] = [];
  assetMakes: AssetMake[] = [];
  assetModels: AssetModel[] = [];
  vendors: Vendor[] = [];
  users: User[] = [];
  operatingSystems: OperatingSystem[] = [];
  osVersions: OSVersion[] = [];
  
  // Dynamic configuration options
  statusOptions: StatusOption[] = [];
  ownerTypeOptions: OwnerTypeOption[] = [];
  acquisitionTypeOptions: AcquisitionTypeOption[] = [];
  assetConfig: AssetConfigSettings | null = null;
  defaultValues: DefaultValues | null = null;
  
  // Messages
  successMessage = '';
  errorMessage = '';
  showSuccessMessage = false;
  showErrorMessage = false;

  constructor(
    private fb: FormBuilder,
    private assetService: AssetService,
    private configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.loadConfiguration();
    this.initializeForm();
    this.loadDropdownData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load configuration from database
   */
  private loadConfiguration(): void {
    this.configService.loadConfiguration().subscribe({
      next: (config) => {
        this.statusOptions = this.configService.getAssetStatuses();
        this.ownerTypeOptions = this.configService.getOwnerTypes();
        this.acquisitionTypeOptions = this.configService.getAcquisitionTypes();
        this.assetConfig = this.configService.getAssetConfig();
        this.defaultValues = this.configService.getDefaultValues();
      },
      error: (error) => {
        console.error('Failed to load configuration:', error);
        // Continue with hardcoded fallback values
      }
    });
  }

  /**
   * ✅ Initialize the form with FormArray for multiple assets
   */
  private initializeForm(): void {
    this.bulkAssetForm = this.fb.group({
      assets: this.fb.array([])
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
   * ✅ Add multiple asset forms at once
   */
  addAssetForms(count: number): void {
    for (let i = 0; i < count; i++) {
      this.addAssetForm();
    }
  }

  /**
   * ✅ Add a single asset form to the FormArray
   */
  addAssetForm(): void {
    // Get dynamic configuration values
    const config = this.assetConfig || { minNameLength: 2, minSerialLength: 2 };
    const defaults = this.defaultValues || { 
      defaultStatus: 'IN_STOCK', 
      defaultOwnerType: 'CELCOM', 
      defaultAcquisitionType: 'BOUGHT' 
    };
    
    const assetForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(config.minNameLength)]],
      serialNumber: ['', [Validators.required, Validators.minLength(config.minSerialLength)]],
      typeId: [null],
      makeId: [null],
      modelId: [null],
      itAssetCode: [''],
      macAddress: ['', Validators.pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)],
      ipv4Address: ['', Validators.pattern(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)],
      status: [defaults.defaultStatus, Validators.required],
      ownerType: [defaults.defaultOwnerType, Validators.required],
      acquisitionType: [defaults.defaultAcquisitionType, Validators.required],
      currentUserId: [null],
      inventoryLocation: [''],
      osId: [null],
      osVersionId: [null],
      poNumber: [''],
      invoiceNumber: [''],
      acquisitionDate: [''],
      warrantyExpiry: [''],
      extendedWarrantyExpiry: [''],
      leaseEndDate: [''],
      vendorId: [null],
      extendedWarrantyVendorId: [null],
      rentalAmount: [null, [Validators.min(0)]],
      acquisitionPrice: [null, [Validators.min(0)]],
      depreciationPct: [0, [Validators.min(0), Validators.max(100)]],
      currentPrice: [null, [Validators.min(0)]],
      minContractPeriod: [null, [Validators.min(1)]],
      tags: ['']
    });

    this.assetsFormArray.push(assetForm);
  }

  /**
   * ✅ Remove an asset form from the FormArray
   */
  removeAssetForm(index: number): void {
    this.assetsFormArray.removeAt(index);
  }

  /**
   * ✅ Load all dropdown data
   */
  private async loadDropdownData(): Promise<void> {
    try {
      // Load all dropdown data in parallel
      const [assetTypes, assetMakes, assetModels, vendors, users, operatingSystems, osVersions] = await Promise.all([
        this.assetService.getAssetTypes().toPromise(),
        this.assetService.getAssetMakes().toPromise(),
        this.assetService.getAssetModels().toPromise(),
        this.assetService.getVendors().toPromise(),
        this.assetService.getUsers().toPromise(),
        this.assetService.getOperatingSystems().toPromise(),
        this.assetService.getOSVersions().toPromise()
      ]);

      this.assetTypes = assetTypes || [];
      this.assetMakes = assetMakes || [];
      this.assetModels = assetModels || [];
      this.vendors = vendors || [];
      this.users = users || [];
      this.operatingSystems = operatingSystems || [];
      this.osVersions = osVersions || [];
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      this.showError('Failed to load form data. Please refresh the page.');
    }
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

    if (this.assetsFormArray.length === 0) {
      this.showError('Please add at least one asset to create.');
      return;
    }

    this.isSubmitting = true;
    this.clearMessages();

    // ✅ Transform FormArray data to AssetDTO[]
    const assetsToCreate: AssetDTO[] = this.serializeAssetsFromForm();
    
    // ✅ Debug logging before sending
    console.group('📤 Frontend Form Serialization');
    console.log('📊 Form data summary:', {
      totalAssets: assetsToCreate.length,
      validForms: this.assetsFormArray.controls.filter(ctrl => ctrl.valid).length,
      invalidForms: this.assetsFormArray.controls.filter(ctrl => ctrl.invalid).length
    });
    console.log('🔍 Serialized assets (before service call):', assetsToCreate);
    console.groupEnd();

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
   * ✅ ENHANCED: Serialize FormArray data to AssetDTO array with trimming
   * This ensures the data is in the exact format expected by the backend
   */
  private serializeAssetsFromForm(): AssetDTO[] {
    const formValue = this.bulkAssetForm.value;
    const assetsFromForm = formValue.assets || [];

    return assetsFromForm.map((asset: any, index: number) => {
      // Create a clean DTO object with only the required fields
      const dto: AssetDTO = {
        name: this.trimString(asset.name),
        serialNumber: this.trimString(asset.serialNumber),
        assetCategory: asset.assetCategory || 'HARDWARE',
        status: asset.status,
        ownerType: asset.ownerType,
        acquisitionType: asset.acquisitionType
      };

      // ✅ Add optional fields only if they have values (with string trimming)
      if (asset.typeId) dto.typeId = asset.typeId;
      if (asset.makeId) dto.makeId = asset.makeId;
      if (asset.modelId) dto.modelId = asset.modelId;
      if (asset.itAssetCode) dto.itAssetCode = this.trimString(asset.itAssetCode);
      if (asset.macAddress) dto.macAddress = this.trimString(asset.macAddress);
      if (asset.ipv4Address) dto.ipv4Address = this.trimString(asset.ipv4Address);
      if (asset.currentUserId) dto.currentUserId = asset.currentUserId;
      if (asset.inventoryLocation) dto.inventoryLocation = this.trimString(asset.inventoryLocation);
      if (asset.osId) dto.osId = asset.osId;
      if (asset.osVersionId) dto.osVersionId = asset.osVersionId;
      if (asset.poNumber) dto.poNumber = this.trimString(asset.poNumber);
      if (asset.invoiceNumber) dto.invoiceNumber = this.trimString(asset.invoiceNumber);
      if (asset.acquisitionDate) dto.acquisitionDate = asset.acquisitionDate;
      if (asset.warrantyExpiry) dto.warrantyExpiry = asset.warrantyExpiry;
      if (asset.extendedWarrantyExpiry) dto.extendedWarrantyExpiry = asset.extendedWarrantyExpiry;
      if (asset.leaseEndDate) dto.leaseEndDate = asset.leaseEndDate;
      if (asset.vendorId) dto.vendorId = asset.vendorId;
      if (asset.extendedWarrantyVendorId) dto.extendedWarrantyVendorId = asset.extendedWarrantyVendorId;
      if (asset.rentalAmount !== null && asset.rentalAmount !== undefined) dto.rentalAmount = asset.rentalAmount;
      if (asset.acquisitionPrice !== null && asset.acquisitionPrice !== undefined) dto.acquisitionPrice = asset.acquisitionPrice;
      if (asset.depreciationPct !== null && asset.depreciationPct !== undefined) dto.depreciationPct = asset.depreciationPct;
      if (asset.currentPrice !== null && asset.currentPrice !== undefined) dto.currentPrice = asset.currentPrice;
      if (asset.minContractPeriod !== null && asset.minContractPeriod !== undefined) dto.minContractPeriod = asset.minContractPeriod;
      if (asset.tags) dto.tags = this.trimString(asset.tags);

      // ✅ Debug logging for first asset
      if (index === 0) {
        console.log(`🧹 Asset ${index + 1} string trimming example:`, {
          originalName: `"${asset.name}"`,
          trimmedName: `"${dto.name}"`,
          originalSerial: `"${asset.serialNumber}"`,
          trimmedSerial: `"${dto.serialNumber}"`,
          finalDTO: dto
        });
      }

      return dto;
    });
  }

  /**
   * ✅ NEW: String trimming utility for form fields
   * Removes leading/trailing whitespace, tabs, newlines, etc.
   */
  private trimString(value: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }
    
    // Comprehensive trimming: whitespace, tabs, newlines, carriage returns
    return value
      .trim()                    // Basic whitespace
      .replace(/^\s+|\s+$/g, '') // Extra whitespace patterns
      .replace(/\t/g, ' ')       // Convert tabs to spaces
      .replace(/\n/g, ' ')       // Convert newlines to spaces
      .replace(/\r/g, ' ')       // Convert carriage returns to spaces
      .replace(/\s+/g, ' ')      // Collapse multiple spaces to single space
      .trim();                   // Final trim
  }

  /**
   * ✅ Handle successful bulk creation
   */
  private handleBulkCreationSuccess(response: BulkAssetCreationResponse): void {
    this.isSubmitting = false;
    
    let message = `Successfully created ${response.successCount} assets.`;
    
    if (response.failedAssets && response.failedAssets.length > 0) {
      message += ` ${response.failedAssets.length} failed to create.`;
      console.warn('Failed assets:', response.failedAssets);
    }

    this.showSuccess(message);
    
    // Reset form on success
    this.resetForm();
  }

  /**
   * ✅ Handle bulk creation errors
   */
  private handleBulkCreationError(error: any): void {
    this.isSubmitting = false;
    console.error('Bulk asset creation failed:', error);
    
    let errorMessage = 'Failed to create assets. ';
    if (error.error?.message) {
      errorMessage += error.error.message;
    } else if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += 'Please try again.';
    }
    
    this.showError(errorMessage);
  }

  /**
   * ✅ Reset the form to initial state
   */
  resetForm(): void {
    this.bulkAssetForm.reset();
    this.assetsFormArray.clear();
    this.addAssetForms(3); // Start with 3 forms again
    this.clearMessages();
  }

  /**
   * ✅ Mark all forms as touched to show validation errors
   */
  private markAllFormsTouched(): void {
    this.bulkAssetForm.markAllAsTouched();
    this.assetsFormArray.controls.forEach(control => {
      control.markAllAsTouched();
    });
  }

  // Utility methods for form validation
  hasAssetFieldError(index: number, fieldName: string): boolean {
    const control = this.assetsFormArray.at(index).get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getAssetFieldError(index: number, fieldName: string): string {
    const control = this.assetsFormArray.at(index).get(fieldName);
    
    if (control?.errors) {
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['minlength']) return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
      if (control.errors['pattern']) return `${fieldName} format is invalid`;
      if (control.errors['min']) return `${fieldName} must be greater than ${control.errors['min'].min}`;
      if (control.errors['max']) return `${fieldName} must be less than ${control.errors['max'].max}`;
    }
    return '';
  }

  // Message handling
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessMessage = true;
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 5000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.showErrorMessage = true;
    setTimeout(() => {
      this.showErrorMessage = false;
    }, 5000);
  }

  private clearMessages(): void {
    this.showSuccessMessage = false;
    this.showErrorMessage = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  // Template helper methods
  getAssetTypeName(id: number): string {
    const type = this.assetTypes.find(t => t.id === id);
    return type ? type.name : '';
  }

  getMakeName(id: number): string {
    const make = this.assetMakes.find(m => m.id === id);
    return make ? make.name : '';
  }

  getModelName(id: number): string {
    const model = this.assetModels.find(m => m.id === id);
    return model ? model.name : '';
  }

  getname(id: number): string {
    const vendor = this.vendors.find(v => v.id === id);
    return vendor ? vendor.name : '';
  }

  getUserName(id: number): string {
    const user = this.users.find(u => u.id === id);
    return user ? user.name : '';
  }

  getOSName(id: number): string {
    const os = this.operatingSystems.find(o => o.id === id);
    return os ? os.name : '';
  }

  getOSVersionName(id: number): string {
    const version = this.osVersions.find(v => v.id === id);
    return version ? version.name : '';
  }
} 