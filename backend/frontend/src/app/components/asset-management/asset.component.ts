import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ChangeDetectionStrategy, 
  ChangeDetectorRef,
  ViewChild,
  TemplateRef,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { SelectionModel } from '@angular/cdk/collections';
import { LayoutComponent, NavigationItem } from '../shared/layout/layout.component';

import { Observable, Subject, BehaviorSubject, combineLatest, merge, EMPTY, of } from 'rxjs';
import { takeUntil, finalize, catchError, map, tap, debounceTime, distinctUntilChanged, startWith, filter, switchMap } from 'rxjs/operators';

import { AssetService } from '../../services/asset.service';
import { AssignmentService } from '../../services/assignment.service';
import { ConfigurationService, StatusOption, OwnerTypeOption, AcquisitionTypeOption, AssetConfigSettings, DefaultValues } from '../../services/configuration.service';
import { ClientSideFilterService } from '../../services/client-side-filter.service';
import { AssetTypeService } from '../../services/asset-type.service';
import { AssetMakeService } from '../../services/asset-make.service';
import { AssetModelService } from '../../services/asset-model.service';
import { AssetPoService } from '../../services/asset-po.service';
import { AssetType as AssetTypeModel } from '../../models/asset-type.model';
import { AssetMake as AssetMakeModel } from '../../models/asset-make.model';
import { AssetModel as AssetModelModel } from '../../models/asset-model.model';

import { 
  Asset, 
  AssetFilter, 
  AssetFilterOptions,
  ClientSideFilterOptions,
  AssetWithFilterData,
  PageResponse,
  AssetType,
  AssetMake,
  AssetModel,
  AssetModelWithDetails,
  AssetModelDetails,
  VendorWarrantyDetails,
  PODetails,
  Vendor,
  User,
  OperatingSystem,
  OSVersion,
  PurchaseOrder,
  AssetPODTO,
  AssetStatusHistory,
  AssetStatusHistoryDTO,
  AssetStatusChangeRequest,
  AssetStatusChangeResponse,
  ASSET_STATUS,
  ASSET_STATUS_DISPLAY,
  ASSET_STATUS_FILTER,
  ASSET_STATUS_FILTER_DISPLAY,
  OWNER_TYPE,
  ACQUISITION_TYPE,
  ASSET_MESSAGES,
  ASSET_CONFIG,
  AssetUserAssignment,
  AssetUserAssignmentRequest,
  AssetUserAssignmentDTO,
  AssetAssignmentHistoryDTO,
  AssetTag,
  AssetTagAssignment,
  AssetTagAssignmentRequest,
  AssetTagAssignmentDTO,
  AssetTagAssignmentByNameDTO,
  ActiveUser,
  ASSET_CATEGORY,
  ASSET_CATEGORY_DISPLAY,
  WARRANTY_STATUS,
  LICENSE_STATUS,
  AssetHelper
} from '../../models/asset.model';
import { AssetPo } from '../../models/asset-po.model';
import { StatusHistoryModalComponent } from './status-history-modal/status-history-modal.component';
import { AssignmentHistoryModalComponent } from './assignment-history-modal/assignment-history-modal.component';

// Software Assignment Interface
interface SoftwareAssignee {
  id: string;
  name: string;
  type: 'user' | 'office';
  email?: string;
  department?: string;
  userType?: string;
}

@Component({
  selector: 'app-asset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatFormFieldModule,
    MatCardModule,
    MatDividerModule,
    ScrollingModule,

    LayoutComponent,
    StatusHistoryModalComponent,
    AssignmentHistoryModalComponent
  ],
  templateUrl: './asset.component.html',
  styleUrl: './asset.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetComponent implements OnInit, OnDestroy {
  @ViewChild('assetFormModal') assetFormModal!: TemplateRef<any>;
  @ViewChild(CdkVirtualScrollViewport) virtualScrollViewport!: CdkVirtualScrollViewport;

  // Navigation
  navigationItems: NavigationItem[] = [];

  // ✅ CLIENT-SIDE FILTERING: Updated signals
  loading = signal(false);
  clientSideLoading = computed(() => this.clientFilterService.loading$());
  allAssets = computed(() => this.clientFilterService.getDataStore().assets);
  filteredAssets = computed(() => this.clientFilterService.filteredAssets());
  totalAssets = computed(() => this.clientFilterService.totalFilteredAssets());
  hasActiveFilters = computed(() => this.clientFilterService.hasActiveFilters());
  filterSummary = computed(() => this.clientFilterService.filterSummary());
  dropdownOptions = computed(() => this.clientFilterService.dropdownOptions());

  // Pagination for client-side filtering
  currentPage = signal(0);
  pageSize = signal(ASSET_CONFIG.PAGE_SIZE);
  paginatedAssets = computed(() => {
    const filtered = this.filteredAssets();
    const start = this.currentPage() * this.pageSize();
    const end = start + this.pageSize();
    return filtered.slice(start, end);
  });

  // Form and UI state
  isFormModalOpen = signal(false);
  selectedAsset = signal<AssetWithFilterData | null>(null);
  isEditMode = signal(false);

  // Status change functionality signals
  statusChangeLoading = signal(false);
  statusHistoryLoading = signal(false);
  statusHistory = signal<AssetStatusHistory[]>([]);
  statusChangeError = signal<string | null>(null);
  showStatusHistory = signal(false);
  showStatusChangeModal = signal(false);
  selectedAssetForStatusChange = signal<AssetWithFilterData | null>(null);
  pendingStatusChange = signal<string>('');

  // Unassignment confirmation modal for Active status changes
  showUnassignmentConfirmModal = signal(false);
  pendingUnassignmentAsset = signal<AssetWithFilterData | null>(null);
  pendingUnassignmentStatus = signal<string>('');

  // Status History Modal state
  showStatusHistoryModal = signal(false);
  statusHistoryModalAsset = signal<{ id: number; name: string; serial: string } | null>(null);

  // Software Assignment state
  selectedAssignees = signal<SoftwareAssignee[]>([]);
  assigneeSearchTerm = '';
  showAssigneeDropdown = signal(false);
  availableAssignees = signal<SoftwareAssignee[]>([]);
  filteredAssigneeOptions = computed(() => {
    const searchTerm = this.assigneeSearchTerm.toLowerCase();
    const available = this.availableAssignees();
    const selected = this.selectedAssignees();
    
    return available.filter(assignee => 
      !selected.some(s => s.id === assignee.id) &&
      (assignee.name.toLowerCase().includes(searchTerm) ||
       assignee.email?.toLowerCase().includes(searchTerm) ||
       assignee.department?.toLowerCase().includes(searchTerm))
    );
  });

  // User Assignment state
  showUserAssignmentModal = signal(false);
  selectedAssetForUserAssignment = signal<AssetWithFilterData | null>(null);
  currentUserAssignment = signal<AssetUserAssignment | null>(null);
  activeUsers = signal<ActiveUser[]>([]);
  filteredUsers = signal<ActiveUser[]>([]);
  userFilter = signal<string>('');
  userAssignmentLoading = signal(false);
  userAssignmentError = signal<string | null>(null);
  userAssignmentForm!: FormGroup;

  // Tag Assignment state
  showTagAssignmentModal = signal(false);
  selectedAssetForTagAssignment = signal<AssetWithFilterData | null>(null);
  availableTags = signal<AssetTag[]>([]);
  assignedTags = signal<AssetTagAssignment[]>([]);
  tagAssignmentLoading = signal(false);
  tagAssignmentError = signal<string | null>(null);
  selectedTagsForAssignment = signal<number[]>([]);

  // Inline "Add Tag" state
  showAddTagInline = signal(false);
  newTagName = signal<string>('');
  addTagLoading = signal(false);
  addTagError = signal<string | null>(null);

  // UI state for collapsible sections
  editableSections = signal<Map<number, boolean>>(new Map());
  poSections = signal<Map<number, boolean>>(new Map());

  // Asset Category Management
  showSoftwareFields = signal(false);
  showHardwareFields = signal(true);
  selectedAssetCategory = signal<string>('HARDWARE');
  
  // Asset category constants for template
  ASSET_CATEGORY = ASSET_CATEGORY;
  ASSET_CATEGORY_DISPLAY = ASSET_CATEGORY_DISPLAY;

  // Assignment History Modal
  showAssignmentHistoryModal = signal(false);
  selectedAssetForAssignmentHistory = signal<AssetWithFilterData | null>(null);
  assignmentHistory = signal<AssetUserAssignment[]>([]);
  assignmentHistoryLoading = signal(false);

  // PO Details Modal
  showPODetailsModal = signal(false);
  selectedPOForDetails = signal<string>('');
  selectedPODetails = signal<PODetails | null>(null);

  // ✅ CLIENT-SIDE FILTERING: New filter form
  clientFilterForm!: FormGroup;

  // Legacy properties for backward compatibility
  models = computed(() => this.dropdownOptions().models);
  statusDropdownOptions = computed(() => this.dropdownOptions().statuses);
  statusFilterDropdownOptions = computed(() => [
    { code: '', name: 'All' },
    ...this.dropdownOptions().statuses.map(s => ({ code: s.value, name: s.label }))
  ]);

  hasSelectedAssets = computed(() => this.selection.selected.length > 0);
  selectedCount = computed(() => this.selection.selected.length);

  // Forms
  assetForm!: FormGroup;
  filterForm!: FormGroup; // Legacy form for compatibility
  currentFilters = signal<AssetFilterOptions>({});
  
  // Selection
  selection = new SelectionModel<AssetWithFilterData>(true, []);
  
  // Data signals (legacy, now using client filter service)
  assetTypes = signal<AssetType[]>([]);
  
  // 🔥 NEW: Cascading dropdown signals
  filteredAssetTypes = signal<AssetTypeModel[]>([]);
  assetMakes = signal<AssetMakeModel[]>([]);
  filteredAssetMakes = signal<AssetMakeModel[]>([]);
  filteredAssetModels = signal<AssetModelModel[]>([]);
  
  // Loading states for cascading dropdowns
  assetTypesLoading = signal(false);
  assetMakesLoading = signal(false);
  assetModelsLoading = signal(false);
  
  // Error states for cascading dropdowns
  assetTypesError = signal<string | null>(null);
  assetMakesError = signal<string | null>(null);
  assetModelsError = signal<string | null>(null);
  
  assetModelsWithDetails = computed(() => this.clientFilterService.getDataStore().assetModels);
  vendors = computed(() => this.clientFilterService.getDataStore().vendors);
  users = computed(() => this.clientFilterService.getDataStore().users);
  operatingSystems = computed(() => this.clientFilterService.getDataStore().operatingSystems);
  osVersions = computed(() => this.clientFilterService.getDataStore().osVersions);
  filteredOSVersions = signal<OSVersion[]>([]);
  purchaseOrders = signal<PurchaseOrder[]>([]);
  
  // Legacy signals for backward compatibility
  assets = computed(() => this.filteredAssets());
  totalAssetsCount = computed(() => this.totalAssets());

  // Additional state
  selectedAssetType = signal<string>('');
  selectedAssetMake = signal<string>('');
  selectedVendor = signal<string>('');
  selectedExtendedWarrantyVendor = signal<string>('');
  selectedOSName = signal<string>('');
  
  // Loading states
  osVersionsLoading = signal(false);
  modelDetailsLoading = signal(false);
  poDetailsLoading = signal(false);
  vendorWarrantyLoading = signal(false);
  operatingSystemsLoading = signal(false);
  
  // Error states
  osVersionsError = signal<string | null>(null);
  modelDetailsError = signal<string | null>(null);
  poDetailsError = signal<string | null>(null);
  vendorWarrantyError = signal<string | null>(null);
  operatingSystemsError = signal<string | null>(null);
  poErrorMessage = signal<string | null>(null);
  
  // Current OS versions
  currentOSVersions = signal<OSVersion[]>([]);
  
  // Configuration
  statusOptions = signal<StatusOption[]>([]);
  statusFilterOptions = signal<StatusOption[]>([]);
  ownerTypeOptions = signal<OwnerTypeOption[]>([]);
  ownerTypeFilterOptions = signal<OwnerTypeOption[]>([]);
  acquisitionTypeOptions = signal<AcquisitionTypeOption[]>([]);
  acquisitionTypeFilterOptions = signal<AcquisitionTypeOption[]>([]);
  assetConfig = signal<AssetConfigSettings | null>(null);
  defaultValues = signal<DefaultValues | null>(null);

  // Computed properties
  isActiveStatus = computed(() => {
    const asset = this.selectedAsset();
    return asset?.status === ASSET_STATUS.ACTIVE;
  });

  readonly displayedColumns = [
    'select', 'assetDetails', 'model', 'osVersion', 
    'poNumber', 'status', 'assignment', 'actions'
  ];
  
  itemSize = computed(() => this.assetConfig()?.itemSize || 80);

  // Make Math available in template
  Math = Math;

  // Reactive subjects
  private destroy$ = new Subject<void>();
  private searchSubject = new BehaviorSubject<string>('');
  private filterSubject = new BehaviorSubject<AssetFilterOptions>({});

  // Services
  private assetService = inject(AssetService);
  private assignmentService = inject(AssignmentService);
  private configService = inject(ConfigurationService);
  private clientFilterService = inject(ClientSideFilterService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  
  // 🔥 NEW: Services for cascading dropdowns
  private assetTypeService = inject(AssetTypeService);
  private assetMakeService = inject(AssetMakeService);
  private assetModelService = inject(AssetModelService);
  private assetPoService = inject(AssetPoService);

  // Add submission loading state
  submissionLoading = signal(false);

  constructor() {
    this.initializeNavigation();
  }

  ngOnInit(): void {
    this.loadConfiguration();
    this.initializeForms();
    this.setupClientSideFiltering();
    this.loadInitialAssignmentData();
    
    // Load all data for client-side filtering
    this.loadAllDataForFiltering();
  }

  // ✅ NEW: Client-side filtering setup
  private setupClientSideFiltering(): void {
    console.log('🔧 Setting up client-side filtering...');
    
    // Initialize client filter form
    this.clientFilterForm = this.fb.group({
      status: [''],
      modelName: [''],
      currentUserName: [''],
      osName: ['']
    });

    // Setup debounced form changes
    this.clientFilterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(filters => {
      console.log('🔍 Client filter form changed:', filters);
      this.clientFilterService.updateFilters(filters);
      this.currentPage.set(0); // Reset to first page when filters change
    });
  }

  // ✅ NEW: Load all data for client-side filtering
  private loadAllDataForFiltering(): void {
    console.log('📊 Loading complete dataset for client-side filtering...');
    
    this.clientFilterService.loadAllData().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (dataStore) => {
        console.log('✅ Complete dataset loaded for client-side filtering:', {
          assets: dataStore.assets.length,
          users: dataStore.users.length,
          vendors: dataStore.vendors.length,
          models: dataStore.assetModels.length
        });
        
        // Load available assignees for software assignment
        this.loadAvailableAssignees();
        this.setupSoftwareAssignmentListeners();
        this.setupLicenseUserDropdownListeners();
        
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('❌ Error loading data for client-side filtering:', error);
        this.showError('Failed to load data for filtering');
      }
    });
  }

  private initializeNavigation(): void {
    this.navigationItems = [
      {
        label: 'Dashboard',
        route: '/dashboard',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10z"></path>
        </svg>`
      },
      {
        label: 'Assets',
        route: '/assets',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>`
      },
      {
        label: 'Asset Models',
        route: '/asset-models',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>`
      },
      {
        label: 'Asset POs',
        route: '/asset-pos',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>`
      },
      {
        label: 'Vendors',
        route: '/vendors',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>`
      },
      {
        label: 'OS & Versions',
        route: '/os-versions',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>`
      },
      {
        label: 'Users',
        route: '/users',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
        </svg>`
      }
    ];
  }

  onNavigationClick(item: NavigationItem): void {
    console.log('Navigation clicked:', item);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Configuration loading
  private loadConfiguration(): void {
    this.configService.loadConfiguration().subscribe({
      next: (config) => {
        this.statusOptions.set(this.configService.getAssetStatuses());
        this.statusFilterOptions.set(this.configService.getAssetStatusesForFilter());
        this.ownerTypeOptions.set(this.configService.getOwnerTypes());
        this.ownerTypeFilterOptions.set(this.configService.getOwnerTypesForFilter());
        this.acquisitionTypeOptions.set(this.configService.getAcquisitionTypes());
        this.acquisitionTypeFilterOptions.set(this.configService.getAcquisitionTypesForFilter());
        this.assetConfig.set(this.configService.getAssetConfig());
        this.defaultValues.set(this.configService.getDefaultValues());
        
        // Update page size from configuration
        const configSettings = this.configService.getAssetConfig();
        this.pageSize.set(configSettings.pageSize as any);
        
        // Reinitialize forms with dynamic configuration
        this.initializeForms();
      },
      error: (error) => {
        console.error('Failed to load configuration:', error);
        // Fallback to current hardcoded values if configuration fails
        this.initializeForms();
      }
    });
  }

  // Initialization
  private initializeForms(): void {
    this.assetForm = this.fb.group({
      assetId: [''],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      serialNumber: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      assetCategory: ['HARDWARE', [Validators.required]],
      typeId: ['', [Validators.required]],
      makeId: ['', [Validators.required]],
      modelId: ['', [Validators.required]],
      itAssetCode: ['', [Validators.maxLength(50)]],
      macAddress: [''],
      ipv4Address: ['', [this.ipv4Validator]],
      status: ['IN_STOCK', [Validators.required]],
      ownerType: ['Celcom', [Validators.required]],
      acquisitionType: ['Bought', [Validators.required]],
      currentUserId: [''],
      inventoryLocation: [''],
      osVersionId: [''],
      osId: [''],
      poNumber: [''], // Add PO Number field
      warrantyExpiry: [''],
      extendedWarrantyExpiry: [''],
      leaseEndDate: [''],
      vendorId: [''],
      extendedWarrantyVendorId: [''],
      rentalAmount: [''],
      acquisitionPrice: [''],
      depreciationPct: [''],
      currentPrice: [''],
      minContractPeriod: [''],
      tags: [''],
      // Software-specific fields
      licenseName: [''],
      licenseValidityPeriod: [''],

    });

    // Initialize client-side filter form
    this.clientFilterForm = this.fb.group({
      search: [''],
      status: [''],
      modelName: [''],
      currentUserName: [''],
      osName: [''],
      osVersionName: [''],
      name: [''],
      ownerType: [''],
      acquisitionType: [''],
      poNumber: [''],
      invoiceNumber: ['']
    });

    // Initialize user assignment form
    this.userAssignmentForm = this.fb.group({
      userId: [''],
      remarks: ['']
    });

    // Setup form dependencies and validations
    this.setupFormDependencies();
    this.updateFieldVisibilityAndValidation('HARDWARE');
  }

  /**
   * Update field visibility and validation based on asset category - Made public for template access
   */
  updateFieldVisibilityAndValidation(category: string): void {
    const isSoftware = category === 'SOFTWARE';
    const isHardware = category === 'HARDWARE';

    // Update visibility signals
    this.showSoftwareFields.set(isSoftware);
    this.showHardwareFields.set(isHardware);

    // Get form controls
    const typeControl = this.assetForm.get('typeId');
    const makeControl = this.assetForm.get('makeId');
    const modelControl = this.assetForm.get('modelId');
    const warrantyControl = this.assetForm.get('warrantyExpiry');
    const licenseNameControl = this.assetForm.get('licenseName');
    const licenseValidityControl = this.assetForm.get('licenseValidityPeriod');

    const currentUserIdControl = this.assetForm.get('currentUserId');
    const osIdControl = this.assetForm.get('osId');
    const osVersionIdControl = this.assetForm.get('osVersionId');
    const macAddressControl = this.assetForm.get('macAddress');
    const ipv4AddressControl = this.assetForm.get('ipv4Address');

    if (isSoftware) {
      // Software: Hide hardware fields, show software fields
      typeControl?.clearValidators(); // typeId not required for software
      makeControl?.clearValidators();
      modelControl?.clearValidators();
      warrantyControl?.clearValidators();
      currentUserIdControl?.clearValidators(); // User assignment not required for software
      osIdControl?.clearValidators();
      osVersionIdControl?.clearValidators();
      macAddressControl?.clearValidators();
      ipv4AddressControl?.clearValidators();
      
      // Make license fields required for software
      licenseNameControl?.setValidators([Validators.required]);
      licenseValidityControl?.setValidators([Validators.required]);
      
      
      // Clear hardware field values and reset cascading dropdowns
      this.assetForm.patchValue({
        typeId: '', 
        makeId: '',
        modelId: '',
        warrantyExpiry: '',
        currentUserId: '', // Clear user assignment for software
        osId: '',
        osVersionId: '',
        macAddress: '',
        ipv4Address: ''
      }, { emitEvent: false });
      
      // Clear cascading dropdown data for software
      this.filteredAssetTypes.set([]);
      this.filteredAssetMakes.set([]);
      this.filteredAssetModels.set([]);
      this.currentOSVersions.set([]);
      
    } else {
      // Hardware/Peripheral: Show hardware fields, hide software fields
      // For hardware, model selection is primary - type and make are auto-filled
      modelControl?.setValidators([Validators.required]); // modelId required for hardware
      currentUserIdControl?.setValidators([Validators.required]); // User assignment required for hardware
      // Other hardware fields are optional
      
      // Clear software field validators and values
      licenseNameControl?.clearValidators();
      licenseValidityControl?.clearValidators();
      
      
      this.assetForm.patchValue({
        licenseName: '',
        licenseValidityPeriod: '',
  
      }, { emitEvent: false });
      
      // Load asset models for hardware (no need to load types/makes separately)
      // Asset models are loaded from the client filter service
    }

    // Update validators
    typeControl?.updateValueAndValidity();
    makeControl?.updateValueAndValidity();
    modelControl?.updateValueAndValidity();
    warrantyControl?.updateValueAndValidity();
    licenseNameControl?.updateValueAndValidity();
    licenseValidityControl?.updateValueAndValidity();

    currentUserIdControl?.updateValueAndValidity();
    osIdControl?.updateValueAndValidity();
    osVersionIdControl?.updateValueAndValidity();
    macAddressControl?.updateValueAndValidity();
    ipv4AddressControl?.updateValueAndValidity();
  }

  private setupFormDependencies(): void {
    // 🔥 NEW: Asset Category → Conditional Field Display & Validation  
    this.assetForm.get('assetCategory')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged()
      )
      .subscribe(category => {
        this.selectedAssetCategory.set(category);
        this.updateFieldVisibilityAndValidation(category);
      });

    // 🔥 HARDWARE MODEL-DRIVEN FLOW: Asset Model → Auto-fill Type & Make
    // For hardware assets, users select model first, then type and make are auto-filled
    // This replaces the previous cascading type->make->model flow

    // 🔥 REAL-TIME: OS → OS Version dependent dropdown
    this.assetForm.get('osId')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged()
      )
      .subscribe(osId => {
        if (osId) {
          this.loadOSVersionsRealTime(osId);
        } else {
          // Clear OS versions when no OS is selected
          this.currentOSVersions.set([]);
          this.assetForm.patchValue({ osVersionId: '' }, { emitEvent: false });
          this.selectedOSName.set('');
          this.osVersionsError.set(null);
        }
      });

    // 🔥 FIXED: Asset Model → Auto-fill Asset Type & Make (Ensures Type ID is retained)
    this.assetForm.get('modelId')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged()
      )
      .subscribe(modelId => {
        if (modelId) {
          this.autoFillModelDetailsAndEnsureTypeConsistency(modelId);
        } else {
          // Clear auto-populated fields when no model is selected
          this.selectedAssetType.set('');
          this.selectedAssetMake.set('');
          this.modelDetailsError.set(null);
        }
      });

    // 🔥 REAL-TIME: PO Number → Auto-fill Acquisition Details
    // Note: Also handles manual (change) events via onPONumberChange method
    this.assetForm.get('poNumber')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(poNumber => {
        if (poNumber && poNumber.trim()) {
          this.autoFillPODetailsRealTime(poNumber.trim());
        } else {
          // Clear PO-related auto-populated fields
          this.clearPORelatedFields();
          this.poDetailsError.set(null);
          this.poErrorMessage.set(null);
        }
      });

    // 🔥 REAL-TIME: Vendor → Auto-fill Warranty Details
    this.assetForm.get('vendorId')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged()
      )
      .subscribe(vendorId => {
        if (vendorId) {
          this.autoFillVendorDetails(vendorId);
        } else {
          // Clear vendor-related auto-populated fields
          this.selectedVendor.set('');
          this.selectedExtendedWarrantyVendor.set('');
          this.vendorWarrantyError.set(null);
        }
      });

    // Auto-populate OS Name when OS Version is selected (display purposes)
    this.assetForm.get('osVersionId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(osVersionId => {
        if (osVersionId) {
          const osVersion = this.currentOSVersions().find(v => v.id === +osVersionId);
          if (osVersion) {
            this.selectedOSName.set(osVersion.name);
          }
        } else {
          this.selectedOSName.set('');
        }
      });
  }

  private setupReactiveSearch(): void {
    // Search functionality with debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      const currentFilters = this.currentFilters();
      this.currentFilters.set({ ...currentFilters, search: searchTerm });
      this.loadAssets();
    });

    // Filter changes
    this.filterSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(filters => {
      this.currentFilters.set(filters);
      this.loadAssets();
    });
  }

  private setupSubscriptions(): void {
    // Asset service subscriptions - now handled by clientFilterService
    // this.assetService.assets$
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(assets => {
    //     // Assets are now managed by clientFilterService
    //     this.cdr.markForCheck();
    //   });

    this.assetService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading.set(loading);
        this.cdr.markForCheck();
      });

    this.assetService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        if (error) {
          this.showError(error);
        }
      });

    // ✅ ENHANCED: Filter form changes with comprehensive mapping
    this.filterForm.valueChanges
      .pipe(
        startWith(this.filterForm.value),
        debounceTime(300),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntil(this.destroy$)
      )
      .subscribe(formValues => {
        console.log('🔍 Filter form changes detected:', formValues);
        
        // Map form values to filter options
        const mappedFilters: AssetFilterOptions = {
          // Quick search
          search: formValues.search?.trim() || undefined,
          
          // Status filters
          status: (formValues.status === 'ALL' || formValues.status === 'All' || !formValues.status) 
            ? undefined : formValues.status,
          
          // Asset Model filter
          model: formValues.model || undefined,
          
          // OS Version filter  
          osVersion: formValues.osVersion || undefined,
          
          // Assignment Status filter
          assignmentStatus: formValues.assignmentStatus || undefined,
          
          // Ownership filter
          ownership: (formValues.ownership === 'ALL' || formValues.ownership === 'All' || !formValues.ownership) 
            ? undefined : formValues.ownership,
            
          // Legacy filters (for backward compatibility)
          typeId: formValues.assetType || undefined,
          vendorId: formValues.vendor || undefined
        };
        
        // Remove undefined values to clean up the filter object
        const cleanFilters = Object.fromEntries(
          Object.entries(mappedFilters).filter(([_, value]) => value !== undefined && value !== '')
        ) as AssetFilterOptions;
        
        console.log('🔍 Mapped filters for backend:', cleanFilters);
        
        // Update current filters and trigger API call
        this.currentFilters.set(cleanFilters);
        this.currentPage.set(0); // Reset to first page when filters change
        this.loadAssets();
      });
  }

  // Data Loading
  private async loadInitialData(): Promise<void> {
    this.loading.set(true);
    
    try {
      // Load all required data in parallel for better performance
      const [
        assetTypesData,
        assetModelsData,
        vendorsData,
        usersData,
        operatingSystemsData,
        osVersionsData,
        purchaseOrdersData,
        assetPoData
      ] = await Promise.all([
        this.assetService.getAssetTypes().toPromise(),
        this.assetService.getAssetModelsWithDetails().toPromise(),
        this.assetService.getVendors().toPromise(),
        this.assetService.getUsers().toPromise(),
        this.assetService.getOperatingSystems().toPromise(),
        this.assetService.getOSVersions().toPromise(),
        this.assetService.getPurchaseOrders().toPromise(),
        this.assetPoService.getAllAssetPos().toPromise()
      ]);

      // Set the loaded data
      this.assetTypes.set(assetTypesData || []);
      
      // ✅ Enhanced PO loading: Combine regular POs and Asset POs
      const combinedPOs = [
        ...(purchaseOrdersData || []),
        ...(assetPoData || []).map(po => ({
          id: po.poId || 0,
          name: `${po.poNumber} - ${po.acquisitionType}`,
          poNumber: po.poNumber
        }) as PurchaseOrder)
      ];
      this.purchaseOrders.set(combinedPOs);
      // Note: assetModelsWithDetails, vendors, users, operatingSystems, osVersions 
      // are now computed from clientFilterService and don't need manual setting

      console.log('✅ Initial data loaded successfully');
      console.log('📊 Data summary:', {
        assetTypes: this.assetTypes().length,
        models: this.assetModelsWithDetails().length,
        vendors: this.vendors().length,
        users: this.users().length,
        operatingSystems: this.operatingSystems().length,
        osVersions: this.osVersions().length,
        purchaseOrders: this.purchaseOrders().length
      });

      // ✅ NEW: Load assignment data
      await this.loadInitialAssignmentData();

      // Load assets after all dependencies are loaded
      this.loadAssets();
      
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      this.showError('Failed to load initial data. Please refresh the page.');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * ✅ NEW: Load assignment-related data (users and tags)
   */
  private async loadInitialAssignmentData(): Promise<void> {
    try {
      const [activeUsersData, availableTagsData] = await Promise.all([
        this.assignmentService.getAllUsers().toPromise(), // Use getAllUsers() to get all active users
        this.assignmentService.getAvailableTags().toPromise()
      ]);

      this.activeUsers.set(activeUsersData || []);
      this.availableTags.set(availableTagsData || []);

      console.log('✅ Assignment data loaded:', {
        activeUsers: this.activeUsers().length,
        availableTags: this.availableTags().length
      });
      
      // Log user details for debugging
      if (this.activeUsers().length > 0) {
        console.log('📋 Available users for assignment:', this.activeUsers().map(u => ({ id: u.id, name: u.name })));
      } else {
        console.warn('⚠️ No users available for assignment');
      }
    } catch (error) {
      console.error('❌ Error loading assignment data:', error);
      // Don't throw error here, assignment features will just be disabled
    }
  }

  /**
   * ✅ NEW: IPv4 address validator
   */
  private ipv4Validator(control: any) {
    if (!control.value) return null;
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Pattern.test(control.value)) {
      return { invalidIpv4: true };
    }
    
    // Check if each octet is between 0-255
    const octets = control.value.split('.');
    for (const octet of octets) {
      const num = parseInt(octet, 10);
      if (num < 0 || num > 255) {
        return { invalidIpv4: true };
      }
    }
    
    return null;
  }

  private loadAssets(): void {
    const filters = this.currentFilters();
    const page = this.currentPage();
    const size = this.pageSize();

    console.log('📋 Loading assets with enhanced filters:', {
      filters,
      page,
      size,
      filterKeys: Object.keys(filters),
      filterValues: Object.values(filters)
    });

    this.loading.set(true);
    
    // Use enhanced service method with sorting support
    this.assetService.getAllAssets(filters, page, size, 'updatedAt', 'DESC')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response: PageResponse<Asset>) => {
          console.log('✅ Assets loaded successfully with filters:', {
            totalAssets: response.totalElements,
            assetsCount: response.content.length,
            currentPage: response.page,
            totalPages: response.totalPages,
            appliedFilters: filters,
            hasFilters: Object.keys(filters).length > 0
          });

          // ✅ Enhanced debugging for specific filters
          if (filters.model) {
            const modelAssets = response.content.filter(asset => 
              asset.modelId?.toString() === filters.model?.toString()
            );
            console.log('🔧 Model filtering results:', {
              expectedModelId: filters.model,
              totalAssetsReturned: response.content.length,
              assetsMatchingModel: modelAssets.length,
              modelDetails: this.getModelName(Number(filters.model))
            });
          }

          if (filters.osVersion) {
            const osVersionAssets = response.content.filter(asset => 
              asset.osVersionId?.toString() === filters.osVersion?.toString()
            );
            console.log('💾 OS Version filtering results:', {
              expectedOSVersionId: filters.osVersion,
              totalAssetsReturned: response.content.length,
              assetsMatchingOSVersion: osVersionAssets.length,
              osVersionDetails: this.getOSVersionName(Number(filters.osVersion))
            });
          }

          if (filters.assignmentStatus) {
            const assignedCount = response.content.filter(asset => asset.currentUserId).length;
            const unassignedCount = response.content.length - assignedCount;
            console.log('👤 Assignment Status filtering results:', {
              expectedStatus: filters.assignmentStatus,
              totalAssetsReturned: response.content.length,
              assignedAssets: assignedCount,
              unassignedAssets: unassignedCount
            });
          }

          // Assets are now managed by clientFilterService, no need to set manually
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('❌ Error loading assets with filters:', error);
          this.showError('Failed to load assets. Please try again.');
          // Error state is handled by clientFilterService
        }
      });
  }

  private loadOSVersionsByOS(osId: number): void {
    this.assetService.getOSVersionsByOS(osId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (versions) => {
          this.filteredOSVersions.set(versions || []);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading OS versions:', error);
        }
      });
  }

  // Auto-fill Logic
  private autoFillModelDetails(modelId: number): void {
    const selectedModel = this.assetModelsWithDetails().find(m => m.id === modelId);
    if (selectedModel) {
      // Auto-populate the read-only Asset Type and Make fields
      this.selectedAssetType.set(selectedModel.typeName);
      this.selectedAssetMake.set(selectedModel.makeName);
    }
  }

  private autoFillPODetails(poNumber: string): void {
    this.assetService.getPOByNumber(poNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (po: AssetPODTO | null) => {
          if (po) {
            this.assetForm.patchValue({
              acquisitionType: po.acquisitionType,
              invoiceNumber: po.invoiceNumber,
              acquisitionPrice: po.acquisitionPrice,
              rentalAmount: po.rentalAmount,
              currentPrice: po.currentPrice,
              depreciationPct: po.depreciationPct,
              leaseEndDate: po.leaseEndDate,
              minContractPeriod: po.minContractPeriod,
              vendorId: po.vendorId,
              ownerType: po.ownerType
            }, { emitEvent: false });

            this.showSuccess(ASSET_MESSAGES.SUCCESS.PO_LOADED);
          }
        },
        error: (error) => {
          console.error('Error loading PO details:', error);
          this.showError(ASSET_MESSAGES.ERROR.PO_NOT_FOUND);
        }
      });
  }

  private autoFillOSDetails(osVersionId: number): void {
    const selectedOSVersion = this.osVersions().find(v => v.id === osVersionId);
    if (selectedOSVersion) {
      // Auto-populate OS ID
      this.assetForm.patchValue({
        osId: selectedOSVersion.osId
      }, { emitEvent: false });

      // Find and set the OS name for display
      const selectedOS = this.operatingSystems().find(os => os.id === selectedOSVersion.osId);
      if (selectedOS) {
        this.selectedOSName.set(selectedOS.name);
      }
    }
  }

  private clearPORelatedFields(): void {
    // Get dynamic default values
    const defaults = this.defaultValues() || { defaultAcquisitionType: 'BOUGHT' };
    
    this.assetForm.patchValue({
      invoiceNumber: '',
      acquisitionType: defaults.defaultAcquisitionType,
      acquisitionDate: '',
      acquisitionPrice: 0,
      rentalAmount: 0,
      leaseEndDate: '',
      vendorId: '',
      extendedWarrantyVendorId: '',
      extendedWarrantyExpiry: '',
      warrantyExpiry: ''
    }, { emitEvent: false });

    // Clear vendor-related display names
    this.selectedVendor.set('');
    this.selectedExtendedWarrantyVendor.set('');
  }

  private autoFillVendorDetails(vendorId: number): void {
    const selectedVendor = this.vendors().find(v => v.id === vendorId);
    if (selectedVendor) {
      this.selectedVendor.set(selectedVendor.name);
      
      // Auto-populate extended warranty vendor (typically same as main vendor)
      this.assetForm.patchValue({
        extendedWarrantyVendorId: vendorId
      }, { emitEvent: false });
      
      this.selectedExtendedWarrantyVendor.set(selectedVendor.name);

      // Auto-populate warranty expiry dates (example: 1 year from acquisition)
      const acquisitionDate = this.assetForm.get('acquisitionDate')?.value;
      if (acquisitionDate) {
        const warrantyDate = new Date(acquisitionDate);
        warrantyDate.setFullYear(warrantyDate.getFullYear() + 1);
        
        const extendedWarrantyDate = new Date(acquisitionDate);
        extendedWarrantyDate.setFullYear(extendedWarrantyDate.getFullYear() + 2);

        this.assetForm.patchValue({
          warrantyExpiry: warrantyDate.toISOString().split('T')[0],
          extendedWarrantyExpiry: extendedWarrantyDate.toISOString().split('T')[0]
        }, { emitEvent: false });
      }
    }
  }

  // ===== REAL-TIME DEPENDENT DROPDOWN METHODS =====

  // 🔥 REAL-TIME: Load OS Versions by OS ID with loading states
  private loadOSVersionsRealTime(osId: number): void {
    this.osVersionsLoading.set(true);
    this.osVersionsError.set(null);
    
    this.assetService.getOSVersionsByOSRealTime(osId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.osVersionsLoading.set(false))
      )
      .subscribe({
        next: (versions: OSVersion[]) => {
          this.currentOSVersions.set(versions);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading OS versions:', error);
          this.osVersionsError.set('Failed to load OS versions');
          this.currentOSVersions.set([]);
        }
      });
  }

  // 🔥 REAL-TIME: Auto-fill Asset Model Details with API call
  private autoFillModelDetailsRealTime(modelId: number): void {
    this.modelDetailsLoading.set(true);
    this.modelDetailsError.set(null);
    
    this.assetService.getAssetModelDetails(modelId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.modelDetailsLoading.set(false))
      )
      .subscribe({
        next: (modelDetails: AssetModelDetails) => {
          // Auto-populate the read-only Asset Type and Make fields
          this.selectedAssetType.set(modelDetails.assetTypeName);
          this.selectedAssetMake.set(modelDetails.makeName);
          
          // Auto-populate hidden form fields for backend
          this.assetForm.patchValue({
            typeId: modelDetails.typeId,
            makeId: modelDetails.makeId
          }, { emitEvent: false });
          
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading model details:', error);
          this.modelDetailsError.set('Failed to load model details');
          this.selectedAssetType.set('');
          this.selectedAssetMake.set('');
        }
      });
  }

  // 🔥 REAL-TIME: Auto-fill PO Details with API call
  private autoFillPODetailsRealTime(poNumber: string): void {
    console.log('🔄 autoFillPODetailsRealTime called with PO:', poNumber);
    this.poDetailsLoading.set(true);
    this.poDetailsError.set(null);
    this.poErrorMessage.set(null);
    
    this.assetService.getPODetailsRealTime(poNumber)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          console.log('🏁 autoFillPODetailsRealTime completed');
          this.poDetailsLoading.set(false);
        })
      )
      .subscribe({
        next: (poDetails: PODetails) => {
          console.log('✅ PO Details received:', poDetails);
          
          // Log the fields being populated
          const fieldsToUpdate = {
            acquisitionType: poDetails.acquisitionType,
            acquisitionDate: poDetails.acquisitionDate,
            invoiceNumber: poDetails.invoiceNumber,
            acquisitionPrice: poDetails.acquisitionPrice,
            vendorId: poDetails.vendorId,
            ownerType: poDetails.ownerType,
            leaseEndDate: poDetails.leaseEndDate,
            minContractPeriod: poDetails.minContractPeriod,
            rentalAmount: poDetails.rentalAmount,
            currentPrice: poDetails.currentPrice
          };
          
          console.log('📝 Updating asset form with fields:', fieldsToUpdate);
          
          // Auto-populate all PO-related fields
          this.assetForm.patchValue(fieldsToUpdate, { emitEvent: false });

          // Set vendor name for display
          const vendor = this.vendors().find(v => v.id === poDetails.vendorId);
          if (vendor) {
            console.log('🏢 Setting vendor name:', vendor.name);
            this.selectedVendor.set(vendor.name);
          } else {
            console.warn('⚠️ Vendor not found for ID:', poDetails.vendorId);
          }

          this.showSuccess(ASSET_MESSAGES.SUCCESS.PO_LOADED);
          this.cdr.markForCheck();
          
          console.log('✅ PO details auto-population completed successfully');
        },
        error: (error) => {
          console.error('❌ Error loading PO details:', error);
          this.poDetailsError.set('PO not found or invalid');
          this.poErrorMessage.set(error.message || 'Failed to load PO details');
          this.showError(ASSET_MESSAGES.ERROR.PO_NOT_FOUND);
        }
      });
  }

  // ✅ NEW: Fix Asset Type Dropdown After Model Selection
  private autoFillModelDetailsAndEnsureTypeConsistency(modelId: number): void {
    console.log('🔧 [MODEL CONSISTENCY] Auto-filling model details and ensuring type consistency for model ID:', modelId);
    
    this.modelDetailsLoading.set(true);
    this.modelDetailsError.set(null);

    // Find the model from our current filtered models
    const selectedModel = this.filteredAssetModels().find(model => model.id === modelId);
    
    if (selectedModel) {
      console.log('✅ [MODEL CONSISTENCY] Found model in filtered list:', selectedModel);
      
      // Ensure the Asset Type ID is set/retained
      const currentTypeId = this.assetForm.get('typeId')?.value;
      const modelTypeId = selectedModel.typeId;
      
      if (!currentTypeId && modelTypeId) {
        console.log('🔧 [MODEL CONSISTENCY] Setting missing Asset Type ID:', modelTypeId);
        this.assetForm.patchValue({ typeId: modelTypeId.toString() }, { emitEvent: false });
        this.selectedAssetType.set(modelTypeId.toString());
      } else if (currentTypeId && modelTypeId && currentTypeId !== modelTypeId.toString()) {
        console.log('⚠️ [MODEL CONSISTENCY] Type ID mismatch. Current:', currentTypeId, 'Model:', modelTypeId);
        // Update to match the model's type
        this.assetForm.patchValue({ typeId: modelTypeId.toString() }, { emitEvent: false });
        this.selectedAssetType.set(modelTypeId.toString());
      }

      // Ensure the Asset Make ID is set/retained
      const currentMakeId = this.assetForm.get('makeId')?.value;
      const modelMakeId = selectedModel.makeId;
      
      if (!currentMakeId && modelMakeId) {
        console.log('🔧 [MODEL CONSISTENCY] Setting missing Asset Make ID:', modelMakeId);
        this.assetForm.patchValue({ makeId: modelMakeId.toString() }, { emitEvent: false });
        this.selectedAssetMake.set(modelMakeId.toString());
      } else if (currentMakeId && modelMakeId && currentMakeId !== modelMakeId.toString()) {
        console.log('⚠️ [MODEL CONSISTENCY] Make ID mismatch. Current:', currentMakeId, 'Model:', modelMakeId);
        // Update to match the model's make
        this.assetForm.patchValue({ makeId: modelMakeId.toString() }, { emitEvent: false });
        this.selectedAssetMake.set(modelMakeId.toString());
      }

      this.modelDetailsLoading.set(false);
    } else {
      // Fallback to API call if model not found in filtered list
      console.log('⚠️ [MODEL CONSISTENCY] Model not found in filtered list, falling back to API');
      this.autoFillModelDetailsRealTime(modelId);
    }
  }

  // ✅ NEW: Enhanced Auto-fill PO Details method using getPODetailsByNumber
  autoFillPODetailsEnhanced(poNumber: string): void {
    this.poDetailsLoading.set(true);
    this.poDetailsError.set(null);
    this.poErrorMessage.set(null);
    
    this.assetService.getPODetailsByNumber(poNumber)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.poDetailsLoading.set(false))
      )
      .subscribe({
        next: (poDetails: PODetails) => {
          // Auto-populate all PO-related fields
          this.assetForm.patchValue({
            acquisitionType: poDetails.acquisitionType,
            acquisitionDate: poDetails.acquisitionDate,
            invoiceNumber: poDetails.invoiceNumber,
            acquisitionPrice: poDetails.acquisitionPrice,
            vendorId: poDetails.vendorId,
            ownerType: poDetails.ownerType,
            leaseEndDate: poDetails.leaseEndDate,
            minContractPeriod: poDetails.minContractPeriod,
            rentalAmount: poDetails.rentalAmount,
            currentPrice: poDetails.currentPrice
          }, { emitEvent: false });

          // Set vendor name for display
          const vendor = this.vendors().find(v => v.id === poDetails.vendorId);
          if (vendor) {
            this.selectedVendor.set(vendor.name);
          }

          // Clear any previous errors
          this.poErrorMessage.set(null);
          this.poDetailsError.set(null);
          
          this.showSuccess(ASSET_MESSAGES.SUCCESS.PO_LOADED);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error in autoFillPODetailsEnhanced:', error);
          const errorMsg = error.message || 'Failed to load PO details';
          this.poDetailsError.set(errorMsg);
          this.poErrorMessage.set(errorMsg);
          this.showError(errorMsg);
        }
      });
  }



  // 🔥 REAL-TIME: Auto-fill Vendor Warranty Details with API call
  private autoFillVendorDetailsRealTime(vendorId: number): void {
    this.vendorWarrantyLoading.set(true);
    this.vendorWarrantyError.set(null);
    
    this.assetService.getVendorWarrantyDetails(vendorId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.vendorWarrantyLoading.set(false))
      )
      .subscribe({
        next: (warrantyDetails: VendorWarrantyDetails) => {
          // Auto-populate vendor display name
          this.selectedVendor.set(warrantyDetails.name);
          
          // Auto-populate extended warranty details
          this.assetForm.patchValue({
            extendedWarrantyVendorId: warrantyDetails.extendedWarrantyVendorId
          }, { emitEvent: false });
          
          this.selectedExtendedWarrantyVendor.set(warrantyDetails.extendedWarrantyVendor);

          // Auto-calculate warranty expiry dates based on acquisition date
          const acquisitionDate = this.assetForm.get('acquisitionDate')?.value;
          if (acquisitionDate) {
            const baseDate = new Date(acquisitionDate);
            
            // Standard warranty
            const warrantyDate = new Date(baseDate);
            warrantyDate.setMonth(warrantyDate.getMonth() + warrantyDetails.defaultWarrantyMonths);
            
            // Extended warranty
            const extendedWarrantyDate = new Date(baseDate);
            extendedWarrantyDate.setMonth(extendedWarrantyDate.getMonth() + warrantyDetails.extendedWarrantyMonths);

            this.assetForm.patchValue({
              warrantyExpiry: warrantyDate.toISOString().split('T')[0],
              extendedWarrantyExpiry: extendedWarrantyDate.toISOString().split('T')[0]
            }, { emitEvent: false });
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading vendor warranty details:', error);
          this.vendorWarrantyError.set('Failed to load warranty details');
          
          // Fallback to basic vendor display
          const vendor = this.vendors().find(v => v.id === vendorId);
          if (vendor) {
            this.selectedVendor.set(vendor.name);
          }
        }
      });
  }

  // 🔥 NEW: Cascading Dropdown Methods
  
  /**
   * Load asset types filtered by selected category
   */
  private loadAssetTypesByCategory(category: string): void {
    if (!category) {
      this.filteredAssetTypes.set([]);
      return;
    }

    this.assetTypesLoading.set(true);
    this.assetTypesError.set(null);

    this.assetTypeService.getAssetTypesByCategory(category)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.assetTypesLoading.set(false))
      )
      .subscribe({
        next: (types: AssetTypeModel[]) => {
          console.log(`✅ Asset types for category ${category} loaded:`, types);
          this.filteredAssetTypes.set(types);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error(`❌ Error loading asset types for category ${category}:`, error);
          this.assetTypesError.set(`Failed to load asset types for ${category}`);
          this.filteredAssetTypes.set([]);
        }
      });
  }

  /**
   * Load asset makes filtered by selected asset type
   */
  private loadAssetMakesByType(typeId: number): void {
    if (!typeId) {
      this.filteredAssetMakes.set([]);
      return;
    }

    this.assetMakesLoading.set(true);
    this.assetMakesError.set(null);

    this.assetMakeService.getAssetMakesByType(typeId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.assetMakesLoading.set(false))
      )
      .subscribe({
        next: (makes: AssetMakeModel[]) => {
          console.log(`✅ Asset makes for type ${typeId} loaded:`, makes);
          this.filteredAssetMakes.set(makes);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error(`❌ Error loading asset makes for type ${typeId}:`, error);
          this.assetMakesError.set(`Failed to load asset makes`);
          this.filteredAssetMakes.set([]);
        }
      });
  }

  /**
   * Load asset models filtered by selected asset make
   */
  private loadAssetModelsByMake(makeId: number): void {
    if (!makeId) {
      this.filteredAssetModels.set([]);
      return;
    }

    this.assetModelsLoading.set(true);
    this.assetModelsError.set(null);

    this.assetModelService.getAssetModelsByMake(makeId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.assetModelsLoading.set(false))
      )
      .subscribe({
        next: (models: AssetModelModel[]) => {
          console.log(`✅ Asset models for make ${makeId} loaded:`, models);
          this.filteredAssetModels.set(models);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error(`❌ Error loading asset models for make ${makeId}:`, error);
          this.assetModelsError.set(`Failed to load asset models`);
          this.filteredAssetModels.set([]);
        }
      });
  }

  // CRUD Operations
  openAddAssetModal(): void {
    this.selectedAsset.set(null);
    this.isEditMode.set(false);
    this.assetForm.reset();
    
    // Get dynamic default values
    const defaults = this.defaultValues() || { 
      defaultStatus: 'ACTIVE', 
      defaultOwnerType: 'CELCOM', 
      defaultAcquisitionType: 'BOUGHT' 
    };
    
    this.assetForm.patchValue({
      status: defaults.defaultStatus,
      ownerType: defaults.defaultOwnerType,
      acquisitionType: defaults.defaultAcquisitionType,
      currentUserId: null,  // Set to null on creation
      assetCategory: 'HARDWARE'  // Default to hardware
    });

    // Trigger field visibility update for default category
    this.selectedAssetCategory.set('HARDWARE');
    this.updateFieldVisibilityAndValidation('HARDWARE');

    // Clear the auto-populated fields
    this.selectedAssetType.set('');
    this.selectedAssetMake.set('');
    this.isFormModalOpen.set(true);
  }

  openEditAssetModal(asset: AssetWithFilterData): void {
    this.selectedAsset.set(asset);
    this.isEditMode.set(true);
    
    // 🔥 NEW: Handle license validity period conversion for software assets
    let formData = { ...asset };
    if (asset.assetCategory === 'SOFTWARE' && asset.licenseValidityPeriod) {
      // If backend sends months as integer, convert to date for form display
      if (typeof asset.licenseValidityPeriod === 'number') {
        const today = new Date();
        const futureDate = new Date(today.getFullYear(), today.getMonth() + asset.licenseValidityPeriod, today.getDate());
        formData.licenseValidityPeriod = futureDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        this.licenseValidityMonths.set(asset.licenseValidityPeriod);
      } else if (typeof asset.licenseValidityPeriod === 'string') {
        // If backend sends date string, calculate months for display
        const months = this.calculateLicenseValidityPeriod(asset.licenseValidityPeriod);
        this.licenseValidityMonths.set(months);
      }
    }
    
    // Set the asset ID properly for editing
    this.assetForm.patchValue({
      ...formData,
      assetId: asset.assetId, // Ensure asset_id is included for PUT requests
      assetCategory: asset.assetCategory || 'HARDWARE' // Set default if missing
    });

    // Trigger field visibility update based on asset category
    const category = asset.assetCategory || 'HARDWARE';
    this.selectedAssetCategory.set(category);
    this.updateFieldVisibilityAndValidation(category);
    
    // Auto-populate dependent fields based on current values
    if (asset.modelId) {
      this.autoFillModelDetails(asset.modelId);
    }
    
    if (asset.osVersionId) {
      this.autoFillOSDetails(asset.osVersionId);
    }
    
    if (asset.vendorId) {
      this.autoFillVendorDetails(asset.vendorId);
    }

    this.isFormModalOpen.set(true);
  }

  closeAssetModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedAsset.set(null);
    this.assetForm.reset();
    // Clear software license user assignments
    this.selectedLicenseUsers.set([]);
    this.licenseUserSearchTerm = '';
    this.showLicenseUserDropdown.set(false);
    // Clear license validity period calculation
    this.licenseValidityMonths.set(null);
  }

  onSubmitAsset(): void {
    if (this.assetForm.valid) {
      // Set loading state
      this.submissionLoading.set(true);
      
      const formData = { ...this.assetForm.value };
      const isEdit = this.isEditMode();
      
      // 🔥 NEW: Transform license validity period from date to months for software assets
      if (formData.assetCategory === 'SOFTWARE' && formData.licenseValidityPeriod) {
        const months = this.calculateLicenseValidityPeriod(formData.licenseValidityPeriod);
        formData.licenseValidityPeriod = months; // Send as integer months, not date
      }
      
      // Ensure asset_id is properly set for updates
      if (isEdit) {
        formData.assetId = this.selectedAsset()!.assetId!;
      } else {
        // For creation, remove assetId or set to null
        delete formData.assetId;
      }

      const operation = isEdit 
        ? this.assetService.updateAsset(formData.assetId, formData)
        : this.assetService.createAsset(formData);

      operation.pipe(
        takeUntil(this.destroy$),
        finalize(() => this.submissionLoading.set(false))
      )
        .subscribe({
          next: (asset) => {
            const message = isEdit 
              ? ASSET_MESSAGES.SUCCESS.UPDATE 
              : ASSET_MESSAGES.SUCCESS.CREATE;
            this.showSuccess(message);
            this.closeAssetModal();
            this.loadAssets();
          },
          error: (error) => {
            console.error('Error saving asset:', error);
            this.showError('Failed to save asset. Please check required fields and try again.');
          }
        });
    } else {
      this.markFormGroupTouched(this.assetForm);
      this.showError('Please complete all required fields before submitting.');
    }
  }

  deleteAsset(asset: AssetWithFilterData): void {
    if (confirm(`Are you sure you want to delete "${asset.name}"?`)) {
      this.assetService.deleteAsset(asset.assetId!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccess(ASSET_MESSAGES.SUCCESS.DELETE);
            this.loadAssets();
          },
          error: (error) => {
            console.error('Error deleting asset:', error);
            this.showError('Failed to delete asset');
          }
        });
    }
  }

  // Bulk Operations
  bulkDeleteSelected(): void {
    const selectedAssets = this.selection.selected;
    if (selectedAssets.length === 0) return;

    const assetNames = selectedAssets.map(a => a.name).join(', ');
    if (confirm(`Are you sure you want to delete ${selectedAssets.length} assets: ${assetNames}?`)) {
      const ids = selectedAssets.map(a => a.assetId!);
      
      // Since bulkDeleteAssets is not in the existing service, use individual deletes
      const deletePromises = ids.map(id => this.assetService.deleteAsset(id).toPromise());
      
      Promise.all(deletePromises).then(() => {
        this.showSuccess(`Successfully deleted ${selectedAssets.length} assets`);
        this.selection.clear();
        this.loadAssets();
      }).catch((error) => {
        console.error('Error bulk deleting assets:', error);
        this.showError('Failed to delete selected assets');
      });
    }
  }

  // Table and Selection Management
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.filteredAssets().length;
    return numSelected === numRows && numRows > 0;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.filteredAssets().forEach(row => this.selection.select(row));
    }
  }

  // Pagination Methods
  onPageChange(event: PageEvent): void {
    console.log('📄 Page change event:', event);
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize as typeof ASSET_CONFIG.PAGE_SIZE);
    this.loadAssets();
  }

  // Add missing goToPage method
  goToPage(page: number): void {
    if (page >= 0 && page < this.getTotalPages()) {
    this.currentPage.set(page);
    this.loadAssets();
    }
  }

  // Search and Filter
  onSearchChange(searchTerm: string): void {
    console.log('🔍 Search term changed:', searchTerm);
    this.filterForm.patchValue({ search: searchTerm }, { emitEvent: true });
  }

  /**
   * Handle Asset Type filter change - now handled by form value changes
   * This method is kept for backward compatibility but the main filtering
   * logic is now handled in setupSubscriptions()
   */
  onAssetTypeFilterChange(typeId: string): void {
    console.log('🔍 Asset Type filter changed:', typeId);
    // The filtering is now automatically handled by the form valueChanges subscription
    // This method can be removed if no other logic is needed
  }

  clearFilters(): void {
    console.log('🔄 Clearing client-side filters...');
    this.clientFilterForm.reset();
    this.clientFilterService.clearFilters();
    this.currentPage.set(0);
    this.cdr.markForCheck();
  }

  // ✅ NEW: Quick filter methods for client-side filtering


  onUserFilterChange(userName: string): void {
    this.clientFilterForm.patchValue({ currentUserName: userName });
  }

  onOSFilterChange(osName: string): void {
    this.clientFilterForm.patchValue({ osName });
  }

  onVendorFilterChange(name: string): void {
    this.clientFilterForm.patchValue({ name });
  }

  // ✅ NEW: Get current filter state
  getCurrentFilters(): ClientSideFilterOptions {
    return this.clientFilterForm.value;
  }

  // ✅ NEW: Refresh data
  refreshData(): void {
    console.log('🔄 Refreshing client-side data...');
    this.clientFilterService.refreshData().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.showSuccess('Data refreshed successfully');
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('❌ Error refreshing data:', error);
        this.showError('Failed to refresh data');
      }
    });
  }

  // Add missing methods that might be called from template
  triggerChangeDetection(): void {
    this.cdr.markForCheck();
  }

  applyFiltersAndPagination(): void {
    const filterValue = this.filterForm.value;
    this.currentFilters.set(filterValue);
    this.currentPage.set(0); // Reset to first page when filtering
    this.loadAssets();
  }

  // Utility Methods
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // ✅ NEW: Toast notification system
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error' | 'info'>('info');
  showToast = signal(false);

  private showSuccess(message: string): void {
    console.log('Success:', message);
    this.displayToast(message, 'success');
  }

  private showError(message: string): void {
    console.error('Error:', message);
    this.displayToast(message, 'error');
  }

  private displayToast(message: string, type: 'success' | 'error' | 'info'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideToast();
    }, 5000);
  }

  hideToast(): void {
    this.showToast.set(false);
  }

  /**
   * ✅ Get current user ID for status changes
   * Using hardcoded ID 1 for now as requested
   */
  private getCurrentUserId(): number | null {
    // ✅ Using hardcoded user ID 1 as requested
    return 1;
    
    // TODO: Later integrate with actual auth service
    // Example: return this.authService.getCurrentUserId() || null;
  }

  /**
   * ✅ Auto-refresh assets data after status change
   * Ensures display is synchronized with backend
   */
  refreshAssetsData(): void {
    console.log('🔄 Refreshing assets data...');
    
    // Reload assets with current filters
    const currentFilters = this.currentFilters();
    const currentPageIndex = this.currentPage();
    const currentPageSize = this.pageSize();
    
    this.assetService.getAllAssets(currentFilters, currentPageIndex, currentPageSize).subscribe({
      next: (response) => {
        // Assets are now managed by clientFilterService, trigger refresh instead
        this.clientFilterService.refreshData();
        console.log('✅ Assets data refreshed successfully');
      },
      error: (error) => {
        console.error('❌ Error refreshing assets data:', error);
        this.displayToast('Failed to refresh asset data', 'error');
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.assetForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return `${fieldName} is required`;
      }
      if (field.errors?.['minlength']) {
        return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors?.['pattern']) {
        return `${fieldName} format is invalid`;
      }
      if (field.errors?.['min']) {
        return `${fieldName} must be greater than or equal to ${field.errors['min'].min}`;
      }
      if (field.errors?.['max']) {
        return `${fieldName} must be less than or equal to ${field.errors['max'].max}`;
      }
    }
    return '';
  }

  // Helper methods for template
  getUserName(userId?: number): string {
    if (!userId) return 'Unassigned';
    const user = this.users().find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  }

  getname(vendorId?: number): string {
    if (!vendorId) return 'N/A';
    const vendor = this.vendors().find(v => v.id === vendorId);
    return vendor ? vendor.name : 'Unknown Vendor';
  }

  getAssetTypeName(typeId?: number): string {
    if (!typeId) return 'N/A';
    const model = this.assetModelsWithDetails().find(m => m.typeId === typeId);
    return model ? model.typeName : 'Unknown Type';
  }

  getMakeName(makeId?: number): string {
    const model = this.assetModelsWithDetails().find(m => m.makeId === makeId);
    return model?.makeName || 'Unknown Make';
  }

  getModelName(modelId?: number): string {
    if (!modelId) return 'N/A';
    const model = this.assetModelsWithDetails().find(m => m.id === modelId);
    return model ? model.name : 'Unknown Model';
  }

  getOSName(osId?: number): string {
    if (!osId) return 'N/A';
    const os = this.operatingSystems().find(o => o.id === osId);
    return os ? os.name : 'Unknown OS';
  }

  getOSVersionName(osVersionId?: number): string {
    const version = this.osVersions().find(v => v.id === osVersionId);
    return version ? version.versionNumber : 'Unknown';
  }

  // ✅ NEW: Make Math available in template
  // ✅ TrackBy functions for performance optimization
  trackByAssetId(index: number, asset: AssetWithFilterData): number {
    return asset.assetId || index;
  }

  // ✅ NEW: TrackBy functions for dropdowns as requested
  trackById(index: number, item: any): number {
    return item.id || index;
  }

  trackByOSVersionId(index: number, version: OSVersion): number {
    return version.id || index;
  }

  trackByVendorId(index: number, vendor: Vendor): number {
    return vendor.id || index;
  }

  trackByUserId(index: number, user: User): number {
    return user.id || index;
  }

  trackByModelId(index: number, model: AssetModelWithDetails): number {
    return model.id || index;
  }

  trackByOSId(index: number, os: OperatingSystem): number {
    return os.id || index;
  }

  // Dynamic status styling methods using configuration service
  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'IN_REPAIR':
        return 'bg-orange-100 text-orange-800';
      case 'BROKEN':
        return 'bg-red-100 text-red-800';
      case 'CEASED':
        return 'bg-gray-200 text-gray-700';
      case 'IN_STOCK':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusBadge(status: string): { class: string; icon: string; label: string } {
    const displayName = this.getStatusDisplayName(status);
    
    switch (status) {
      case 'ACTIVE':
        return {
          class: 'bg-green-100 text-green-800 border border-green-200',
          icon: '●', // Green dot
          label: displayName
        };
      case 'IN_REPAIR':
        return {
          class: 'bg-orange-100 text-orange-800 border border-orange-200',
          icon: '⚠', // Warning icon
          label: displayName
        };
      case 'BROKEN':
        return {
          class: 'bg-red-100 text-red-800 border border-red-200',
          icon: '✕', // X mark
          label: displayName
        };
      case 'CEASED':
        return {
          class: 'bg-gray-200 text-gray-700 border border-gray-300',
          icon: '⊘', // Prohibition sign
          label: displayName
        };
      case 'IN_STOCK':
        return {
          class: 'bg-blue-100 text-blue-800 border border-blue-200',
          icon: '📦', // Package icon
          label: displayName
        };
      default:
        return {
          class: 'bg-gray-100 text-gray-800 border border-gray-200',
          icon: '?',
          label: displayName
        };
    }
  }

  // ✅ NEW: Asset Status Change Methods

  /**
   * Open status change modal with remarks
   * ✅ Enhanced to handle Active -> Other status changes with user unassignment
   */
  openStatusChangeModal(asset: AssetWithFilterData, newStatus: string): void {
    // If status is the same, do nothing
    if (asset.status === newStatus) {
      return;
    }

    // ✅ SPECIAL CASE: Active status with assigned user
    if (asset.status.toLowerCase() === 'active' && asset.currentUserId && newStatus.toLowerCase() !== 'active') {
      // Show unassignment confirmation modal instead
      this.pendingUnassignmentAsset.set(asset);
      this.pendingUnassignmentStatus.set(newStatus);
      this.showUnassignmentConfirmModal.set(true);
      return;
    }

    // Regular status change flow
    this.selectedAssetForStatusChange.set(asset);
    this.pendingStatusChange.set(newStatus);
    this.showStatusChangeModal.set(true);
    this.statusChangeError.set(null);
  }

  /**
   * Confirm status change with remarks and enhanced user feedback
   */
  confirmStatusChange(remarks?: string): void {
    const asset = this.selectedAssetForStatusChange();
    const newStatus = this.pendingStatusChange();
    
    if (asset && newStatus) {
      this.onStatusChange(asset, newStatus, remarks);
      this.showStatusChangeModal.set(false);
      
      // Show immediate feedback to user
      const trimmedRemarks = remarks?.trim();
      const remarksText = trimmedRemarks ? ` (${trimmedRemarks})` : '';
      this.displayToast(
        `🔄 Processing status change for "${asset.name}" to "${newStatus}"${remarksText}`,
        'info'
      );
    }
  }

  /**
   * Cancel status change
   */
  cancelStatusChange(): void {
    this.showStatusChangeModal.set(false);
    this.selectedAssetForStatusChange.set(null);
    this.pendingStatusChange.set('');
    this.statusChangeError.set(null);
  }

  /**
   * ✅ NEW: Confirm unassignment and status change for Active assets
   */
  confirmUnassignmentAndStatusChange(): void {
    const asset = this.pendingUnassignmentAsset();
    const newStatus = this.pendingUnassignmentStatus();
    
    if (!asset || !newStatus) {
      console.error('Missing asset or new status for unassignment confirmation');
      return;
    }

    const currentUser = this.users().find(u => u.id === asset.currentUserId);
    const userName = currentUser ? currentUser.name : 'Unknown User';

    console.log('🔄 Starting unassignment and status change process:', {
      assetId: asset.assetId,
      assetName: asset.name,
      currentUserId: asset.currentUserId,
      userName,
      currentStatus: asset.status,
      newStatus
    });

    // Hide the confirmation modal
    this.closeUnassignmentConfirmModal();

    // Show loading state
    this.statusChangeLoading.set(true);

    // Use the new combined API method
    this.assetService.changeStatusWithUnassignment(
      asset.assetId!,
      newStatus,
      asset.currentUserId,
      `User ${userName} unassigned due to status change from Active to ${newStatus}`
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('✅ Unassignment and status change successful:', response);
        this.statusChangeLoading.set(false);
        
        // Update local asset list
        this.loadAssets();
        
        // Show success message
        const message = response.assignmentHistory 
          ? `Asset "${asset.name}" unassigned from ${userName} and status changed to ${this.getStatusDisplayName(newStatus)}`
          : `Asset "${asset.name}" status changed to ${this.getStatusDisplayName(newStatus)}`;
        
        this.showSuccess(message);
        
        // Update status history
        if (response.statusHistory) {
          this.statusHistory.set([response.statusHistory]);
        }
      },
      error: (error) => {
        console.error('❌ Error in unassignment and status change:', error);
        this.statusChangeLoading.set(false);
        this.showError('Failed to process status change and unassignment. Please try again.');
      }
    });
  }

  /**
   * ✅ NEW: Cancel unassignment confirmation
   */
  cancelUnassignmentConfirmation(): void {
    this.closeUnassignmentConfirmModal();
    
    // Reset any dropdown that might have triggered this
    this.triggerChangeDetection();
  }

  /**
   * ✅ NEW: Close unassignment confirmation modal
   */
  private closeUnassignmentConfirmModal(): void {
    this.showUnassignmentConfirmModal.set(false);
    this.pendingUnassignmentAsset.set(null);
    this.pendingUnassignmentStatus.set('');
  }

  /**
   * ✅ Change asset status with validation and automatic rules
   * Integrates with backend PUT /api/assets/{id}/status
   */
  onStatusChange(asset: AssetWithFilterData, newStatus: string, remarks?: string): void {
    // ✅ COMPREHENSIVE DEBUG LOGGING AS REQUESTED
    console.log('🔄 Starting status change process:', {
      assetId: asset.assetId,
      assetName: asset.name,
      currentStatus: asset.status,
      newStatus,
      remarks,
      changedById: 1 // ✅ Using hardcoded user ID 1 as requested
    });

    // ✅ VALIDATE newStatus TYPE AND VALUE
    console.log('🔍 Status validation checks:');
    console.log('  - newStatus type:', typeof newStatus);
    console.log('  - newStatus length:', newStatus?.length || 0);
    console.log('  - newStatus value:', JSON.stringify(newStatus));
    
    // Check for whitespace/trim issues
    const trimmedStatus = newStatus?.trim();
    console.log('  - trimmed status:', JSON.stringify(trimmedStatus));
    console.log('  - has leading/trailing spaces:', newStatus !== trimmedStatus);
    
    // Validate against allowed enum values
    const validStatuses = Object.values(ASSET_STATUS);
    console.log('  - valid statuses:', validStatuses);
    console.log('  - is valid status:', validStatuses.includes(newStatus as any));
    
    // Check if newStatus is null/undefined
    if (!newStatus || newStatus === null || newStatus === undefined) {
      console.error('❌ Status validation failed: newStatus is null/undefined');
      this.statusChangeError.set('Status value is missing');
      return;
    }

    // Frontend validation
    const validation = this.assetService.validateStatusChange(newStatus, asset.currentUserId);
    if (!validation.isValid) {
      this.statusChangeError.set(validation.error || 'Invalid status change');
      console.warn('⚠️ Validation failed:', validation.error);
      return;
    }

    // ✅ Proper user context handling with null fallback
    const currentUserId = this.getCurrentUserId(); // Get from auth service or null
    const request: AssetStatusChangeRequest = {
      assetId: asset.assetId!,
      newStatus: trimmedStatus, // ✅ Use trimmed status to avoid whitespace issues
      changedById: currentUserId, // Can be null if no user context
      remarks: remarks?.trim() || null, // Ensure null instead of empty string
      currentUserId: asset.currentUserId
    };

    // ✅ COMPREHENSIVE PAYLOAD LOGGING AS REQUESTED
    console.log('📤 Status Update Payload:', JSON.stringify(request));
    console.log('📤 Payload breakdown:');
    console.log('  - assetId:', request.assetId, '(type:', typeof request.assetId, ')');
    console.log('  - newStatus:', JSON.stringify(request.newStatus), '(type:', typeof request.newStatus, ', length:', request.newStatus?.length, ')');
    console.log('  - changedById:', request.changedById, '(type:', typeof request.changedById, ')');
    console.log('  - remarks:', JSON.stringify(request.remarks), '(type:', typeof request.remarks, ')');
    console.log('  - currentUserId:', request.currentUserId, '(type:', typeof request.currentUserId, ')');

    this.statusChangeLoading.set(true);
    this.statusChangeError.set(null);

    this.assetService.changeAssetStatus(request).subscribe({
      next: (response) => {
        console.log('✅ Status change successful:', response);
        this.statusChangeLoading.set(false);
        this.showSuccess(response.message);
        
        // ✅ Assets are now managed by clientFilterService
        // Trigger a refresh to update the filtered data
        this.clientFilterService.refreshData();
        console.log('🔄 Asset list will be updated via clientFilterService');

        // ✅ Update status history for audit trail
        this.statusHistory.set(response.statusHistory);

        // ✅ Auto-refresh display: Reload assets to ensure sync with backend
        this.refreshAssetsData();

        // ✅ Enhanced success notification with details
        const remarksText = remarks?.trim() ? ` (Remarks: ${remarks.trim()})` : '';
        this.displayToast(
          `✅ Success! "${asset.name}" status changed to "${newStatus}"${remarksText}`,
          'success'
        );

        // ✅ Update filters and pagination to reflect any changes
        this.applyFiltersAndPagination();
      },
      error: (error) => {
        console.error('❌ Status change error details:');
        console.error('  - Error object:', error);
        console.error('  - Error message:', error.message);
        console.error('  - Error status:', error.status);
        console.error('  - Error statusText:', error.statusText);
        console.error('  - Full error response:', error.error);
        
        this.statusChangeLoading.set(false);
        this.statusChangeError.set(error.message || 'Failed to change status');
        
        // ✅ Enhanced error notification with asset details
        this.displayToast(
          `❌ Failed to change status for "${asset.name}". ${error.message || 'Please try again.'}`,
          'error'
        );
        
        console.error('❌ Status change error:', error);
      }
    });
  }

  /**
   * ✅ NEW: Open status history modal
   */
  openStatusHistoryModal(asset: AssetWithFilterData): void {
    this.statusHistoryModalAsset.set({
      id: asset.assetId!,
      name: asset.name,
      serial: asset.serialNumber || ''
    });
    this.showStatusHistoryModal.set(true);
  }

  /**
   * ✅ NEW: Close status history modal
   */
  closeStatusHistoryModal(): void {
    this.showStatusHistoryModal.set(false);
    this.statusHistoryModalAsset.set(null);
  }

  // ✅ NEW: Conditional Logic for Asset Status and User Assignment
  
  /**
   * Handle status change with automatic user unassignment logic
   */
  onAssetStatusChange(asset: AssetWithFilterData, newStatus: string): void {
    console.log('🔄 Asset status change triggered:', { asset: asset.name, oldStatus: asset.status, newStatus });
    
    const statusRequiringUnassignment = ['In Stock', 'Broken', 'Ceased'];
    const currentUserId = asset.currentUserId;
    
    if (statusRequiringUnassignment.includes(newStatus) && currentUserId) {
      console.log('⚠️ Status requires user unassignment:', newStatus);
      
      // Show confirmation dialog
      const confirmMessage = `Changing status to "${newStatus}" will automatically unassign the current user. Continue?`;
      if (confirm(confirmMessage)) {
        this.executeStatusChangeWithUnassignment(asset, newStatus, currentUserId);
      }
    } else {
      // Normal status change without unassignment
      this.executeStatusChange(asset, newStatus);
    }
  }

  /**
   * Handle user assignment with automatic status change logic
   */
  onAssetUserAssignment(asset: AssetWithFilterData, newUserId: number | null): void {
    console.log('👤 User assignment change triggered:', { asset: asset.name, currentUser: asset.currentUserId, newUser: newUserId });
    
    // Check if assignment is allowed for current status
    if (!this.isAssignmentAllowedForStatus(asset.status)) {
      this.showError(`Assignment not allowed for ${asset.status} assets.`);
      return;
    }
    
    if (newUserId && asset.status === 'In Stock') {
      console.log('🔄 Auto-activating asset due to user assignment');
      
      const confirmMessage = `Assigning a user to this asset will automatically change status to "Active". Continue?`;
      if (confirm(confirmMessage)) {
        this.executeUserAssignmentWithStatusChange(asset, newUserId, 'Active');
      }
    } else if (newUserId) {
      // Normal user assignment without status change
      this.executeUserAssignment(asset, newUserId);
    } else {
      // User unassignment
      this.executeUserUnassignment(asset);
    }
  }

  /**
   * Check if user assignment is allowed for the given status
   */
  isAssignmentAllowedForStatus(status: string): boolean {
    const disallowedStatuses = ['Broken', 'Ceased'];
    return !disallowedStatuses.includes(status);
  }

  /**
   * Get tooltip message for assignment button
   */
  getAssignmentTooltip(asset: AssetWithFilterData): string {
    if (this.userAssignmentLoading()) {
      return 'Processing assignment...';
    }
    
    if (!this.isAssignmentAllowedForStatus(asset.status)) {
      return `Assignment not allowed for ${asset.status} assets`;
    }
    
    if (asset.currentUserId) {
      return 'Manage user assignment';
    }
    
    return 'Assign user to asset';
  }

  /**
   * Execute status change with automatic user unassignment
   */
  private executeStatusChangeWithUnassignment(asset: AssetWithFilterData, newStatus: string, currentUserId: number): void {
    console.log('🔄 Executing status change with user unassignment...');
    
    this.statusChangeLoading.set(true);
    
    // First get current assignment to get the assignmentId, then unassign
    this.assignmentService.getCurrentUserAssignment(asset.assetId!)
      .pipe(
        switchMap((assignment) => {
          if (assignment && assignment.id) {
            // Unassign using the assignment ID
            return this.assignmentService.unassignUserFromAsset(assignment.id);
          } else {
            // No current assignment found, proceed with status change only
            console.log('⚠️ No current assignment found, proceeding with status change only');
            return of({ message: 'No assignment to remove' });
          }
        }),
        switchMap(() => {
          // Then change the status
          const statusRequest: AssetStatusChangeRequest = {
            assetId: asset.assetId!,
            newStatus: newStatus,
            changedById: this.getCurrentUserId(),
            remarks: `Status changed from ${asset.status} to ${newStatus} with automatic user unassignment`,
            currentUserId: undefined // Clear user assignment
          };
          return this.assetService.changeAssetStatus(statusRequest);
        }),
        takeUntil(this.destroy$),
        finalize(() => this.statusChangeLoading.set(false))
      )
      .subscribe({
        next: (response: any) => {
          console.log('✅ Status change with unassignment completed:', response);
          this.showSuccess(`Status updated to ${newStatus}. User unassigned due to asset status.`);
          this.refreshAssetsData();
        },
        error: (error: any) => {
          console.error('❌ Error in status change with unassignment:', error);
          this.showError('Failed to update status and unassign user. Please try again.');
        }
      });
  }

  /**
   * Execute user assignment with automatic status change and history tracking
   */
  private executeUserAssignmentWithStatusChange(asset: AssetWithFilterData, newUserId: number, newStatus: string): void {
    console.log('🔄 Executing user assignment with status change and history tracking...');
    
    this.userAssignmentLoading.set(true);
    
    // Create assignment history entry
    const assignmentHistory: AssetAssignmentHistoryDTO = {
      assetId: asset.assetId!,
      userId: newUserId,
      assignedDate: new Date().toISOString(),
      unassignedDate: undefined // Will be set when user is unassigned
    };
    
    // First handle existing assignment if any
    this.handleExistingAssignmentAndAssignNew(asset, newUserId, assignmentHistory)
      .pipe(
        switchMap(() => {
          // Then change the status
          const statusRequest: AssetStatusChangeRequest = {
            assetId: asset.assetId!,
            newStatus: newStatus,
            changedById: this.getCurrentUserId(),
            remarks: `Status automatically changed to ${newStatus} due to user assignment`,
            currentUserId: newUserId
          };
          return this.assetService.changeAssetStatus(statusRequest);
        }),
        takeUntil(this.destroy$),
        finalize(() => this.userAssignmentLoading.set(false))
      )
      .subscribe({
        next: (response: any) => {
          console.log('✅ User assignment with status change completed:', response);
          this.showSuccess(`User assigned successfully. Status updated to ${newStatus} as user is assigned.`);
          this.refreshAssetsData();
        },
        error: (error: any) => {
          console.error('❌ Error in user assignment with status change:', error);
          this.showError('Failed to assign user and update status. Please try again.');
        }
      });
  }

  /**
   * Execute normal status change without user modifications
   */
  private executeStatusChange(asset: AssetWithFilterData, newStatus: string): void {
    console.log('🔄 Executing normal status change...');
    
    const statusRequest: AssetStatusChangeRequest = {
      assetId: asset.assetId!,
      newStatus: newStatus,
      changedById: this.getCurrentUserId(),
      remarks: `Status changed from ${asset.status} to ${newStatus}`,
      currentUserId: asset.currentUserId
    };
    
    this.statusChangeLoading.set(true);
    
    this.assetService.changeAssetStatus(statusRequest)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.statusChangeLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Status change completed:', response);
          this.showSuccess(`Status updated to ${newStatus} successfully.`);
          this.refreshAssetsData();
        },
        error: (error) => {
          console.error('❌ Error in status change:', error);
          this.showError('Failed to update status. Please try again.');
        }
      });
  }

  /**
   * Execute normal user assignment without status modifications with history tracking
   */
  private executeUserAssignment(asset: AssetWithFilterData, newUserId: number): void {
    console.log('🔄 Executing normal user assignment with history tracking...');
    
    this.userAssignmentLoading.set(true);
    
    // Create assignment history entry
    const assignmentHistory: AssetAssignmentHistoryDTO = {
      assetId: asset.assetId!,
      userId: newUserId,
      assignedDate: new Date().toISOString(),
      unassignedDate: undefined
    };
    
    // Handle existing assignment and assign new user
    this.handleExistingAssignmentAndAssignNew(asset, newUserId, assignmentHistory)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.userAssignmentLoading.set(false))
      )
      .subscribe({
        next: (response: any) => {
          console.log('✅ User assignment completed:', response);
          this.showSuccess('User assigned successfully.');
          this.refreshAssetsData();
        },
        error: (error: any) => {
          console.error('❌ Error in user assignment:', error);
          this.showError('Failed to assign user. Please try again.');
        }
      });
  }

  /**
   * Execute user unassignment with history tracking
   */
  private executeUserUnassignment(asset: AssetWithFilterData): void {
    console.log('🔄 Executing user unassignment with history tracking...');
    
    if (!asset.currentUserId) {
      this.showError('No user is currently assigned to this asset.');
      return;
    }
    
    this.userAssignmentLoading.set(true);
    
    // First get current assignment to get the assignmentId and history, then unassign
    this.assignmentService.getCurrentUserAssignment(asset.assetId!)
      .pipe(
        switchMap((assignment) => {
          if (assignment && assignment.id) {
            // Create unassignment history entry
            const unassignmentHistory: AssetAssignmentHistoryDTO = {
              assetId: asset.assetId!,
              userId: asset.currentUserId!,
              assignedDate: assignment.assignedDate,
              unassignedDate: new Date().toISOString()
            };
            
            console.log('📝 Creating unassignment history:', unassignmentHistory);
            // TODO: Save unassignment history to API when available
            
            return this.assignmentService.unassignUserFromAsset(assignment.id);
          } else {
            throw new Error('No current assignment found for this asset');
          }
        }),
        takeUntil(this.destroy$),
        finalize(() => this.userAssignmentLoading.set(false))
      )
      .subscribe({
        next: (response: any) => {
          console.log('✅ User unassignment with history completed:', response);
          this.showSuccess('User unassigned successfully.');
          this.refreshAssetsData();
        },
        error: (error: any) => {
          console.error('❌ Error in user unassignment:', error);
          this.showError('Failed to unassign user. Please try again.');
        }
      });
  }

  /**
   * Validate and enforce business rules on form changes
   */
  onAssetFormChange(): void {
    if (!this.assetForm) return;
    
    const currentValues = this.assetForm.value;
    const status = currentValues.status;
    const currentUserId = currentValues.currentUserId;
    
    console.log('📝 Asset form change detected:', { status, currentUserId });
    
    // Auto-clear user assignment for disallowed statuses
    if (!this.isAssignmentAllowedForStatus(status) && currentUserId) {
      console.log('⚠️ Clearing user assignment due to status restriction');
      this.assetForm.patchValue({ currentUserId: null }, { emitEvent: false });
      this.showError(`User assignment cleared. Assignment not allowed for ${status} assets.`);
    }
    
    // Add form validators based on status
    this.updateFormValidators(status);
  }

  /**
   * Update form validators based on current status
   */
  private updateFormValidators(status: string): void {
    const userControl = this.assetForm.get('currentUserId');
    if (!userControl) return;
    
    if (!this.isAssignmentAllowedForStatus(status)) {
      // Disable user assignment for restricted statuses
      userControl.disable({ emitEvent: false });
      userControl.setValidators([]);
    } else {
      // Enable user assignment for allowed statuses
      userControl.enable({ emitEvent: false });
      // Add any necessary validators here
    }
    
    userControl.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Check if status change is valid based on current user assignment
   */
  private validateStatusChange(newStatus: string, currentUserId?: number): { isValid: boolean; message?: string } {
    if (newStatus === 'Active' && !currentUserId) {
      return {
        isValid: false,
        message: 'Cannot set status to Active without assigning a user.'
      };
    }
    
    return { isValid: true };
  }

  /**
   * Handle existing assignment and assign new user with proper history tracking
   */
  private handleExistingAssignmentAndAssignNew(asset: AssetWithFilterData, newUserId: number, assignmentHistory: AssetAssignmentHistoryDTO): Observable<any> {
    console.log('🔄 Handling existing assignment and creating new assignment with history tracking...');
    
    // Check if user is already assigned to prevent duplicate assignments
    if (asset.currentUserId === newUserId) {
      console.log('⚠️ User is already assigned to this asset, no change needed');
      return of({ message: 'User already assigned to this asset' });
    }
    
    // If there's an existing assignment, unassign first
    if (asset.currentUserId) {
      console.log(`🔄 Unassigning existing user ${asset.currentUserId} before assigning new user ${newUserId}`);
      
      return this.assignmentService.getCurrentUserAssignment(asset.assetId!)
        .pipe(
          switchMap((currentAssignment) => {
            if (currentAssignment && currentAssignment.id) {
              // Unassign current user and create history entry
              return this.assignmentService.unassignUserFromAsset(currentAssignment.id)
                .pipe(
                  switchMap(() => {
                    // Create unassignment history entry
                    const unassignmentHistory: AssetAssignmentHistoryDTO = {
                      assetId: asset.assetId!,
                      userId: asset.currentUserId!,
                      assignedDate: currentAssignment.assignedDate,
                      unassignedDate: new Date().toISOString()
                    };
                    
                    // Save unassignment history (mock for now)
                    console.log('📝 Creating unassignment history:', unassignmentHistory);
                    
                    // Now assign new user
                    return this.assignNewUserWithHistory(asset.assetId!, newUserId, assignmentHistory);
                  })
                );
            } else {
              // No current assignment found, proceed with new assignment
              return this.assignNewUserWithHistory(asset.assetId!, newUserId, assignmentHistory);
            }
          })
        );
    } else {
      // No existing assignment, proceed with new assignment
      return this.assignNewUserWithHistory(asset.assetId!, newUserId, assignmentHistory);
    }
  }

  /**
   * Assign new user and create history entry
   */
  private assignNewUserWithHistory(assetId: number, userId: number, assignmentHistory: AssetAssignmentHistoryDTO): Observable<any> {
    console.log('🔄 Assigning new user with history tracking...');
    
    const assignmentDTO: AssetUserAssignmentDTO = {
      assetId: assetId,
      userId: userId
    };
    
    return this.assignmentService.assignUserToAsset(assignmentDTO)
      .pipe(
        tap(() => {
          // Create assignment history entry (mock for now)
          console.log('📝 Creating assignment history:', assignmentHistory);
          // TODO: Call actual assignment history API when available
          // this.assignmentService.createAssignmentHistory(assignmentHistory)
        })
      );
  }

  /**
   * ✅ ENHANCED: Load asset status history for audit trail with comprehensive debugging
   */
  loadStatusHistory(assetId: number): void {
    console.log('📋 Loading status history for asset ID:', assetId);
    
    if (!assetId || assetId <= 0) {
      console.error('❌ Invalid asset ID provided:', assetId);
      this.showError('Invalid asset ID provided for status history');
      return;
    }

    this.statusHistoryLoading.set(true);
    this.statusChangeError.set(null);
    
    // Use the new paginated API for better performance
    console.log('🔍 Calling paginated status history API...');
    this.assetService.getAssetStatusHistoryPaginated(assetId, 0, 10, 'changeDate', 'DESC')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          console.log('🔄 Status history loading completed');
        this.statusHistoryLoading.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Status history loaded from paginated API:', response);
          
          // Validate response structure - handle paginated response
          if (!response) {
            console.warn('⚠️ Empty response from status history API');
            this.statusHistory.set([]);
          } else {
            // Extract content from paginated response
            let historyArray: any[] = [];
            
            if (Array.isArray(response.content)) {
              // Paginated response with content array
              historyArray = response.content;
              console.log(`📊 Found ${historyArray.length} status history records in paginated response`);
              console.log('📄 Pagination info:', {
                pageNumber: response.pageNumber || response.page,
                totalPages: response.totalPages,
                totalElements: response.totalElements,
                size: response.size
              });
            } else if (Array.isArray(response.history)) {
              // Legacy response format with history array
              historyArray = response.history;
              console.log(`📊 Found ${historyArray.length} status history records in legacy response`);
            } else if (Array.isArray(response)) {
              // Direct array response
              historyArray = response;
              console.log(`📊 Found ${historyArray.length} status history records in direct array response`);
            } else {
              console.warn('⚠️ Invalid response structure - no recognizable history array:', response);
              this.statusHistory.set([]);
              return;
            }
            
            // Validate each history record
            const validHistory = historyArray.filter(record => {
              if (!record.assetId || !record.status || !record.changeDate) {
                console.warn('⚠️ Invalid history record:', record);
                return false;
              }
              return true;
            });
            
            console.log(`✅ ${validHistory.length} valid history records after validation`);
            this.statusHistory.set(validHistory);
          }
          
          this.showStatusHistory.set(true);
        },
        error: (error) => {
          console.error('❌ Error loading status history from paginated API:', error);
          console.log('🔄 Attempting fallback to legacy API...');
          
          // Fallback to the original API
          this.assetService.getAssetStatusHistory(assetId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (history) => {
                console.log('✅ Status history loaded from fallback API:', history);
                
                if (!Array.isArray(history)) {
                  console.warn('⚠️ Fallback API returned non-array:', history);
                  this.statusHistory.set([]);
                  this.showError('Invalid status history data received');
                  return;
                }
                
        // Convert DTO to full history objects for backward compatibility
        const fullHistory: AssetStatusHistory[] = history.map(dto => ({
          assetId: assetId,
          status: dto.status,
          changedById: dto.changedById,
          changeDate: dto.changeDate,
          remarks: dto.remarks || undefined
        }));
                
                console.log(`📊 Converted ${fullHistory.length} history records from fallback API`);
        this.statusHistory.set(fullHistory);
        this.showStatusHistory.set(true);
      },
              error: (fallbackError) => {
                console.error('❌ Error with fallback status history API:', fallbackError);
                
                let errorMessage = 'Failed to load status history';
                if (fallbackError.status === 404) {
                  errorMessage = 'No status history found for this asset';
                } else if (fallbackError.status === 0) {
                  errorMessage = 'Backend service unavailable';
                }
                
                this.statusChangeError.set(errorMessage);
                this.showError(errorMessage);
                this.statusHistory.set([]);
              }
            });
      }
    });
  }

  /**
   * Toggle status history visibility (legacy method)
   */
  toggleStatusHistory(asset: AssetWithFilterData): void {
    if (this.showStatusHistory()) {
      this.showStatusHistory.set(false);
    } else {
      this.loadStatusHistory(asset.assetId!);
    }
  }

  /**
   * Check if status requires validation (for UI feedback)
   */
  requiresEmployee(status: string): boolean {
    return this.assetService.requiresUserAssignment(status);
  }

  /**
   * Check if status will unassign user (for UI feedback)
   */
  willUnassignUser(status: string): boolean {
    return this.assetService.shouldUnassignUser(status);
  }

  /**
   * Get status change validation message for UI
   */
  getStatusValidationMessage(newStatus: string, asset: AssetWithFilterData): string | null {
    const validation = this.assetService.validateStatusChange(newStatus, asset.currentUserId);
    return validation.isValid ? null : validation.error || null;
  }

  /**
   * Format date for status history display
   */
  formatStatusDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  /**
   * Get user name for status history display
   */
  getStatusHistoryUserName(userId: number): string {
    const user = this.users().find(u => u.id === userId);
    return user ? user.name : `User ${userId}`;
  }

  /**
   * ✅ NEW: Get display name for status (maps API values to user-friendly names)
   */
  getStatusDisplayName(status?: string): string {
    if (!status) return 'Unknown';
    
    // Find the display name from our mapping
    const statusKey = Object.keys(ASSET_STATUS).find(key => 
      ASSET_STATUS[key as keyof typeof ASSET_STATUS] === status
    );
    
    if (statusKey) {
      return ASSET_STATUS_DISPLAY[statusKey as keyof typeof ASSET_STATUS_DISPLAY];
    }
    
    // Fallback: convert status to title case
    return status.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * ✅ DEBUG: Test status mapping to ensure API/Display values are correct
   */
  private debugStatusMapping(): void {
    console.log('🔍 DEBUG: Status Mapping Test');
    console.log('='.repeat(50));
    
    console.log('📋 ASSET_STATUS (API values):');
    Object.entries(ASSET_STATUS).forEach(([key, value]) => {
      console.log(`  ${key}: "${value}"`);
    });
    
    console.log('\n📋 ASSET_STATUS_DISPLAY (UI values):');
    Object.entries(ASSET_STATUS_DISPLAY).forEach(([key, value]) => {
      console.log(`  ${key}: "${value}"`);
    });
    
    console.log('\n📋 Dropdown Options:');
    const options = this.statusDropdownOptions();
    options.forEach(option => {
      console.log(`  value: "${option.value}" → label: "${option.label}"`);
    });
    
    console.log('\n🧪 Testing getStatusDisplayName():');
    Object.values(ASSET_STATUS).forEach(apiValue => {
      const displayName = this.getStatusDisplayName(apiValue);
      console.log(`  "${apiValue}" → "${displayName}"`);
    });
    
    console.log('='.repeat(50));
  }

  // ✅ NEW: USER ASSIGNMENT METHODS

  /**
   * Open user assignment modal for an asset
   */
  openUserAssignmentModal(asset: AssetWithFilterData): void {
    console.log('🔗 Opening user assignment modal for asset:', asset.assetId);
    
    this.selectedAssetForUserAssignment.set(asset);
    this.showUserAssignmentModal.set(true);
    this.userAssignmentError.set(null);
    
    // Reset form with new structure
    this.userAssignmentForm.reset({
      userId: '',
      assignmentDate: new Date().toISOString().split('T')[0],
      userFilter: ''
    });
    
    // Initialize filtered users
    this.filteredUsers.set(this.activeUsers());
    this.userFilter.set('');
    
    // Load current assignment
    this.loadCurrentUserAssignment(asset.assetId!);
  }

  /**
   * Close user assignment modal
   */
  closeUserAssignmentModal(): void {
    this.showUserAssignmentModal.set(false);
    this.selectedAssetForUserAssignment.set(null);
    this.currentUserAssignment.set(null);
    this.userAssignmentError.set(null);
    this.userAssignmentForm.reset();
  }

  /**
   * Load current user assignment for an asset
   */
  private loadCurrentUserAssignment(assetId: number): void {
    this.userAssignmentLoading.set(true);
    
    this.assignmentService.getCurrentUserAssignment(assetId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.userAssignmentLoading.set(false))
      )
      .subscribe({
        next: (assignment) => {
          this.currentUserAssignment.set(assignment);
          console.log('📥 Current user assignment:', assignment);
          
          // Prefill form if assignment exists
          if (assignment) {
            this.userAssignmentForm.patchValue({
              userId: assignment.userId,
              remarks: assignment.remarks || ''
            });
            console.log('✅ Form prefilled with assignment data:', {
              userId: assignment.userId,
              remarks: assignment.remarks
            });
          } else {
            // Clear form if no assignment
            this.userAssignmentForm.reset();
            console.log('ℹ️ No current assignment found, form cleared');
          }
        },
        error: (error) => {
          console.error('❌ Error loading current assignment:', error);
          // Don't show error for 404 - it's expected when no assignment exists
          if (error.status !== 404) {
            this.userAssignmentError.set('Failed to load current assignment');
          } else {
            console.log('ℹ️ No assignment found (404) - this is normal');
            this.currentUserAssignment.set(null);
            this.userAssignmentForm.reset();
          }
        }
      });
  }

  /**
   * Handle user assignment form submission with conditional logic
   */
  handleUserAssignmentSubmit(): void {
    if (this.userAssignmentForm.invalid) {
      this.markFormGroupTouched(this.userAssignmentForm);
      return;
    }

    const selectedAsset = this.selectedAssetForUserAssignment();
    if (!selectedAsset) {
      this.showError('No asset selected for assignment');
      return;
    }

    const formValue = this.userAssignmentForm.value;
    const newUserId = formValue.userId ? +formValue.userId : null;

    // Use the new conditional logic method
    this.onAssetUserAssignment(selectedAsset, newUserId);
  }

  /**
   * Filter users by email or full name in assignment modal
   */
  onUserAssignmentFilterChange(filterValue: string): void {
    this.userFilter.set(filterValue);
    const users = this.activeUsers();
    
    if (!filterValue.trim()) {
      this.filteredUsers.set(users);
      return;
    }
    
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(filterValue.toLowerCase()) ||
      user.email.toLowerCase().includes(filterValue.toLowerCase())
    );
    
    this.filteredUsers.set(filtered);
  }

  /**
   * Clear user filter
   */
  clearUserFilter(): void {
    this.userFilter.set('');
    this.filteredUsers.set(this.activeUsers());
    this.userAssignmentForm.patchValue({ userFilter: '' });
  }

  /**
   * Assign user to asset using new API endpoint
   */
  onAssignUser(): void {
    if (this.userAssignmentForm.valid) {
      const selectedAsset = this.selectedAssetForUserAssignment();
      if (!selectedAsset) return;

      // Check if assignment is allowed
      if (!this.canAssignUser(selectedAsset)) {
        this.userAssignmentError.set('Cannot assign user. Asset status must be "In Stock"');
        return;
      }

      const formData = this.userAssignmentForm.value;
      const assignmentRequest: AssetUserAssignmentDTO = {
        assetId: selectedAsset.assetId!,
        userId: formData.userId,
        remarks: formData.remarks || undefined
      };

      this.userAssignmentLoading.set(true);

      // Mock implementation - replace with actual service method when available
      setTimeout(() => {
        this.userAssignmentLoading.set(false);
        this.onStatusChange(selectedAsset, 'ACTIVE', `User assigned: ${this.getUserName(formData.userId)}`);
        this.showSuccess(`User assigned successfully to ${selectedAsset.name} and status changed to Active`);
        this.closeUserAssignmentModal();
        this.loadAssets(); // Refresh to show the assignment and status change
      }, 1000);
    } else {
      this.markFormGroupTouched(this.userAssignmentForm);
    }
  }

  /**
   * Unassign user from asset
   */
  onUnassignUser(): void {
    const asset = this.selectedAssetForUserAssignment();
    if (!asset || !asset.currentUserId) {
      console.warn('No asset selected or asset not assigned to any user');
      return;
    }

    const currentUser = this.users().find(u => u.id === asset.currentUserId);
    const userName = currentUser ? currentUser.name : 'Unknown User';
    
    const confirmMessage = `Are you sure you want to unassign "${asset.name}" from ${userName}?`;
    
    if (confirm(confirmMessage)) {
      this.userAssignmentLoading.set(true);
      this.userAssignmentError.set(null);

      const unassignmentData = {
      assetId: asset.assetId!,
        remarks: `Unassigned from ${userName} via UI on ${new Date().toLocaleDateString()}`
      };

      // Mock implementation - replace with actual service method when available
      setTimeout(() => {
        this.userAssignmentLoading.set(false);
        console.log('✅ Asset unassigned successfully (mock)');
        this.showSuccess(`Asset "${asset.name}" unassigned from ${userName} successfully`);
        this.closeUserAssignmentModal();
          this.refreshAssetsData();
      }, 1000);
    }
  }

  // ✅ NEW: Inline "Add Tag" Methods

  /**
   * Show inline add tag input
   */
  showAddTagInput(): void {
    this.showAddTagInline.set(true);
    this.newTagName.set('');
    this.addTagError.set(null);
  }

  /**
   * Hide inline add tag input
   */
  hideAddTagInput(): void {
    this.showAddTagInline.set(false);
    this.newTagName.set('');
    this.addTagError.set(null);
  }

  /**
   * Add and assign new tag by name
   */
  onAddAndAssignTag(): void {
    const asset = this.selectedAssetForTagAssignment();
    const tagName = this.newTagName().trim();
    
    if (!asset) {
      this.addTagError.set('No asset selected');
      return;
    }

    if (!tagName || tagName.length === 0) {
      this.addTagError.set('Please enter a tag name');
      return;
    }

    if (tagName.length < 2) {
      this.addTagError.set('Tag name must be at least 2 characters');
      return;
    }

    if (tagName.length > 50) {
      this.addTagError.set('Tag name must be less than 50 characters');
      return;
    }

    console.log('🔗 Adding and assigning new tag:', { assetId: asset.assetId, tagName });
    this.addTagLoading.set(true);
    this.addTagError.set(null);

    const assignment: AssetTagAssignmentByNameDTO = {
      assetId: asset.assetId!,
      tagName: tagName,
      remarks: `Created and assigned from UI on ${new Date().toLocaleDateString()}`
    };

    this.assignmentService.assignTagToAssetByName(assignment)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.addTagLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Tag created and assigned successfully:', response);
          this.showSuccess(response.message || 'Tag created and assigned successfully');
          
          // Hide the inline input
          this.hideAddTagInput();
          
          // Refresh tag assignments to show the new tag
          this.loadAssetTagAssignments(asset.assetId!);
          
          // Refresh available tags list
          this.loadInitialAssignmentData();
          
          // Refresh assets to show updated tags in the main list
          this.refreshAssetsData();
        },
        error: (error) => {
          console.error('❌ Error creating and assigning tag:', error);
          console.error('❌ Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          
          // Show user-friendly error message
          let errorMessage = 'Failed to create and assign tag';
          if (error.status === 400) {
            errorMessage = 'Invalid tag name or tag already exists. Please try a different name.';
          } else if (error.status === 404) {
            errorMessage = 'Asset not found. Please refresh and try again.';
          } else if (error.status === 409) {
            errorMessage = 'Tag with this name already exists and is assigned to this asset.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.addTagError.set(errorMessage);
          this.showError(errorMessage);
        }
      });
  }

  /**
   * Handle Enter key press in tag name input
   */
  onTagNameKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onAddAndAssignTag();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.hideAddTagInput();
    }
  }

  /**
   * Load asset tag assignments
   */
  private loadAssetTagAssignments(assetId: number): void {
    if (!assetId) {
      console.warn('No asset ID provided for tag assignments');
      return;
    }

    this.tagAssignmentLoading.set(true);
    this.tagAssignmentError.set(null);

    // Mock implementation - replace with actual API call
    setTimeout(() => {
      const mockAssignments: AssetTagAssignment[] = [
        {
          id: 1,
          assetId: assetId,
          tagId: 1,
          tagName: 'High Priority',
          assignedDate: new Date().toISOString(),
          remarks: 'Auto-assigned based on asset type'
        }
      ];
      
      this.assignedTags.set(mockAssignments);
      this.tagAssignmentLoading.set(false);
    }, 500);
  }

  /**
   * ✅ NEW: Validate and debug filter configuration
   * This method helps debug filter dropdown options and form values
   */
  debugFilterConfiguration(): void {
    console.log('🔍 === FILTER CONFIGURATION DEBUG ===');
    
    // Check dropdown options
    console.log('📋 Status Filter Options:', this.statusFilterDropdownOptions());
    console.log('📋 Owner Type Filter Options:', this.ownerTypeFilterOptions());
    console.log('📋 Asset Types:', this.assetTypes().map(t => ({ id: t.id, name: t.name })));
    console.log('📋 Vendors:', this.vendors().map(v => ({ id: v.id, name: v.name })));
    
    // Check current form values
    console.log('📝 Current Form Values:', this.filterForm.value);
    console.log('📝 Current Filters Signal:', this.currentFilters());
    
    // Check configuration service values
    console.log('⚙️ Configuration Service Status Options:', this.configService.getAssetStatusesForFilter());
    console.log('⚙️ Configuration Service Owner Options:', this.configService.getOwnerTypesForFilter());
    
    console.log('🔍 === END FILTER DEBUG ===');
  }

  /**
   * ✅ NEW: Test filter functionality
   * This method can be called to test various filter combinations
   */
  testFilterFunctionality(): void {
    console.log('🧪 === COMPREHENSIVE FILTER TEST ===');
    
    // Test current form state
    console.log('📝 Current form values:', this.filterForm.value);
    console.log('📝 Current filters signal:', this.currentFilters());
    
    // Test vendor data
    console.log('🏢 Vendor data analysis:');
    const vendors = this.vendors();
    console.log('  - Total vendors loaded:', vendors.length);
    console.log('  - Vendor details:', vendors.map(v => ({ id: v.id, name: v.name, idType: typeof v.id })));
    
    // Test asset data
    console.log('📦 Asset data analysis:');
    const assets = this.assets();
    console.log('  - Total assets loaded:', assets.length);
    
    // Group assets by vendor ID
    const assetsByVendor = assets.reduce((acc, asset) => {
      const vendorId = asset.vendorId || 'null';
      if (!acc[vendorId]) acc[vendorId] = [];
      acc[vendorId].push({ id: asset.assetId, name: asset.name });
      return acc;
    }, {} as any);
    
    console.log('  - Assets grouped by vendor ID:', assetsByVendor);
    console.log('  - Vendor IDs in assets:', Object.keys(assetsByVendor));
    
    // Test specific vendor ID 4
    const vendor4Assets = assets.filter(a => a.vendorId === 4);
    console.log('🔍 Assets with vendor ID 4 (number or string):', vendor4Assets.length);
    if (vendor4Assets.length > 0) {
      console.log('  - Vendor 4 assets:', vendor4Assets.map(a => ({ 
        id: a.assetId, 
        name: a.name, 
        vendorId: a.vendorId, 
        vendorIdType: typeof a.vendorId 
      })));
    }
    
    // Test filter mapping
    console.log('🔄 Testing filter mapping:');
    const testFormValue = { vendor: '4' };
    const mappedFilter = {
      vendorId: testFormValue.vendor || undefined
    };
    console.log('  - Test form value:', testFormValue);
    console.log('  - Mapped filter:', mappedFilter);
    
    // Test backend parameter
    console.log('🌐 Backend parameter test:');
    console.log('  - Would send to backend: vendorId=4');
    console.log('  - Parameter type: string');
    
    console.log('✅ Filter test completed - check console for details');
  }

  /**
   * ✅ NEW: Test vendor filtering specifically
   */
  testVendorFiltering(vendorId: string): void {
    console.log(`🧪 Testing vendor filtering for ID: ${vendorId}`);
    
    // Manually set the filter
    this.filterForm.patchValue({ vendor: vendorId });
    
    // Log what should happen
    console.log('📋 Expected behavior:');
    console.log(`  - Form vendor field: ${vendorId}`);
    console.log(`  - Should map to: vendorId=${vendorId}`);
    console.log(`  - Should send to backend: ?vendorId=${vendorId}`);
    
    // Check if assets exist with this vendor
    const vendorIdNum = Number(vendorId);
    const matchingAssets = this.assets().filter(a => 
      a.vendorId === vendorIdNum
    );
    console.log(`  - Assets with vendor ID ${vendorId}:`, matchingAssets.length);
    
    if (matchingAssets.length === 0) {
      console.warn(`⚠️ No assets found with vendor ID ${vendorId}`);
      console.log('💡 This might be why filtering appears not to work');
    }
  }

  // ✅ NEW: Methods for collapsible sections
  toggleEditableSection(asset: AssetWithFilterData): void {
    if (!asset.assetId) return;
    const currentMap = this.editableSections();
    const newMap = new Map(currentMap);
    const isOpen = newMap.get(asset.assetId) || false;
    newMap.set(asset.assetId, !isOpen);
    this.editableSections.set(newMap);
  }

  isEditableSectionOpen(asset: AssetWithFilterData): boolean {
    if (!asset.assetId) return false;
    return this.editableSections().get(asset.assetId) || false;
  }

  togglePOSection(asset: AssetWithFilterData): void {
    if (!asset.assetId) return;
    const currentMap = this.poSections();
    const newMap = new Map(currentMap);
    const isOpen = newMap.get(asset.assetId) || false;
    newMap.set(asset.assetId, !isOpen);
    this.poSections.set(newMap);
  }

  isPOSectionOpen(asset: AssetWithFilterData): boolean {
    if (!asset.assetId) return false;
    return this.poSections().get(asset.assetId) || false;
  }

  // ✅ NEW: Download asset details functionality
  downloadAssetDetails(asset: AssetWithFilterData): void {
    // Create comprehensive asset details object
    const assetDetails = {
      'Asset Information': {
        'Name': asset.name,
        'Serial Number': asset.serialNumber,
        'IT Asset Code': asset.itAssetCode || 'N/A',
        'Status': this.getStatusDisplayName(asset.status),
        'Model': this.getModelName(asset.modelId),
        'Make': this.getMakeName(asset.makeId),
        'Asset Type': this.getAssetTypeName(asset.typeId),
        'OS': this.getOSName(asset.osId),
        'OS Version': this.getOSVersionName(asset.osVersionId)
      },
      'Network Information': {
        'MAC Address': asset.macAddress || 'N/A',
        'IPv4 Address': asset.ipv4Address || 'N/A',
        'Inventory Location': asset.inventoryLocation || 'N/A'
      },
      'Assignment Details': {
        'Assigned User': asset.currentUserId ? this.getUserName(asset.currentUserId) : 'Unassigned',
        'Assignment Date': asset.currentUserId ? new Date().toLocaleDateString() : 'N/A'
      },
      'Purchase Information': {
        'PO Number': asset.poNumber || 'N/A',
        'Invoice Number': asset.invoiceNumber || 'N/A',
        'Vendor': this.getname(asset.vendorId),
        'Acquisition Date': asset.acquisitionDate ? new Date(asset.acquisitionDate).toLocaleDateString() : 'N/A',
        'Acquisition Price': asset.acquisitionPrice ? `₹${asset.acquisitionPrice.toLocaleString('en-IN')}` : 'N/A',
        'Rental Amount': asset.rentalAmount ? `₹${asset.rentalAmount.toLocaleString('en-IN')}` : 'N/A',
        'Owner Type': asset.ownerType || 'N/A',
        'Acquisition Type': asset.acquisitionType || 'N/A'
      },
      'Financial Details': {
        'Current Price': asset.currentPrice ? `₹${asset.currentPrice.toLocaleString('en-IN')}` : 'N/A',
        'Depreciation %': asset.depreciationPct ? `${asset.depreciationPct}%` : 'N/A',
        'Min Contract Period': asset.minContractPeriod || 'N/A',
        'Lease End Date': asset.leaseEndDate ? new Date(asset.leaseEndDate).toLocaleDateString() : 'N/A'
      },
      'Warranty Information': {
        'Warranty Expiry': asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'N/A'
      }
    };

    // Generate CSV content
    const csvContent = this.generateCSV(assetDetails, asset);
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `asset_${asset.name.replace(/[^a-z0-9]/gi, '_')}_${asset.serialNumber}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    this.showSuccess(`Asset details for ${asset.name} downloaded successfully`);
  }

  private generateCSV(assetDetails: any, asset: AssetWithFilterData): string {
    let csvContent = `Asset Details Report\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n`;
    csvContent += `Asset: ${asset.name} (${asset.serialNumber})\n\n`;

    Object.keys(assetDetails).forEach(section => {
      csvContent += `${section}\n`;
      csvContent += `${'='.repeat(section.length)}\n`;
      
      Object.entries(assetDetails[section]).forEach(([key, value]) => {
        csvContent += `${key},${value}\n`;
      });
      
      csvContent += `\n`;
    });

    return csvContent;
  }

  // ✅ NEW: Assignment history modal
  openAssignmentHistoryModal(asset: AssetWithFilterData): void {
    console.log('📋 Opening assignment history for asset:', asset.assetId);
    this.selectedAssetForAssignmentHistory.set(asset);
    this.showAssignmentHistoryModal.set(true);
    
    if (asset.assetId) {
      this.loadAssignmentHistory(asset.assetId);
    }
  }

  // ✅ ENHANCED: Load assignment history with comprehensive debugging and error handling
  private loadAssignmentHistory(assetId: number): void {
    console.log('📋 Loading assignment history for asset ID:', assetId);
    
    if (!assetId || assetId <= 0) {
      console.error('❌ Invalid asset ID provided for assignment history:', assetId);
      this.showError('Invalid asset ID provided for assignment history');
      return;
    }

    this.assignmentHistoryLoading.set(true);
    this.userAssignmentError.set(null);
    
    console.log('🔍 Calling assignment history API endpoint...');
    this.assetService.getAssetAssignmentHistory(assetId, 0, 50) // Load up to 50 records
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          console.log('🔄 Assignment history loading completed');
          this.assignmentHistoryLoading.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Assignment history loaded from API:', response);
          
          // Validate response structure - handle paginated response
          if (!response) {
            console.warn('⚠️ Empty response from assignment history API');
            this.assignmentHistory.set([]);
          } else {
            // Extract content from paginated response
            let assignmentArray: any[] = [];
            
            if (Array.isArray(response.content)) {
              // Paginated response with content array
              assignmentArray = response.content;
              console.log(`📊 Found ${assignmentArray.length} assignment history records in paginated response`);
              console.log('📄 Pagination info:', {
                pageNumber: response.pageNumber || response.page,
                totalPages: response.totalPages,
                totalElements: response.totalElements,
                size: response.size
              });
            } else if (Array.isArray(response.history)) {
              // Legacy response format with history array
              assignmentArray = response.history;
              console.log(`📊 Found ${assignmentArray.length} assignment history records in legacy response`);
            } else if (Array.isArray(response)) {
              // Direct array response
              assignmentArray = response;
              console.log(`📊 Found ${assignmentArray.length} assignment history records in direct array response`);
            } else {
              console.warn('⚠️ Invalid response structure - no recognizable assignment array:', response);
              this.assignmentHistory.set([]);
              return;
            }
            
            // Validate each assignment record
            const validAssignments = assignmentArray.filter(record => {
              if (!record.assetId || !record.userId || !record.assignedDate) {
                console.warn('⚠️ Invalid assignment record:', record);
                return false;
              }
              return true;
            });
            
            console.log(`✅ ${validAssignments.length} valid assignment records after validation`);
            
            // Enhance records with user names for display
            const enhancedAssignments = validAssignments.map(assignment => ({
              ...assignment,
              userName: this.getUserName(assignment.userId),
              assignedByName: assignment.assignedById ? this.getUserName(assignment.assignedById) : 'System',
              unassignedByName: assignment.unassignedById ? this.getUserName(assignment.unassignedById) : undefined
            }));
            
            this.assignmentHistory.set(enhancedAssignments);
          }
        },
        error: (error) => {
          console.error('❌ Error loading assignment history from API:', error);
          
          let errorMessage = 'Failed to load assignment history';
          if (error.status === 404) {
            errorMessage = 'No assignment history found for this asset';
            console.log('ℹ️ Asset has no assignment history (404)');
            this.assignmentHistory.set([]); // Empty array for 404 is acceptable
          } else if (error.status === 0) {
            errorMessage = 'Backend service unavailable';
            console.error('🚨 Backend service unavailable for assignment history');
          } else if (error.status === 500) {
            errorMessage = 'Server error while loading assignment history';
            console.error('🚨 Server error for assignment history');
          }
          
          this.userAssignmentError.set(errorMessage);
          this.showError(errorMessage);
          
          // Only set empty array if not a 404 (which is acceptable)
          if (error.status !== 404) {
            this.assignmentHistory.set([]);
          }
        }
      });
  }

  // ✅ NEW: Check if user can be assigned (only when status is instock)
  canAssignUser(asset: AssetWithFilterData): boolean {
    return asset.status.toLowerCase() === 'instock' || asset.status.toLowerCase() === 'in stock';
  }

  // ✅ NEW: Show PO Details modal
  showPODetails(poNumber: string): void {
    this.selectedPOForDetails.set(poNumber);
    this.loadPODetailsForModal(poNumber);
    this.showPODetailsModal.set(true);
  }

  // ✅ ENHANCED: Load PO details for the info modal with proper API call and debugging
  private loadPODetailsForModal(poNumber: string): void {
    console.log('🔍 Loading PO details for modal, PO Number:', poNumber);
    
    if (!poNumber || !poNumber.trim()) {
      console.error('❌ Invalid PO Number provided:', poNumber);
      this.showError('Invalid PO Number provided');
      return;
    }

    this.poDetailsLoading.set(true);
    this.poDetailsError.set(null);
    
    // First, try to get PO details from the API
    this.assetService.getPODetailsByNumber(poNumber.trim())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.poDetailsLoading.set(false))
      )
      .subscribe({
        next: (poDetails: PODetails) => {
          console.log('✅ PO details loaded from API:', poDetails);
          this.selectedPODetails.set(poDetails);
          
          // Validate required fields
          if (!poDetails.poNumber) {
            console.warn('⚠️ PO details missing poNumber field');
          }
          if (!poDetails.acquisitionType) {
            console.warn('⚠️ PO details missing acquisitionType field');
          }
          if (!poDetails.vendorId) {
            console.warn('⚠️ PO details missing vendorId field');
          }
        },
        error: (error) => {
          console.error('❌ Error loading PO details from API:', error);
          
          // Fallback: Try to find PO details from existing purchase orders
          console.log('🔄 Falling back to local PO data...');
          const po = this.purchaseOrders().find(p => p.poNumber === poNumber);
          
                     if (po) {
             console.log('✅ Found PO in local data:', po);
             // Use actual PO data with fallback values
             const details: PODetails = {
               poNumber: po.poNumber,
               acquisitionType: po.acquisitionType || 'BOUGHT',
               acquisitionDate: new Date().toISOString().split('T')[0], // Default to today
               invoiceNumber: `INV-${po.poNumber}`, // Generate invoice number
               acquisitionPrice: 50000, // Default value
               vendorId: po.vendorId || 1,
               ownerType: po.ownerType || 'CELCOM',
               leaseEndDate: '', // Default empty
               minContractPeriod: 12, // Default 12 months
               rentalAmount: 0, // Default 0
               currentPrice: 50000, // Default value
               totalDevices: 1
             };
             this.selectedPODetails.set(details);
             console.log('✅ Using fallback PO details:', details);
           } else {
            console.error('❌ PO not found in local data either');
            this.poDetailsError.set(`PO Number "${poNumber}" not found`);
            this.showError(`PO details not found for "${poNumber}". Please check if the PO number is correct.`);
          }
        }
      });
  }

  // ✅ NEW: PO Number change with confirmation
  onPONumberChange(asset: AssetWithFilterData, newPONumber: string): void {
    if (newPONumber === (asset.poNumber || '')) {
      return; // No change
    }

    const message = newPONumber 
      ? `Are you sure you want to change PO Number from "${asset.poNumber || 'None'}" to "${newPONumber}"?`
      : `Are you sure you want to remove the PO Number "${asset.poNumber}"?`;

    if (confirm(message)) {
      // Create updated asset object
      const updatedAsset: Asset = {
        ...asset,
        poNumber: newPONumber || undefined
      };

      // Call the asset service to update
      this.assetService.updateAsset(updatedAsset.assetId!, updatedAsset).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          this.showSuccess(`PO Number updated successfully`);
          this.loadAssets(); // Refresh the assets list
        },
        error: (error) => {
          console.error('Error updating PO Number:', error);
          this.showError('Failed to update PO Number. Please try again.');
          // Revert the dropdown selection
          this.loadAssets();
        }
      });
    } else {
      // User cancelled - revert the dropdown
      // Force refresh to reset the dropdown value
      this.triggerChangeDetection();
    }
  }

  // ✅ NEW: Handle filter changes for specific filters
  onModelFilterChange(modelId: string): void {
    console.log('🔧 Model filter changed:', modelId);
    this.filterForm.patchValue({ model: modelId }, { emitEvent: true });
  }

  onOSVersionFilterChange(osVersionId: string): void {
    console.log('💾 OS Version filter changed:', osVersionId);
    this.filterForm.patchValue({ osVersion: osVersionId }, { emitEvent: true });
  }

  onStatusFilterChange(status: string): void {
    console.log('📊 Status filter changed:', status);
    this.filterForm.patchValue({ status: status }, { emitEvent: true });
  }

  onAssignmentStatusFilterChange(assignmentStatus: string): void {
    console.log('👤 Assignment Status filter changed:', assignmentStatus);
    this.filterForm.patchValue({ assignmentStatus: assignmentStatus }, { emitEvent: true });
  }

  // ✅ NEW: Get current filter summary for UI display
  getFilterSummary(): string {
    const filters = this.currentFilters();
    const activeFilters: string[] = [];

    if (filters.search) activeFilters.push(`Search: "${filters.search}"`);
    if (filters.status) activeFilters.push(`Status: ${filters.status}`);
    if (filters.model) activeFilters.push(`Model: ${this.getModelName(Number(filters.model))}`);
    if (filters.osVersion) activeFilters.push(`OS: ${this.getOSVersionName(Number(filters.osVersion))}`);
    if (filters.assignmentStatus) activeFilters.push(`Assignment: ${filters.assignmentStatus}`);
    if (filters.ownership) activeFilters.push(`Owner: ${filters.ownership}`);

    return activeFilters.length > 0 ? activeFilters.join(', ') : 'No filters applied';
  }



  // ✅ NEW: Get total pages for pagination
  getTotalPages(): number {
    return Math.ceil(this.totalAssets() / this.pageSize()) || 1;
  }

  // ✅ NEW: Check if has previous page
  hasPreviousPage(): boolean {
    return this.currentPage() > 0;
  }

  // ✅ NEW: Check if has next page
  hasNextPage(): boolean {
    return this.currentPage() < this.getTotalPages() - 1;
  }

  // ✅ NEW: Go to previous page
  goToPreviousPage(): void {
    if (this.hasPreviousPage()) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  // ✅ NEW: Go to next page
  goToNextPage(): void {
    if (this.hasNextPage()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  // Asset count methods for summary card
  getActiveAssetCount(): number {
    return this.filteredAssets().filter(asset => asset.status?.toLowerCase() === 'active' || asset.status?.toLowerCase() === 'instock').length;
  }

  getInactiveAssetCount(): number {
    return this.filteredAssets().filter(asset => asset.status?.toLowerCase() === 'inactive' || asset.status?.toLowerCase() === 'disposed').length;
  }

  // ✅ PO Selection Modal Methods
  openPOSelectionModal(asset: AssetWithFilterData): void {
    console.log('🔍 Opening PO Selection Modal for asset:', asset);
    this.selectedAssetForPO.set(asset);
    this.selectedPONumber.set(asset.poNumber || '');
    this.poSearchTerm.set('');
    this.showPOSelectionModal.set(true);
    
    // Load PO numbers for this asset
    this.loadPONumbersByAsset(asset.assetId!);
  }

  closePOSelectionModal(): void {
    this.showPOSelectionModal.set(false);
    this.selectedAssetForPO.set(null);
    this.selectedPONumber.set('');
    this.poSearchTerm.set('');
    this.poSelectionLoading.set(false);
  }

  filterPONumbers(): void {
    // The filtering is handled by the computed property
    // This method is called on input change to trigger change detection
    const searchTerm = this.poSearchTerm();
    const filteredCount = this.filteredPONumbers().length;
    
    console.log('🔍 Filtering PO numbers:', { searchTerm, filteredCount });
    console.log('📋 Filtered POs:', this.filteredPONumbers().map(po => po.poNumber));
    
    this.cdr.detectChanges();
  }

  // ✅ Debug Method: Validate Component State
  debugPOSelectionState(): void {
    console.log('🐛 PO Selection Modal Debug State:');
    console.log('- Modal Open:', this.showPOSelectionModal());
    console.log('- Selected Asset:', this.selectedAssetForPO());
    console.log('- Selected PO Number:', this.selectedPONumber());
    console.log('- Search Term:', this.poSearchTerm());
    console.log('- Loading:', this.poSelectionLoading());
    console.log('- All POs Count:', this.purchaseOrders().length);
    console.log('- Filtered POs Count:', this.filteredPONumbers().length);
    console.log('- Filtered POs:', this.filteredPONumbers());
  }

  // ✅ COMPREHENSIVE DEBUG METHOD: Test all functionality
  debugAllFunctionality(): void {
    console.group('🔍 COMPREHENSIVE ASSET COMPONENT DEBUG');
    
    // 1. Test PO Selection Modal
    console.group('📋 PO Selection Modal Debug');
    this.debugPOSelectionState();
    console.groupEnd();
    
    // 2. Test Status History
    console.group('📊 Status History Debug');
    const firstAsset = this.filteredAssets()[0];
    if (firstAsset) {
      console.log('Testing status history for first asset:', firstAsset.name);
      this.loadStatusHistory(firstAsset.assetId!);
    } else {
      console.warn('No assets available for status history test');
    }
    console.groupEnd();
    
    // 3. Test Assignment History
    console.group('👤 Assignment History Debug');
    if (firstAsset) {
      console.log('Testing assignment history for first asset:', firstAsset.name);
      this.loadAssignmentHistory(firstAsset.assetId!);
    } else {
      console.warn('No assets available for assignment history test');
    }
    console.groupEnd();
    
    // 4. Test PO Details Loading
    console.group('🏷️ PO Details Debug');
    const assetsWithPO = this.filteredAssets().filter(a => a.poNumber);
    if (assetsWithPO.length > 0) {
      const testPO = assetsWithPO[0].poNumber!;
      console.log('Testing PO details loading for PO:', testPO);
      this.loadPODetailsForModal(testPO);
    } else {
      console.warn('No assets with PO numbers found for PO details test');
    }
    console.groupEnd();
    
    // 5. Test Data Validation
    console.group('✅ Data Validation Debug');
    console.log('Total Assets:', this.filteredAssets().length);
    console.log('Total POs:', this.purchaseOrders().length);
    console.log('Total Users:', this.users().length);
    console.log('Assets with PO Numbers:', this.filteredAssets().filter(a => a.poNumber).length);
    console.log('Assets without PO Numbers:', this.filteredAssets().filter(a => !a.poNumber).length);
    
    // Validate API endpoints
    console.log('🔍 API Endpoint Validation:');
    console.log('- Status History API: /api/assets/{id}/status-history');
    console.log('- Assignment History API: /api/assets/{id}/assignment-history');
    console.log('- PO Details API: /api/asset-pos/po/{poNumber}');
    console.groupEnd();
    
    console.groupEnd();
  }

  // ✅ Quick Test Methods for Individual Features
  testStatusHistoryModal(assetId?: number): void {
    const testAssetId = assetId || this.filteredAssets()[0]?.assetId;
    if (!testAssetId) {
      console.error('❌ No asset ID provided for status history test');
      return;
    }
    
    console.log('🧪 Testing Status History Modal for asset ID:', testAssetId);
    const asset = this.filteredAssets().find(a => a.assetId === testAssetId);
    if (asset) {
      this.openStatusHistoryModal(asset);
    }
  }

  testAssignmentHistoryModal(assetId?: number): void {
    const testAssetId = assetId || this.filteredAssets()[0]?.assetId;
    if (!testAssetId) {
      console.error('❌ No asset ID provided for assignment history test');
      return;
    }
    
    console.log('🧪 Testing Assignment History Modal for asset ID:', testAssetId);
    const asset = this.filteredAssets().find(a => a.assetId === testAssetId);
    if (asset) {
      this.openAssignmentHistoryModal(asset);
    }
  }

  testPOSelectionModal(assetId?: number): void {
    const testAssetId = assetId || this.filteredAssets()[0]?.assetId;
    if (!testAssetId) {
      console.error('❌ No asset ID provided for PO selection test');
      return;
    }
    
    console.log('🧪 Testing PO Selection Modal for asset ID:', testAssetId);
    const asset = this.filteredAssets().find(a => a.assetId === testAssetId);
    if (asset) {
      this.openPOSelectionModal(asset);
    }
  }

  onPOSelectionChange(): void {
    const selectedPO = this.selectedPONumber();
    console.log('📋 PO selected:', selectedPO);
    
    if (selectedPO) {
      console.log('🔄 Auto-populating PO fields for:', selectedPO);
      // Auto-populate PO-related fields
      this.autoFillPODetailsRealTime(selectedPO);
    } else {
      console.log('❌ No PO selected, clearing fields');
    }
  }

  // ✅ ENHANCED: Load PO Numbers by Asset ID with proper validation and debugging
  loadPONumbersByAsset(assetId: number): void {
    console.log('🔍 Fetching PO numbers for asset ID:', assetId);
    
    if (!assetId || assetId <= 0) {
      console.error('❌ Invalid asset ID provided for PO loading:', assetId);
      this.showError('Invalid asset ID provided');
      return;
    }

    // Find the asset to validate it exists
    const asset = this.filteredAssets().find(a => a.assetId === assetId);
    if (!asset) {
      console.error('❌ Asset not found with ID:', assetId);
      this.showError('Asset not found');
      return;
    }

    console.log('✅ Asset found:', { id: asset.assetId, name: asset.name, currentPO: asset.poNumber });
    
    this.poSelectionLoading.set(true);
    
    // Check if asset already has a valid PO number
    if (asset.poNumber) {
      console.log('ℹ️ Asset already has PO number:', asset.poNumber);
      
      // Validate the current PO number exists in our PO list
      const currentPO = this.purchaseOrders().find(po => po.poNumber === asset.poNumber);
      if (!currentPO) {
        console.warn('⚠️ Current PO number not found in available POs:', asset.poNumber);
      } else {
        console.log('✅ Current PO number is valid:', currentPO);
      }
    }
    
    // For now, use all available PO numbers
    // In a real implementation, you might want to call:
    // this.assetService.getPONumbersByAsset(assetId) or
    // this.assetService.getAvailablePONumbers() to get POs that can be assigned
    
    console.log('📋 Loading available PO numbers...');
    
    // Simulate API call delay and validate PO data
    setTimeout(() => {
      const availablePOs = this.purchaseOrders();
      console.log(`📊 Found ${availablePOs.length} total PO numbers`);
      
      if (availablePOs.length === 0) {
        console.warn('⚠️ No PO numbers available');
        this.showError('No Purchase Orders available. Please create a PO first.');
      } else {
        // Log PO details for debugging
        console.log('📋 Available PO numbers:', availablePOs.map(po => ({
          poNumber: po.poNumber,
          acquisitionType: po.acquisitionType,
          vendorId: po.vendorId,
          ownerType: po.ownerType
        })));
        
        // Validate each PO has required fields
        const validPOs = availablePOs.filter(po => {
          if (!po.poNumber || !po.poNumber.trim()) {
            console.warn('⚠️ Invalid PO - missing poNumber:', po);
            return false;
          }
          return true;
        });
        
        console.log(`✅ ${validPOs.length} valid PO numbers after validation`);
        
        if (validPOs.length === 0) {
          this.showError('No valid Purchase Orders found');
        }
      }
      
      this.poSelectionLoading.set(false);
      
      // Trigger change detection to update the UI
      this.cdr.detectChanges();
    }, 500); // Reduced delay for better UX
  }

  confirmPOSelection(): void {
    const asset = this.selectedAssetForPO();
    const newPONumber = this.selectedPONumber();
    
    console.log('💾 Confirming PO selection:', { asset: asset?.name, newPONumber, currentPO: asset?.poNumber });
    
    if (!asset) {
      console.error('❌ No asset selected for PO update');
      return;
    }

    this.poSelectionLoading.set(true);
    
    // First, fetch and auto-populate the PO-related fields
    if (newPONumber) {
      console.log('🔄 Auto-populating PO fields for:', newPONumber);
      this.loadPODetailsAndUpdateAsset(asset, newPONumber);
    } else {
      console.log('🗑️ Removing PO from asset');
      this.updateAssetPONumber(asset, '');
    }
  }

  // ✅ Load PO Details and Update Asset
  private loadPODetailsAndUpdateAsset(asset: AssetWithFilterData, poNumber: string): void {
    console.log('🔍 Loading PO details for:', poNumber);
    
    // Find the PO details from available POs
    const selectedPO = this.purchaseOrders().find(po => po.poNumber === poNumber);
    
    if (selectedPO) {
      console.log('📋 Found PO details:', selectedPO);
      
      // Create updated asset with PO-related fields
      const updatedAsset: Asset = {
        ...asset,
        poNumber: poNumber,
        // Auto-populate related fields if they exist in the PO
        // These would typically come from your PO API response
        // invoiceNumber: selectedPO.invoiceNumber,
        // acquisitionDate: selectedPO.acquisitionDate,
        // vendorId: selectedPO.vendorId,
        // etc.
      };
      
      console.log('🔄 Updating asset with PO details:', updatedAsset);
      this.updateAssetPONumber(asset, poNumber, updatedAsset);
    } else {
      console.warn('⚠️ PO details not found for:', poNumber);
      this.updateAssetPONumber(asset, poNumber);
    }
  }

  // ✅ Update Asset PO Number
  private updateAssetPONumber(asset: AssetWithFilterData, newPONumber: string, updatedAsset?: AssetWithFilterData): void {
    const message = newPONumber 
      ? `Are you sure you want to change PO Number from "${asset.poNumber || 'None'}" to "${newPONumber}"? This will auto-populate related PO fields.`
      : `Are you sure you want to remove the PO Number "${asset.poNumber}"?`;

    if (confirm(message)) {
      const assetToUpdate = updatedAsset || {
        ...asset,
        poNumber: newPONumber || undefined
      };

      console.log('📤 Sending asset update to server:', assetToUpdate);

      // Call the asset service to update
      this.assetService.updateAsset(assetToUpdate.assetId!, assetToUpdate).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          console.log('✅ Asset updated successfully:', response);
          this.showSuccess(`PO Number updated and related fields auto-populated successfully`);
          
          // Update the local asset data immediately for better UX
          this.updateLocalAssetData(assetToUpdate);
          
          // Refresh the assets list
          this.loadAssets();
          this.closePOSelectionModal();
        },
        error: (error) => {
          console.error('❌ Error updating PO Number:', error);
          this.showError('Failed to update PO Number. Please try again.');
          this.poSelectionLoading.set(false);
        }
      });
    } else {
      console.log('🚫 User cancelled PO update');
      this.closePOSelectionModal();
    }
  }

  // ✅ Update Local Asset Data for Immediate UI Response
  private updateLocalAssetData(updatedAsset: AssetWithFilterData): void {
    console.log('🔄 Updating local asset data for immediate UI response');
    
    // Find and update the asset in the current assets list
    const currentAssets = this.allAssets();
    const assetIndex = currentAssets.findIndex(a => a.assetId === updatedAsset.assetId);
    
    if (assetIndex !== -1) {
      // Update the asset in place
      currentAssets[assetIndex] = { ...currentAssets[assetIndex], ...updatedAsset };
      console.log('✅ Local asset data updated');
      
      // Trigger change detection
      this.cdr.detectChanges();
    }
  }

  // ✅ Enhanced Status Color Coding
  getStatusColorClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'in stock':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'in repair':
        return 'bg-yellow-100 text-yellow-800';
      case 'broken':
        return 'bg-red-100 text-red-800';
      case 'ceased':
        return 'bg-gray-200 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get warranty status for an asset
   */
  getWarrantyStatus(asset: AssetWithFilterData): 'VALID' | 'EXPIRED' | 'EXPIRING_SOON' | 'N/A' {
    if (!asset.warrantyExpiry) return 'N/A';
    return AssetHelper.getWarrantyStatus(asset.warrantyExpiry) as 'VALID' | 'EXPIRED' | 'EXPIRING_SOON' | 'N/A';
  }

  /**
   * Get license status for an asset
   */
  getLicenseStatus(asset: AssetWithFilterData): 'VALID' | 'EXPIRED' | 'EXPIRING_SOON' | 'N/A' {
    if (!asset.licenseValidityPeriod) return 'N/A';
    
    // Convert Date to string if needed
    const validityPeriod = asset.licenseValidityPeriod instanceof Date 
      ? asset.licenseValidityPeriod.toISOString().split('T')[0] 
      : asset.licenseValidityPeriod;
      
    return AssetHelper.getLicenseStatus(validityPeriod) as 'VALID' | 'EXPIRED' | 'EXPIRING_SOON' | 'N/A';
  }

  /**
   * Get warranty badge CSS classes
   */
  getWarrantyBadgeClass(asset: AssetWithFilterData): string {
    const status = this.getWarrantyStatus(asset);
    return AssetHelper.getWarrantyBadgeClass(status);
  }

  /**
   * Get license badge CSS classes
   */
  getLicenseBadgeClass(asset: AssetWithFilterData): string {
    const status = this.getLicenseStatus(asset);
    return AssetHelper.getLicenseBadgeClass(status);
  }

  /**
   * Get warranty status display text
   */
  getWarrantyStatusDisplay(asset: AssetWithFilterData): string {
    const status = this.getWarrantyStatus(asset);
    switch (status) {
      case 'VALID':
        return 'Valid';
      case 'EXPIRED':
        return 'Expired';
      case 'EXPIRING_SOON':
        return 'Expiring Soon';
      default:
        return 'N/A';
    }
  }

  /**
   * Get license status display text
   */
  getLicenseStatusDisplay(asset: AssetWithFilterData): string {
    const status = this.getLicenseStatus(asset);
    switch (status) {
      case 'VALID':
        return 'Valid';
      case 'EXPIRED':
        return 'Expired';
      case 'EXPIRING_SOON':
        return 'Expiring Soon';
      default:
        return 'N/A';
    }
  }

  /**
   * Check if software fields should be shown for an asset
   */
  isSoftwareAsset(asset: AssetWithFilterData): boolean {
    return asset.assetCategory === 'SOFTWARE';
  }

  /**
   * Check if hardware fields should be shown for an asset
   */
  isHardwareOrPeripheralAsset(asset: AssetWithFilterData): boolean {
    return asset.assetCategory === 'HARDWARE';
  }

  // PO Selection Modal state
  showPOSelectionModal = signal(false);
  selectedAssetForPO = signal<AssetWithFilterData | null>(null);
  selectedPONumber = signal<string>('');
  poSearchTerm = signal<string>('');
  filteredPONumbers = computed(() => {
    const searchTerm = this.poSearchTerm().toLowerCase();
    if (!searchTerm) {
      return this.purchaseOrders();
    }
    return this.purchaseOrders().filter(po => 
      po.poNumber.toLowerCase().includes(searchTerm)
    );
  });
  poSelectionLoading = signal(false);

  // Debug methods for form troubleshooting
  debugFormState(): void {
    console.log('🔍 FORM DEBUG STATE:');
    console.log('Form Valid:', this.assetForm.valid);
    console.log('Form Value:', this.assetForm.value);
    console.log('Form Errors:', this.getFormErrors());
    console.log('Dropdown Data:', {
      users: this.users().length,
      vendors: this.vendors().length,
      assetModels: this.assetModelsWithDetails().length,
      osVersions: this.osVersions().length,
      dropdownOptions: this.dropdownOptions()
    });
    console.log('Field Visibility:', {
      showSoftwareFields: this.showSoftwareFields(),
      showHardwareFields: this.showHardwareFields(),
      selectedCategory: this.selectedAssetCategory()
    });
  }

  getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.assetForm.controls).forEach(key => {
      const control = this.assetForm.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  testFormSubmission(): void {
    console.log('🧪 Testing form submission...');
    this.debugFormState();
    
    if (this.assetForm.valid) {
      console.log('✅ Form is valid, proceeding with submission');
      this.onSubmitAsset();
    } else {
      console.log('❌ Form is invalid, marking fields as touched');
      this.markFormGroupTouched(this.assetForm);
      this.showError('Form validation failed. Please check all required fields.');
    }
  }

  // Software License User Assignment Properties
  selectedLicenseUsers = signal<User[]>([]);
  licenseUserSearchTerm = '';
  showLicenseUserDropdown = signal(false);
  
  // License Validity Period Calculation
  licenseValidityMonths = signal<number | null>(null);
  filteredLicenseUsers = computed(() => {
    const searchTerm = this.licenseUserSearchTerm.toLowerCase();
    const selectedIds = this.selectedLicenseUsers().map(u => u.id);
    
    return this.users().filter(user => {
      // Exclude already selected users
      if (selectedIds.includes(user.id)) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        return user.name.toLowerCase().includes(searchTerm) ||
               user.email.toLowerCase().includes(searchTerm);
      }
      
      return true;
    });
  });

  // Software Assignment Methods
  showSoftwareAssignmentSection(): boolean {
    return this.assetForm.get('assetCategory')?.value === 'SOFTWARE';
  }

  // 🔥 NEW: Software License User Assignment Methods
  showSoftwareLicenseAssignment(): boolean {
    return this.assetForm.get('assetCategory')?.value === 'SOFTWARE';
  }

  isLicenseUserAssignmentDisabled(): boolean {
    return false; // Always allow license user assignment for software
  }

  getSelectedLicenseUsers(): User[] {
    return this.selectedLicenseUsers();
  }

  isLicenseUserSelected(userId: number): boolean {
    return this.selectedLicenseUsers().some(user => user.id === userId);
  }

  isLicenseAssignmentLimitReached(): boolean {
    return false; // No limit on license assignments
  }

  getLicenseUserPlaceholder(): string {
    if (this.selectedLicenseUsers().length === 0) {
      return 'Search and select users for license assignment...';
    }
    return 'Add more users...';
  }

  selectLicenseUser(user: User): void {
    if (!this.isLicenseUserSelected(user.id) && !this.isLicenseAssignmentLimitReached()) {
      this.selectedLicenseUsers.update(current => [...current, user]);
      this.licenseUserSearchTerm = '';
      this.showLicenseUserDropdown.set(false);
    }
  }

  removeLicenseUser(userId: number): void {
    this.selectedLicenseUsers.update(current => current.filter(user => user.id !== userId));
  }

  onLicenseUserSearch(event: any): void {
    const searchTerm = event.target.value;
    this.licenseUserSearchTerm = searchTerm;
    if (!this.isLicenseUserAssignmentDisabled()) {
      this.showLicenseUserDropdown.set(true);
    }
  }

  // 🔥 NEW: License Validity Period Calculation Methods
  onLicenseExpiryDateChange(event: any): void {
    const selectedDate = event.target.value;
    if (selectedDate) {
      const months = this.calculateLicenseValidityPeriod(selectedDate);
      this.licenseValidityMonths.set(months);
    } else {
      this.licenseValidityMonths.set(null);
    }
  }

  private calculateLicenseValidityPeriod(licenseValidityEndDate: string): number {
    const today = new Date();
    const endDate = new Date(licenseValidityEndDate);
    
    // Calculate the difference in months
    const licenseValidityPeriod = (endDate.getFullYear() - today.getFullYear()) * 12 + 
                                  (endDate.getMonth() - today.getMonth());
    
    return licenseValidityPeriod;
  }

  getLicenseValidityMonths(): number | null {
    return this.licenseValidityMonths();
  }

  getSelectedAssignees(): SoftwareAssignee[] {
    return this.selectedAssignees();
  }

  isAssigneeSelected(id: string): boolean {
    return this.selectedAssignees().some(assignee => assignee.id === id);
  }

  selectAssignee(assignee: SoftwareAssignee): void {
    if (!this.isAssigneeSelected(assignee.id)) {
      this.selectedAssignees.update(current => [...current, assignee]);
      this.assigneeSearchTerm = '';
      this.showAssigneeDropdown.set(false);
    }
  }

  removeAssignee(id: string): void {
    this.selectedAssignees.update(current => current.filter(assignee => assignee.id !== id));
  }

  onAssigneeSearch(event: any): void {
    const searchTerm = event.target.value;
    this.assigneeSearchTerm = searchTerm;
    this.showAssigneeDropdown.set(true);
  }

  getUserAssigneeCount(): number {
    return this.selectedAssignees().filter(a => a.type === 'user').length;
  }

  getOfficeAssetAssigneeCount(): number {
    return this.selectedAssignees().filter(a => a.type === 'office').length;
  }

  private loadAvailableAssignees(): void {
    const users = this.users();
    const assignees: SoftwareAssignee[] = [];

    // Add regular users and office assets from the users list
    users.forEach(user => {
      assignees.push({
        id: `user_${user.id}`,
        name: user.name, // Using the correct property from DropdownOption
        type: 'user', // Default to user since we don't have userType in this interface
        email: user.email,
        department: undefined, // Not available in this User interface
        userType: undefined // Not available in this User interface
      });
    });

    this.availableAssignees.set(assignees);
  }

  private setupSoftwareAssignmentListeners(): void {
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const dropdown = target.closest('.relative');
      if (!dropdown) {
        this.showAssigneeDropdown.set(false);
      }
    });
  }

  // 🔥 NEW: Setup License User Dropdown Listeners
  private setupLicenseUserDropdownListeners(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const licenseUserDropdown = target.closest('.relative');
      if (!licenseUserDropdown || !licenseUserDropdown.querySelector('input[placeholder*="Search and select users"]')) {
        this.showLicenseUserDropdown.set(false);
      }
    });
  }

  // 🔥 NEW: Prepare User Assignment Data for Submission
  private prepareUserAssignmentData(assetId: number, formData: any): any[] {
    const assignments: any[] = [];
    
    if (this.showHardwareFields()) {
      // Hardware: Single user assignment
      const userId = formData.currentUserId;
      if (userId) {
        assignments.push({
          assetId: assetId,
          userId: userId,
          remarks: "Assigned during creation"
        });
      }
    } else if (this.showSoftwareFields()) {
      // Software: Multiple user assignments based on selected license users
      const selectedUsers = this.selectedLicenseUsers();
      selectedUsers.forEach(user => {
        assignments.push({
          assetId: assetId,
          userId: user.id,
          remarks: "Software license assigned via asset creation form"
        });
      });
    }
    
    return assignments;
  }

  // 🔥 NEW: Validate Asset Form Based on Category
  private validateAssetFormByCategory(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const category = this.assetForm.get('assetCategory')?.value;
    
    if (category === 'HARDWARE') {
      // Hardware validation
      if (!this.assetForm.get('modelId')?.value) {
        errors.push('Asset Model is required for hardware assets');
      }
      if (!this.assetForm.get('currentUserId')?.value) {
        errors.push('User assignment is required for hardware assets');
      }
    } else if (category === 'SOFTWARE') {
      // Software validation
      if (!this.assetForm.get('licenseName')?.value) {
        errors.push('License Name is required for software assets');
      }
      if (!this.assetForm.get('licenseValidityPeriod')?.value) {
        errors.push('License Expiry Date is required for software assets');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  private updateAssetCategoryValidators(): void {
    const assetCategory = this.assetForm.get('assetCategory')?.value;
    
    // Get form controls
    const warrantyControl = this.assetForm.get('warrantyStartDate');
    const warrantyExpiryControl = this.assetForm.get('warrantyExpiry');
    const licenseNameControl = this.assetForm.get('licenseName');
    const licenseValidityControl = this.assetForm.get('licenseValidityPeriod');
    
    // Clear existing validators
    warrantyControl?.clearValidators();
    warrantyExpiryControl?.clearValidators();
    licenseNameControl?.clearValidators();
    licenseValidityControl?.clearValidators();
    
    if (assetCategory === 'HARDWARE') {
      // Hardware assets require warranty information
      warrantyControl?.setValidators([Validators.required]);
      warrantyExpiryControl?.setValidators([Validators.required]);
      
      // Clear software-specific fields
      this.assetForm.patchValue({
        licenseName: '',
        licenseValidityPeriod: '',
      });
      
    } else if (assetCategory === 'SOFTWARE') {
      // Software assets require license information
      licenseNameControl?.setValidators([Validators.required]);
      licenseValidityControl?.setValidators([Validators.required]);
      
      // Clear hardware-specific fields
      this.assetForm.patchValue({
        warrantyStartDate: '',
        warrantyExpiry: '',
        serialNumber: '' // Software typically doesn't have serial numbers
      });
    } else {
      // Clear all category-specific fields for unknown categories
      this.assetForm.patchValue({
        warrantyStartDate: '',
        warrantyExpiry: '',
        licenseName: '',
        licenseValidityPeriod: '',
      });
    }
    
    // Update validity for all affected controls
    warrantyControl?.updateValueAndValidity();
    warrantyExpiryControl?.updateValueAndValidity();
    licenseNameControl?.updateValueAndValidity();
    licenseValidityControl?.updateValueAndValidity();
  }
} 