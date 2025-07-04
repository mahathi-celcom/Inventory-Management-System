import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin, debounceTime, distinctUntilChanged, finalize, catchError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

// Shared Layout Components
import { LayoutComponent, NavigationItem } from '../shared/layout/layout.component';
import { LayoutService } from '../../services/layout.service';
import { FormDrawerComponent } from '../shared/form-drawer/form-drawer.component';
import { AddModalComponent } from '../shared/add-modal/add-modal.component';
import { ActionButtonsComponent } from '../shared/action-buttons/action-buttons.component';

// Asset PO specific imports
import { 
  AssetPo, 
  AssetPoWithDetails, 
  AssetPoFilter, 
  extractAssetPoId, 
  isValidAssetPoId, 
  ASSET_PO_MESSAGES, 
  AssetPoCascadeUpdateResponse, 
  AssetFormData, 
  AssetBulkCreationRequest,
  ACQUISITION_TYPE_OPTIONS,
  OWNER_TYPE_OPTIONS
} from '../../models/asset-po.model';
import { Vendor } from '../../models/vendor.model';
import { AssetPoService } from '../../services/asset-po.service';
import { AssetService } from '../../services/asset.service';
import { VendorService } from '../../services/vendor.service';
import { PoMigrationModalComponent } from '../po-migration-modal/po-migration-modal.component';
import { 
  Asset, 
  AssetType,
  AssetMake,
  AssetModel,
  AssetModelWithDetails,
  User,
  OperatingSystem,
  OSVersion,
  AssetDTO,
  ASSET_STATUS,
  OWNER_TYPE,
  ACQUISITION_TYPE,
  BulkAssetCreationResponse
} from '../../models/asset.model';
import { signal } from '@angular/core';

@Component({
  selector: 'app-asset-po-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LayoutComponent
  ],
    template: `
    <app-layout [pageTitle]="'Asset Purchase Orders'" [navigationItems]="navigationItems">
      <div slot="header-actions" class="flex items-center space-x-4">
        <button
          (click)="loadData()"
          class="inline-flex items-center justify-center w-8 h-8 text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:text-celcom-primary focus:outline-none focus:ring-2 focus:ring-celcom-primary focus:ring-offset-2 transition-all duration-200"
          title="Refresh List">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
        <button
          (click)="openPoModal()"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-celcom-primary to-celcom-secondary hover:from-celcom-secondary hover:to-celcom-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-celcom-primary transition-all duration-200">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Create New Asset Purchase Order
        </button>
      </div>

      <div class="card-celcom mb-6">
        <div class="card-celcom-body">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
              <div class="flex items-center">
                <div class="p-3 rounded-full bg-celcom-primary bg-opacity-10">
                  <svg class="h-8 w-8 text-celcom-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Total Purchase Orders</p>
                  <p class="text-3xl font-bold text-gray-900">{{ assetPos.length }}</p>
                  <div class="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                    <span class="flex items-center">
                      <div class="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      Active: {{ getActivePOCount() }}
                    </span>
                    <span class="flex items-center">
                      <div class="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                      Pending: {{ getPendingPOCount() }}
                    </span>
                    <span class="flex items-center">
                      <div class="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                      Completed: {{ getCompletedPOCount() }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="lg:col-span-2">
              <div class="bg-white border border-gray-200 rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center">
                    <div class="p-2 rounded-lg bg-celcom-primary bg-opacity-10">
                      <svg class="w-5 h-5 text-celcom-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"></path>
                      </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 ml-3">Filters</h3>
                  </div>
                  <button 
                    (click)="clearFilters()" 
                    class="text-sm font-medium text-celcom-primary hover:text-celcom-primary-dark transition-colors px-3 py-1 rounded-md hover:bg-celcom-primary hover:bg-opacity-10">
                    Clear All
                  </button>
                </div>
                
                <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-5 w-5 text-celcom-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                      </div>
                      <input
                        type="text"
                        formControlName="search"
                        placeholder="Search PO number or invoice..."
                        class="block w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-celcom-primary focus:border-celcom-primary transition-all duration-200 bg-white shadow-sm"
                        (input)="applyFilters()"
                      >
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Acquisition Type</label>
                    <select
                      formControlName="acquisitionType"
                      class="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-celcom-primary focus:border-celcom-primary transition-all duration-200 bg-white shadow-sm"
                      (change)="applyFilters()"
                    >
                      <option value="">All Types</option>
                      @for (option of acquisitionTypeOptions; track option.value) {
                        <option [value]="option.value">{{ option.label }}</option>
                      }
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Owner Type</label>
                    <select
                      formControlName="ownerType"
                      class="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-celcom-primary focus:border-celcom-primary transition-all duration-200 bg-white shadow-sm"
                      (change)="applyFilters()"
                    >
                      <option value="">All Owners</option>
                      @for (option of ownerTypeOptions; track option.value) {
                        <option [value]="option.value">{{ option.label }}</option>
                      }
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                    <select
                      formControlName="vendorId"
                      class="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-celcom-primary focus:border-celcom-primary transition-all duration-200 bg-white shadow-sm"
                      (change)="applyFilters()"
                    >
                      <option value="">All Vendors</option>
                      @for (vendor of vendors; track vendor.vendorId) {
                        <option [value]="vendor.vendorId">{{ vendor.name }}</option>
                      }
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      formControlName="status"
                      class="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-celcom-primary focus:border-celcom-primary transition-all duration-200 bg-white shadow-sm"
                      (change)="applyFilters()"
                    >
                      <option value="">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" *ngIf="!loading; else loadingTemplate">
        <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-celcom-primary/5 to-celcom-secondary/5">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">Purchase Orders</h2>
            <span class="text-sm text-gray-500">{{ filteredAssetPos.length }} of {{ assetPos.length }} POs</span>
          </div>
        </div>

        @if (filteredAssetPos.length === 0) {
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No Asset POs found</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by creating a new purchase order.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gradient-to-r from-celcom-primary/10 to-celcom-secondary/10">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.NO
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Details
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assets
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financial
                  </th>
                  <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (po of filteredAssetPos; track trackByPoId($index, po); let i = $index) {
                  <tr class="hover:bg-gradient-to-r hover:from-celcom-primary/5 hover:to-celcom-secondary/5 transition-all duration-200">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ i + 1 }}
                    </td>
                    
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex flex-col">
                        <div class="text-sm font-medium text-gray-900">
                          PO #{{ po.poNumber }}
                        </div>
                        @if (po.invoiceNumber) {
                          <div class="text-sm text-gray-500">
                            Invoice: {{ po.invoiceNumber }}
                          </div>
                        }
                        <div class="text-xs text-gray-400">
                          {{ po.acquisitionDate | date:'MMM dd, yyyy' }}
                        </div>
                        <div class="mt-1">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                [ngClass]="getAcquisitionTypeBadgeClass(po.acquisitionType)">
                            {{ po.acquisitionType }}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">
                        {{ getname(po.vendorId) }}
                      </div>
                      <div class="text-sm text-gray-500">
                        Owner: {{ po.ownerType }}
                      </div>
                    </td>

                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">
                        <span class="font-medium">{{ po.createdAssetsCount || 0 }}</span> assets
                      </div>
                      <div class="text-xs text-gray-500">
                        Total: {{ po.totalDevices }}
                      </div>
                    </td>

                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            [ngClass]="getPOStatusBadgeClass(getPOStatus(po))">
                        {{ getPOStatus(po) }}
                      </span>
                    </td>

                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">
                        \${{ (po.acquisitionPrice || 0) | number:'1.2-2' }}
                      </div>
                      @if (po.currentPrice) {
                        <div class="text-xs text-gray-500">
                          Current: \${{ (po.currentPrice || 0) | number:'1.2-2' }}
                        </div>
                      }
                    </td>

                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div class="flex items-center justify-center space-x-2">
                        <button
                          (click)="editAssetPo(po)"
                          class="text-celcom-primary hover:text-celcom-primary-dark transition-colors duration-150 p-1 rounded"
                          title="Edit PO">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>

                        <button
                          (click)="togglePoExpansion(po)"
                          class="text-green-600 hover:text-green-700 transition-colors duration-150 p-1 rounded"
                          title="Create Assets">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg>
                        </button>

                        <button
                          (click)="openShowAssetsModal(po)"
                          class="text-blue-600 hover:text-blue-700 transition-colors duration-150 p-1 rounded"
                          title="Edit Assets">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                          </svg>
                        </button>

                        <button
                          (click)="deleteAssetPo(po)"
                          class="text-red-600 hover:text-red-700 transition-colors duration-150 p-1 rounded"
                          title="Delete PO">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>

                  @if (isPoExpanded(po)) {
                    <tr>
                      <td colspan="7" class="px-6 py-4 bg-gray-50">
                        <div class="space-y-4">
                          <div class="flex items-center justify-between">
                            <h4 class="text-lg font-medium text-gray-900">Create Assets for PO #{{ po.poNumber }}</h4>
                            <div class="flex items-center space-x-2">
                              <span class="text-sm text-gray-600">
                                Assets to create: {{ po.totalDevices - (po.createdAssetsCount || 0) }}
                              </span>
                              @if (canCreateMoreAssets()) {
                                <button
                                  (click)="submitAssetFormsForPo(po)"
                                  [disabled]="isSubmittingAssetsForPo(po.poNumber)"
                                  class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                  @if (isSubmittingAssetsForPo(po.poNumber)) {
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                  } @else {
                                    Create Assets
                                  }
                                </button>
                              }
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <ng-template #loadingTemplate>
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-celcom-primary"></div>
          <span class="ml-3 text-gray-600">Loading purchase orders...</span>
        </div>
      </ng-template>

      @if (showPoModal) {
        <!-- Existing PO modal content -->
      }

      @if (showAssetsModal) {
        <!-- Existing assets modal content -->
      }
    </app-layout>
  `,
  styles: [`
    .success-toast {
      background-color: #10b981;
      color: white;
    }
    .error-snackbar {
      background-color: #ef4444;
      color: white;
    }
  `]
})
export class AssetPoManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Services
  private fb = inject(FormBuilder);
  private assetPoService = inject(AssetPoService);
  private assetService = inject(AssetService);
  private vendorService = inject(VendorService);
  private layoutService = inject(LayoutService);
  private dialog = inject(MatDialog);

  // Navigation
  navigationItems: NavigationItem[] = [];

  // Data
  assetPos: AssetPoWithDetails[] = [];
  filteredAssetPos: AssetPoWithDetails[] = [];
  vendors: Vendor[] = [];
  editingPo: AssetPoWithDetails | null = null;

  // Forms
  assetPoForm!: FormGroup;
  filterForm!: FormGroup;

  // UI State
  loading = false;
  isSubmitting = false;
  showForm = false; // Default to hidden

  // Constants for dropdowns
  readonly acquisitionTypeOptions = ACQUISITION_TYPE_OPTIONS;
  readonly ownerTypeOptions = OWNER_TYPE_OPTIONS;

  // Computed properties for conditional validations
  readonly isLeaseOrRental = computed(() => {
    const acquisitionType = this.assetPoForm?.get('acquisitionType')?.value;
    return acquisitionType === 'RENTED';
  });

  readonly shouldShowLeaseFields = computed(() => this.isLeaseOrRental());

  // Asset creation properties
  expandedPoNumbers: Set<string> = new Set();
  assetFormsByPo: Map<string, FormArray> = new Map();
  loadingAssetsByPo: Map<string, boolean> = new Map();
  createdAssetsByPo: Map<string, Asset[]> = new Map();

  // Dropdown Data for Asset Forms
  assetTypes: AssetType[] = [];
  assetMakes: AssetMake[] = [];
  assetModels: AssetModel[] = [];
  operatingSystems: OperatingSystem[] = [];
  osVersions: OSVersion[] = [];
  users: User[] = [];

  // Asset Form Submission State
  submittingAssetsByPo: Map<string, boolean> = new Map();
  
  // Asset Edit State
  editingAssetsByPo: Map<string, Set<number>> = new Map();
  assetEditFormsByPo: Map<string, Map<number, FormGroup>> = new Map();
  updatingAssetsByPo: Map<string, Set<number>> = new Map();
  deletingAssetsByPo: Map<string, Set<number>> = new Map();

  // Modal state
  showAssetsModal = false;
  selectedPo: AssetPoWithDetails | null = null;
  modalAssetForm!: FormGroup;
  modalAssetEditMode = false;
  selectedModalAsset: Asset | null = null;
  isSubmittingModalAsset = false;
  assetsSearchFilter = '';
  filteredModalAssets: Asset[] = [];
  deletingModalAssets: Set<number> = new Set();

  // Additional state for horizontal asset cards and inline editing
  expandedAssets: Set<number> = new Set();
  editingModalAssets: Set<number> = new Set();
  assetEditForms: Map<number, FormGroup> = new Map();
  showCreateAssetForm = false;

  // PO Modal state
  showPoModal = false;
  isPoEditMode = false;

  ngOnInit(): void {
    this.initializeNavigation();
    this.initializeForms();
    this.setupFormSubscriptions();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>`
      },
      {
        label: 'Asset Models',
        route: '/asset-models',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
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

  private initializeForms(): void {
    this.assetPoForm = this.fb.group({
      acquisitionType: ['', [Validators.required]],
      ownerType: ['', [Validators.required]],
      poNumber: ['', [Validators.required]],
      invoiceNumber: ['', [Validators.required]], // Made required as per spec
      vendorId: ['', [Validators.required]],
      acquisitionDate: ['', [Validators.required]], // Made required as per spec
      totalDevices: [1, [Validators.required, Validators.min(1)]],
      depreciationPct: [0, [Validators.min(0), Validators.max(100)]],
      acquisitionPrice: ['', [Validators.min(0.01)]],
      currentPrice: [{ value: '', disabled: true }],
      rentalAmount: [''],
      minContractPeriod: [''],
      leaseEndDate: [''],
      warrantyExpiryDate: [''] // New warranty expiry date field
    });

    this.filterForm = this.fb.group({
      search: [''],
      acquisitionType: [''],
      ownerType: [''],
      vendorId: [''],
      status: [''],
      showLeaseExpiring: [false]
    });

    // Initialize modal asset form (unchanged)
    this.modalAssetForm = this.fb.group({
      assetTypeId: [''], // No validation since it's auto-filled
      makeId: [''], // No validation since it's auto-filled
      modelId: ['', [Validators.required]],
      name: ['', [Validators.required]],
      serialNumber: ['', [Validators.required]],
      itAssetCode: ['', [Validators.required]],
      macAddress: ['', [Validators.pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)]],
      ipv4Address: ['', [Validators.pattern(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)]],
      status: ['IN_STOCK', [Validators.required]],
      osId: [''],
      osVersionId: [''],
      warrantyExpiry: [''], // Add missing warranty field
    });

    // Setup modal form dependencies
    this.setupModalFormDependencies();
    
    // Setup conditional validations for rental fields only
    this.setupConditionalValidations();
  }

  private setupConditionalValidations(): void {
    // Watch for acquisition type changes to apply conditional validations
    this.assetPoForm.get('acquisitionType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(acquisitionType => {
        const rentalAmountControl = this.assetPoForm.get('rentalAmount');
        const minContractPeriodControl = this.assetPoForm.get('minContractPeriod');
        const leaseEndDateControl = this.assetPoForm.get('leaseEndDate');

        // Clear existing validators
        rentalAmountControl?.clearValidators();
        minContractPeriodControl?.clearValidators();
        leaseEndDateControl?.clearValidators();

        // Apply validators only for RENTED type (removed LEASED)
        if (acquisitionType === 'RENTED') {
          rentalAmountControl?.setValidators([Validators.required, Validators.min(0.01)]);
          minContractPeriodControl?.setValidators([Validators.required, Validators.min(1)]);
          leaseEndDateControl?.setValidators([Validators.required]);
        }

        // Update validity
        rentalAmountControl?.updateValueAndValidity();
        minContractPeriodControl?.updateValueAndValidity();
        leaseEndDateControl?.updateValueAndValidity();
      });
  }

  private setupFormSubscriptions(): void {
    // Filter form changes
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });

    // Auto-calculate current price
    this.assetPoForm.get('acquisitionPrice')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateCurrentPrice());

    this.assetPoForm.get('depreciationPct')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateCurrentPrice());

    // Clear Asset Make when Asset Type is changed
    this.assetPoForm.get('assetTypeId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(typeId => {
        // Clear make selection when type changes
        this.assetPoForm.get('assetMakeId')?.setValue('');
      });
  }

  private setupModalFormDependencies(): void {
    let isUpdatingFromModel = false; // Flag to prevent circular updates

    // When asset type changes, clear make and model
    this.modalAssetForm.get('assetTypeId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(typeId => {
        if (!isUpdatingFromModel) {
          // Clear dependent fields when type changes (only if not auto-filling from model)
          this.modalAssetForm.get('makeId')?.setValue('', { emitEvent: false });
          this.modalAssetForm.get('modelId')?.setValue('', { emitEvent: false });
        }
      });

    // When make changes, clear model
    this.modalAssetForm.get('makeId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(makeId => {
        if (!isUpdatingFromModel) {
          // Clear model when make changes (only if not auto-filling from model)
          this.modalAssetForm.get('modelId')?.setValue('', { emitEvent: false });
        }
      });

    // 🔗 CHAINED RESOLUTION: When model changes, auto-fill make and type
    this.modalAssetForm.get('modelId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(modelId => {
        if (modelId && !isUpdatingFromModel) {
          const selectedModel = this.assetModels.find(m => m.id === Number(modelId));
          if (selectedModel) {
            console.log('🔗 Chained Resolution Started:', {
              selectedModel: selectedModel.name,
              modelId: modelId,
              makeId: selectedModel.makeId
            });

            isUpdatingFromModel = true; // Set flag to prevent clearing
            
            // Step 1: Auto-fill make from model
            this.modalAssetForm.get('makeId')?.setValue(selectedModel.makeId);
            
            // Step 2: Auto-fill type from make's type relationship
            const selectedMake = this.assetMakes.find(make => make.id === selectedModel.makeId);
            if (selectedMake && selectedMake.typeId) {
              this.modalAssetForm.get('assetTypeId')?.setValue(selectedMake.typeId);
              
              console.log('✅ Chained Resolution Complete:', {
                model: selectedModel.name,
                make: selectedMake.name,
                type: this.assetTypes.find(t => t.id === selectedMake.typeId)?.name,
                flow: 'Model → Make → Type'
              });
            }
            
            // Clear and reset OS version when model changes
            this.modalAssetForm.get('osVersionId')?.setValue('');
            
            // Reset flag after a small delay to allow form updates
            setTimeout(() => {
              isUpdatingFromModel = false;
            }, 50);
          }
        } else if (!modelId) {
          // If model is cleared, reset the flag
          isUpdatingFromModel = false;
        }
      });

    // When OS version changes, auto-fill OS
    this.modalAssetForm.get('osVersionId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(osVersionId => {
        if (osVersionId) {
          const selectedOsVersion = this.osVersions.find(v => v.id === Number(osVersionId));
          if (selectedOsVersion) {
            this.modalAssetForm.get('osId')?.setValue(selectedOsVersion.osId);
          }
        }
      });
  }

  private calculateCurrentPrice(): void {
    const acquisitionPrice = this.assetPoForm.get('acquisitionPrice')?.value;
    const depreciationPct = this.assetPoForm.get('depreciationPct')?.value || 0;

    if (acquisitionPrice && acquisitionPrice > 0) {
      const currentPrice = acquisitionPrice * (1 - depreciationPct / 100);
      this.assetPoForm.get('currentPrice')?.setValue(currentPrice.toFixed(2));
    }
  }

  loadData(): void {
    this.loading = true;
    
    // Try to load active vendors first, fallback to all vendors if failed
    const vendorsObservable = this.vendorService.getActiveVendors().pipe(
      catchError((error) => {
        console.warn('Failed to load active vendors, falling back to all vendors:', error);
        return this.vendorService.getAllVendors();
      })
    );
    
    const dataLoadOperations = forkJoin({
      assetPos: this.assetPoService.getAllAssetPos(),
      vendors: vendorsObservable,
      assetTypes: this.assetService.getAssetTypes(),
      assetMakes: this.assetService.getAssetMakes(),
      assetModels: this.assetService.getAssetModels(),
      operatingSystems: this.assetService.getOperatingSystems(),
      osVersions: this.assetService.getOSVersions(),
      users: this.assetService.getUsers()
    });

    dataLoadOperations
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.assetPos = data.assetPos.map(po => ({ ...po, poId: po.poId })) as AssetPoWithDetails[];
          this.vendors = data.vendors;
          this.assetTypes = data.assetTypes;
          this.assetMakes = data.assetMakes;
          this.assetModels = data.assetModels;
          this.operatingSystems = data.operatingSystems;
          this.osVersions = data.osVersions;
          this.users = data.users;
          
          console.log('✅ Loaded vendors:', this.vendors.length, this.vendors);
          console.log('✅ Loaded Asset POs:', this.assetPos.length, this.assetPos);
          
        this.applyFilters();
          this.loadAssetCountsForPOs();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.layoutService.showErrorToast('Failed to load data');
        this.loading = false;
      }
    });
  }

  private loadAssetCountsForPOs(): void {
    // Load created assets for each PO
    this.assetPos.forEach(po => {
        this.assetService.getAssetsByPO(po.poNumber)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (assets) => {
              this.createdAssetsByPo.set(po.poNumber, assets);
            po.createdAssetsCount = assets.length;
            po.remainingAssetsCount = (po.totalDevices || 0) - assets.length;
            },
            error: (error) => {
              console.error(`Error loading assets for PO ${po.poNumber}:`, error);
            }
          });
    });
  }

  // Make applyFilters public so it can be called from template
  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredAssetPos = this.assetPos.filter(po => {
      if (filters.search && !po.poNumber.toLowerCase().includes(filters.search.toLowerCase()) && 
          !po.invoiceNumber?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.acquisitionType && po.acquisitionType !== filters.acquisitionType) return false;
      if (filters.ownerType && po.ownerType !== filters.ownerType) return false;
      if (filters.vendorId && po.vendorId !== filters.vendorId) return false;
      if (filters.status && this.getPOStatus(po) !== filters.status) return false;
      // Add lease expiring filter logic here if needed
      return true;
    });
  }

  toggleFormVisibility(): void {
    this.openPoModal();
  }

  openPoModal(): void {
    this.showPoModal = true;
    this.isPoEditMode = false;
    this.editingPo = null;
    this.assetPoForm.reset({
      acquisitionType: '',
      ownerType: '',
      poNumber: '',
      invoiceNumber: '',
      vendorId: '',
      acquisitionDate: '',
      totalDevices: 1,
      depreciationPct: 0,
      acquisitionPrice: '',
      currentPrice: '',
      rentalAmount: '',
      minContractPeriod: '',
      leaseEndDate: '',
      warrantyExpiryDate: ''
    });
  }

  closePoModal(): void {
    this.showPoModal = false;
    this.isPoEditMode = false;
    this.editingPo = null;
      this.assetPoForm.reset();
  }

  closeForm(): void {
    this.showForm = false;
    this.editingPo = null;
    this.assetPoForm.reset();
  }

  editAssetPo(po: AssetPoWithDetails): void {
    this.editingPo = po;
    this.assetPoForm.patchValue({
      acquisitionType: po.acquisitionType,
      ownerType: po.ownerType,
      poNumber: po.poNumber,
      invoiceNumber: po.invoiceNumber || '',
      vendorId: po.vendorId,
      acquisitionDate: po.acquisitionDate || '',
      totalDevices: po.totalDevices,
      depreciationPct: po.depreciationPct || 0,
      acquisitionPrice: po.acquisitionPrice,
      currentPrice: po.currentPrice,
      rentalAmount: po.rentalAmount || '',
      minContractPeriod: po.minContractPeriod || '',
      leaseEndDate: po.leaseEndDate || '',
      warrantyExpiryDate: po.warrantyExpiryDate || ''
    });
    this.showPoModal = true;
    this.isPoEditMode = true;
  }

  onSubmit(formData: any): void {
    if (this.assetPoForm.valid && !this.isSubmitting) {
    this.isSubmitting = true;

      const operation = this.editingPo
        ? this.assetPoService.updateAssetPo(this.editingPo.poId!, formData)
        : this.assetPoService.createAssetPo(formData);

      operation
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (assetPo) => {
            const message = this.editingPo 
              ? 'Asset PO updated successfully!' 
              : 'Asset PO created successfully!';
            
            this.layoutService.showSuccessToast(message);
            this.closePoModal();
          this.loadData();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error saving asset PO:', error);
            this.layoutService.showErrorToast('Failed to save asset PO');
          this.isSubmitting = false;
          }
        });
  }
  }

  deleteAssetPo(po: AssetPoWithDetails): void {
    if (!po?.poId) {
      this.layoutService.showErrorToast('Cannot delete asset PO: Missing ID');
      return;
    }

    if (confirm(`Are you sure you want to delete PO "${po.poNumber}"?`)) {
      this.assetPoService.deleteAssetPo(po.poId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
          next: () => {
            this.layoutService.showSuccessToast('Asset PO deleted successfully!');
            this.loadData();
        },
        error: (error) => {
            console.error('Error deleting asset PO:', error);
            this.layoutService.showErrorToast('Failed to delete asset PO');
        }
      });
  }
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      acquisitionType: '',
      ownerType: '',
      vendorId: '',
      status: '',
      showLeaseExpiring: false
    });
    this.applyFilters();
  }

  onNavigationClick(item: NavigationItem): void {
    // Handle navigation if needed
    console.log('Navigation clicked:', item);
  }

  getname(vendorId: number): string {
    const vendor = this.vendors.find(v => v.vendorId === vendorId);
    return vendor ? vendor.name : 'Unknown Vendor';
  }

  getAcquisitionTypeBadgeClass(type: string): string {
    switch (type) {
      case 'BOUGHT':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800';
      case 'LEASED':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800';
      case 'RENTED':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800';
      default:
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
    }
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.assetPoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.assetPoForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName} is required`;
      }
      if (field.errors['min']) {
        return `${fieldName} must be at least ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `${fieldName} must be at most ${field.errors['max'].max}`;
      }
    }
    return '';
  }

  trackByPoId(index: number, po: AssetPoWithDetails): number {
    return po.poId || index;
  }

  get hasLeaseRentalItems(): boolean {
    return this.filteredAssetPos.some(po => po.acquisitionType === 'RENTED');
  }

  togglePoExpansion(po: AssetPoWithDetails): void {
    if (this.isPoExpanded(po)) {
      this.expandedPoNumbers.delete(po.poNumber);
    } else {
      this.expandedPoNumbers.add(po.poNumber);
      this.createAssetFormsForPo(po);
    }
  }

  isPoExpanded(po: AssetPoWithDetails): boolean {
    return this.expandedPoNumbers.has(po.poNumber);
  }

  private createAssetFormsForPo(po: AssetPoWithDetails): void {
    if (!this.assetFormsByPo.has(po.poNumber)) {
      const formsArray = this.fb.array<FormGroup>([]);
      
      // Create forms for remaining assets
      const remainingAssets = (po.totalDevices || 0) - (po.createdAssetsCount || 0);
      for (let i = 0; i < remainingAssets; i++) {
      const assetForm = this.createAssetForm(po, i);
        (formsArray as FormArray<FormGroup>).push(assetForm);
    }

      this.assetFormsByPo.set(po.poNumber, formsArray);
    }
  }

  private createAssetForm(po: AssetPoWithDetails, index: number): FormGroup {
    const form = this.fb.group({
      typeId: ['', [Validators.required]],
      makeId: ['', [Validators.required]],
      modelId: ['', [Validators.required]],
      name: ['', [Validators.required]],
      serialNumber: ['', [Validators.required]],
      itAssetCode: ['', [Validators.required, Validators.minLength(2)]],
      macAddress: ['', [Validators.pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)]],
      ipv4Address: ['', [Validators.pattern(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)]],
      status: [ASSET_STATUS.IN_STOCK, [Validators.required]],
      ownerType: [po.ownerType],
      acquisitionType: [po.acquisitionType],
      currentUserId: [''],
      inventoryLocation: [''],
      osId: ['', [Validators.required]],
      osVersionId: ['', [Validators.required]],
      poNumber: [po.poNumber],
      invoiceNumber: [po.invoiceNumber],
      acquisitionDate: [po.acquisitionDate],
      warrantyExpiry: [''],
      extendedWarrantyExpiry: [''],
      leaseEndDate: [po.leaseEndDate],
      vendorId: [po.vendorId],
      extendedWarrantyVendorId: [''],
      rentalAmount: [po.rentalAmount],
      acquisitionPrice: [po.acquisitionPrice],
      depreciationPct: [po.depreciationPct],
      currentPrice: [po.currentPrice],
      minContractPeriod: [po.minContractPeriod],
      tags: ['']
    });

    this.setupDependentFieldLogic(form);
    return form;
  }

  private setupDependentFieldLogic(form: FormGroup): void {
    // Asset Type -> Make dependency (clear make and model when type changes)
    form.get('typeId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(typeId => {
      if (typeId) {
        form.get('makeId')?.setValue('');
        form.get('modelId')?.setValue('');
      }
    });
            
    // Make -> Auto-fill Type and clear Model dependency  
    form.get('makeId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(makeId => {
      if (makeId) {
        // Auto-fill type from make
        const selectedMake = this.assetMakes.find(make => make.id === Number(makeId));
        if (selectedMake && selectedMake.typeId) {
          form.get('typeId')?.setValue(selectedMake.typeId);
          }
        // Clear model when make changes
        form.get('modelId')?.setValue('');
        }
      });

    // Model selection -> Auto-fill Make and Type
    form.get('modelId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(modelId => {
      if (modelId) {
        const model = this.assetModels.find(m => m.id === modelId);
        if (model) {
          // Auto-fill make from model
          form.get('makeId')?.setValue(model.makeId);
          // Auto-fill type from make
          const selectedMake = this.assetMakes.find(make => make.id === model.makeId);
          if (selectedMake && selectedMake.typeId) {
            form.get('typeId')?.setValue(selectedMake.typeId);
          }
        }
      }
    });

    // OS -> OS Version dependency
    form.get('osId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(osId => {
      if (osId) {
        form.get('osVersionId')?.setValue('');
        }
      });
  }

  getAssetFormsForPo(poNumber: string): FormArray | null {
    return this.assetFormsByPo.get(poNumber) || null;
  }

  getCreatedAssetsForPo(poNumber: string): Asset[] {
    return this.createdAssetsByPo.get(poNumber) || [];
  }

  submitAssetFormsForPo(po: AssetPoWithDetails): void {
    const formsArray = this.getAssetFormsForPo(po.poNumber);
    if (!formsArray) return;

    const validForms = formsArray.controls.filter(control => control.valid);
    if (validForms.length === 0) {
      this.layoutService.showErrorToast('Please fill in at least one valid asset form');
      return;
    }

    this.submittingAssetsByPo.set(po.poNumber, true);

    const assetsToCreate: AssetDTO[] = validForms.map(form => {
      const formValue = form.value;
      return {
        typeId: formValue.typeId,
        makeId: formValue.makeId,
        modelId: formValue.modelId,
        name: formValue.name,
        serialNumber: formValue.serialNumber,
        assetCategory: formValue.assetCategory || 'HARDWARE',
        itAssetCode: formValue.itAssetCode,
        macAddress: formValue.macAddress || undefined,
        ipv4Address: formValue.ipv4Address || undefined,
        status: formValue.status,
        ownerType: formValue.ownerType,
        acquisitionType: formValue.acquisitionType,
        currentUserId: formValue.currentUserId || undefined,
        inventoryLocation: formValue.inventoryLocation || undefined,
        osId: formValue.osId,
        osVersionId: formValue.osVersionId,
        poNumber: formValue.poNumber,
        invoiceNumber: formValue.invoiceNumber || undefined,
        acquisitionDate: formValue.acquisitionDate || undefined,
        warrantyExpiry: formValue.warrantyExpiry || undefined,
        extendedWarrantyExpiry: formValue.extendedWarrantyExpiry || undefined,
        leaseEndDate: formValue.leaseEndDate || undefined,
        vendorId: formValue.vendorId,
        extendedWarrantyVendorId: formValue.extendedWarrantyVendorId || undefined,
        rentalAmount: formValue.rentalAmount || undefined,
        acquisitionPrice: formValue.acquisitionPrice || undefined,
        depreciationPct: formValue.depreciationPct || 0,
        currentPrice: formValue.currentPrice || undefined,
        minContractPeriod: formValue.minContractPeriod || undefined,
        tags: formValue.tags || undefined
      };
    });

    this.assetService.createAssetsByPO(po.poNumber, assetsToCreate)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.submittingAssetsByPo.set(po.poNumber, false);
        })
      )
      .subscribe({
        next: (response: BulkAssetCreationResponse) => {
          const message = `Successfully created ${response.successCount} assets`;
          this.layoutService.showSuccessToast(message);
          
          if (response.failedAssets && response.failedAssets.length > 0) {
            this.layoutService.showErrorToast(`${response.failedAssets.length} assets failed to create`);
          }

          // Reset forms for successful creations
          validForms.forEach(form => form.reset());
          
          // Reload asset counts
          this.loadAssetCountsForPOs();
        },
        error: (error) => {
          console.error('Error creating assets:', error);
          this.layoutService.showErrorToast('Failed to create assets');
        }
      });
  }

  isSubmittingAssetsForPo(poNumber: string): boolean {
    return this.submittingAssetsByPo.get(poNumber) || false;
  }

  getAssetTypesByMake(makeId: number): AssetType[] {
    // Find the make and return the asset type it belongs to
    const make = this.assetMakes.find(m => m.id === makeId);
    if (make && make.typeId) {
      return this.assetTypes.filter(type => type.id === make.typeId);
    }
    return [];
  }

  getMakesByAssetType(typeId: number): AssetMake[] {
    // Return all makes that belong to this asset type
    return this.assetMakes.filter(make => make.typeId === typeId);
  }

  getModelsByMake(makeId: number): AssetModel[] {
    return this.assetModels.filter(model => model.makeId === makeId);
  }

  getModelsByAssetType(typeId: number): AssetModel[] {
    // Get all makes that belong to this type, then get models for those makes
    const makesForType = this.getMakesByAssetType(typeId);
    const makeIds = makesForType.map(make => make.id);
    return this.assetModels.filter(model => makeIds.includes(model.makeId));
  }

  getOSVersionsByOS(osId: number): OSVersion[] {
    return this.osVersions.filter(version => version.osId === osId);
  }

  startEditingAsset(poNumber: string, asset: Asset): void {
    // Initialize editing sets if they don't exist
    if (!this.editingAssetsByPo.has(poNumber)) {
      this.editingAssetsByPo.set(poNumber, new Set());
    }
    if (!this.assetEditFormsByPo.has(poNumber)) {
      this.assetEditFormsByPo.set(poNumber, new Map());
    }

    const editingSet = this.editingAssetsByPo.get(poNumber)!;
    const formsMap = this.assetEditFormsByPo.get(poNumber)!;

    editingSet.add(asset.assetId!);
    formsMap.set(asset.assetId!, this.createAssetEditForm(asset));
  }

  private createAssetEditForm(asset: Asset): FormGroup {
    return this.fb.group({
      typeId: [asset.typeId, [Validators.required]],
      makeId: [asset.makeId, [Validators.required]],
      modelId: [asset.modelId, [Validators.required]],
      name: [asset.name, [Validators.required]],
      serialNumber: [asset.serialNumber, [Validators.required]],
      itAssetCode: [asset.itAssetCode, [Validators.required, Validators.minLength(2)]],
      macAddress: [asset.macAddress, [Validators.pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)]],
      ipv4Address: [asset.ipv4Address, [Validators.pattern(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)]],
      status: [asset.status, [Validators.required]],
      ownerType: [asset.ownerType],
      acquisitionType: [asset.acquisitionType],
      currentUserId: [asset.currentUserId],
      inventoryLocation: [asset.inventoryLocation],
      osId: [asset.osId, [Validators.required]],
      osVersionId: [asset.osVersionId, [Validators.required]],
      warrantyExpiry: [asset.warrantyExpiry],
      extendedWarrantyExpiry: [asset.extendedWarrantyExpiry],
      leaseEndDate: [asset.leaseEndDate],
      vendorId: [asset.vendorId],
      extendedWarrantyVendorId: [asset.extendedWarrantyVendorId],
      rentalAmount: [asset.rentalAmount],
      acquisitionPrice: [asset.acquisitionPrice],
      depreciationPct: [asset.depreciationPct],
      currentPrice: [asset.currentPrice],
      minContractPeriod: [asset.minContractPeriod],
      tags: [asset.tags]
    });
  }

  cancelEditingAsset(poNumber: string, assetId: number): void {
    this.editingAssetsByPo.get(poNumber)?.delete(assetId);
    this.assetEditFormsByPo.get(poNumber)?.delete(assetId);
  }

  updateAsset(poNumber: string, assetId: number): void {
    const form = this.getAssetEditForm(poNumber, assetId);
    if (!form || form.invalid) return;

    if (!this.updatingAssetsByPo.has(poNumber)) {
      this.updatingAssetsByPo.set(poNumber, new Set());
    }

    const updatingSet = this.updatingAssetsByPo.get(poNumber)!;
    updatingSet.add(assetId);

    const assetData = form.value;
    this.assetService.updateAsset(assetId, assetData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          updatingSet.delete(assetId);
        })
      )
      .subscribe({
        next: (updatedAsset) => {
          this.layoutService.showSuccessToast('Asset updated successfully');
          this.cancelEditingAsset(poNumber, assetId);
          this.loadAssetCountsForPOs();
        },
        error: (error) => {
          console.error('Error updating asset:', error);
          this.layoutService.showErrorToast('Failed to update asset');
        }
      });
  }

  deleteAsset(poNumber: string, assetId: number, assetName: string): void {
    if (confirm(`Are you sure you want to delete "${assetName}"? This action cannot be undone.`)) {
    if (!this.deletingAssetsByPo.has(poNumber)) {
      this.deletingAssetsByPo.set(poNumber, new Set());
    }

      const deletingSet = this.deletingAssetsByPo.get(poNumber)!;
      deletingSet.add(assetId);

    this.assetService.deleteAsset(assetId)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            deletingSet.delete(assetId);
          })
        )
      .subscribe({
        next: () => {
          this.layoutService.showSuccessToast('Asset deleted successfully');
            this.loadAssetCountsForPOs();
        },
        error: (error) => {
          console.error('Error deleting asset:', error);
          this.layoutService.showErrorToast('Failed to delete asset');
        }
      });
    }
  }

  isEditingAsset(poNumber: string, assetId: number): boolean {
    return this.editingAssetsByPo.get(poNumber)?.has(assetId) || false;
  }

  isUpdatingAsset(poNumber: string, assetId: number): boolean {
    return this.updatingAssetsByPo.get(poNumber)?.has(assetId) || false;
  }

  isDeletingAsset(poNumber: string, assetId: number): boolean {
    return this.deletingAssetsByPo.get(poNumber)?.has(assetId) || false;
  }

  getAssetEditForm(poNumber: string, assetId: number): FormGroup | null {
    return this.assetEditFormsByPo.get(poNumber)?.get(assetId) || null;
  }

  openShowAssetsModal(po: AssetPoWithDetails): void {
    this.selectedPo = po;
    this.showAssetsModal = true;
    this.filteredModalAssets = this.getCreatedAssetsForPo(po.poNumber);
    this.assetsSearchFilter = '';
  }

  closeShowAssetsModal(): void {
    this.showAssetsModal = false;
    this.selectedPo = null;
    this.modalAssetEditMode = false;
    this.selectedModalAsset = null;
    this.assetsSearchFilter = '';
    this.filteredModalAssets = [];
    
    // Reset horizontal layout state
    this.expandedAssets.clear();
    this.editingModalAssets.clear();
    this.assetEditForms.clear();
    this.showCreateAssetForm = false;
  }

  filterModalAssets(): void {
    const poNumber = this.selectedPo?.poNumber;
    if (!poNumber) return;

    this.filteredModalAssets = this.getCreatedAssetsForPo(poNumber);
    if (this.assetsSearchFilter) {
      this.filteredModalAssets = this.filteredModalAssets.filter(asset => 
        asset.name.toLowerCase().includes(this.assetsSearchFilter.toLowerCase()) ||
        asset.serialNumber.toLowerCase().includes(this.assetsSearchFilter.toLowerCase())
      );
    }
  }

  openCreateAssetForm(): void {
    if (!this.canCreateMoreAssets()) {
      this.layoutService.showErrorToast('Maximum number of assets for this PO has been reached.');
      return;
    }
    
    this.modalAssetEditMode = false;
    this.selectedModalAsset = null;
    this.modalAssetForm.reset({
      assetTypeId: '',
      makeId: '',
      modelId: '',
      name: '',
      serialNumber: '',
      itAssetCode: '',
      macAddress: '',
      ipv4Address: '',
      status: 'IN_STOCK',
      osId: '',
      osVersionId: ''
    });
  }

  onModalAssetSubmit(): void {
    if (this.modalAssetForm.valid) {
      this.isSubmittingModalAsset = true;

      const formValue = this.modalAssetForm.value;
      
      // Ensure we have the required IDs from the model selection
      if (!formValue.assetTypeId || !formValue.makeId) {
        this.layoutService.showErrorToast('Please ensure Asset Type and Make are auto-filled by selecting a model');
        this.isSubmittingModalAsset = false;
        return;
      }
      
      // Map form field to API field
      const assetData = {
        ...formValue,
        typeId: formValue.assetTypeId
      };
      delete assetData.assetTypeId; // Remove the form field name
      const poNumber = this.selectedPo?.poNumber;

      if (poNumber) {
        const operation = this.modalAssetEditMode && this.selectedModalAsset
          ? this.assetService.updateAsset(this.selectedModalAsset.assetId!, assetData)
          : this.assetService.createAsset(assetData);

        operation
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
              this.isSubmittingModalAsset = false;
            })
          )
          .subscribe({
            next: (asset) => {
              const message = this.modalAssetEditMode ? 'Asset updated successfully' : 'Asset created successfully';
              this.layoutService.showSuccessToast(message);
              
              // Update local data
              if (this.modalAssetEditMode) {
                // Update existing asset in the list
                const assets = this.createdAssetsByPo.get(poNumber!) || [];
                const index = assets.findIndex(a => a.assetId === this.selectedModalAsset?.assetId);
                if (index !== -1) {
                  assets[index] = asset as Asset;
                }
              } else {
                // Add new asset to the list
                const assets = this.createdAssetsByPo.get(poNumber!) || [];
                assets.push(asset as Asset);
                this.createdAssetsByPo.set(poNumber!, assets);
              }
              
              // Reset form and refresh view
              if (!this.modalAssetEditMode) {
                this.cancelCreateAssetForm(); // Hide the create form after successful creation
              }
              this.filterModalAssets();
              this.loadAssetCountsForPOs();
            },
            error: (error) => {
              console.error('Error saving asset:', error);
              this.layoutService.showErrorToast('Failed to save asset');
            }
          });
      }
    }
  }

  openEditAssetForm(asset: Asset): void {
    this.modalAssetEditMode = true;
    this.selectedModalAsset = asset;
    this.modalAssetForm.patchValue({
      assetTypeId: asset.typeId,
      makeId: asset.makeId,
      modelId: asset.modelId,
      name: asset.name,
      serialNumber: asset.serialNumber,
      itAssetCode: asset.itAssetCode,
      macAddress: asset.macAddress,
      ipv4Address: asset.ipv4Address,
      status: asset.status,
      osId: asset.osId,
      osVersionId: asset.osVersionId
    });
  }

  deleteModalAsset(asset: Asset): void {
    if (confirm(`Are you sure you want to delete "${asset.name}"? This action cannot be undone.`)) {
      this.deletingModalAssets.add(asset.assetId!);
      
      this.assetService.deleteAsset(asset.assetId!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.deletingModalAssets.delete(asset.assetId!);
            this.layoutService.showSuccessToast('Asset deleted successfully');
            
            // Remove from local data
            const poNumber = this.selectedPo?.poNumber;
            if (poNumber) {
              const assets = this.createdAssetsByPo.get(poNumber) || [];
              const filteredAssets = assets.filter(a => a.assetId !== asset.assetId);
              this.createdAssetsByPo.set(poNumber, filteredAssets);
              this.filterModalAssets();
              this.loadAssetCountsForPOs();
            }
          },
          error: (error) => {
            this.deletingModalAssets.delete(asset.assetId!);
            console.error('Error deleting asset:', error);
            this.layoutService.showErrorToast('Failed to delete asset');
          }
        });
    }
  }

  isDeletingModalAsset(assetId: number): boolean {
    return this.deletingModalAssets.has(assetId);
  }

  getAssetTypeName(typeId?: number): string {
    if (!typeId) return 'Unknown';
    const type = this.assetTypes.find(t => t.id === typeId);
    return type ? type.name : `Type #${typeId}`;
  }

  getAssetMakeName(makeId?: number): string {
    if (!makeId) return 'Unknown';
    const make = this.assetMakes.find(m => m.id === makeId);
    return make ? make.name : 'Unknown';
  }

  getAssetModelName(modelId?: number): string {
    if (!modelId) return 'Unknown';
    const model = this.assetModels.find(m => m.id === modelId);
    return model ? model.name : 'Unknown';
  }

  getAssetStatusBadgeClass(status: string): string {
    switch (status) {
      case 'IN_STOCK':
        return 'bg-blue-100 text-blue-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'IN_REPAIR':
      case 'REPAIR':
        return 'bg-orange-100 text-orange-800';
      case 'BROKEN':
        return 'bg-red-100 text-red-800';
      case 'CEASED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Helper methods for modal form dependencies
  getAvailableModelsForModal(): AssetModel[] {
    // Always return all models - do not filter based on make selection
    // This allows users to select any model, which will auto-fill make and type
    return this.assetModels;
  }

  getAvailableMakesForModal(): AssetMake[] {
    // Filter makes based on selected type (if any)
    const selectedTypeId = this.modalAssetForm.get('assetTypeId')?.value;
    if (selectedTypeId) {
      return this.getMakesByAssetType(Number(selectedTypeId));
    }
    // If no type selected, return all makes
    return this.assetMakes;
  }

  getAvailableOSVersionsForModal(): OSVersion[] {
    // Return all OS versions - user can select any OS version
    return this.osVersions;
  }

  canCreateMoreAssets(): boolean {
    if (!this.selectedPo) return false;
    const created = this.getCreatedAssetsForPo(this.selectedPo.poNumber).length;
    return created < (this.selectedPo.totalDevices || 0);
  }

  getRemainingAssetsCount(): number {
    if (!this.selectedPo) return 0;
    const created = this.getCreatedAssetsForPo(this.selectedPo.poNumber).length;
    return Math.max(0, (this.selectedPo.totalDevices || 0) - created);
  }

  // New methods for horizontal asset card management
  toggleAssetExpansion(asset: Asset): void {
    if (!asset.assetId) return;
    
    const assetId = asset.assetId;
    if (this.expandedAssets.has(assetId)) {
      this.expandedAssets.delete(assetId);
      this.editingModalAssets.delete(assetId);
      this.assetEditForms.delete(assetId);
    } else {
      this.expandedAssets.add(assetId);
    }
  }

  isAssetExpanded(asset: Asset): boolean {
    return asset.assetId ? this.expandedAssets.has(asset.assetId) : false;
  }

  startInlineEditing(asset: Asset): void {
    if (!asset.assetId) return;
    
    const assetId = asset.assetId;
    this.editingModalAssets.add(assetId);
    
    // Create edit form for this asset
    const editForm = this.createInlineAssetEditForm(asset);
    this.assetEditForms.set(assetId, editForm);
    
    // Setup form dependencies
    this.setupModalFormDependenciesForForm(editForm);
  }

  cancelInlineEditing(asset: Asset): void {
    if (!asset.assetId) return;
    
    const assetId = asset.assetId;
    this.editingModalAssets.delete(assetId);
    this.assetEditForms.delete(assetId);
  }

  isInlineEditing(asset: Asset): boolean {
    return asset.assetId ? this.editingModalAssets.has(asset.assetId) : false;
  }

  getInlineEditForm(asset: Asset): FormGroup | null {
    return asset.assetId ? this.assetEditForms.get(asset.assetId) || null : null;
  }

  private createInlineAssetEditForm(asset: Asset): FormGroup {
    return this.fb.group({
      assetTypeId: [{ value: asset.typeId, disabled: true }],
      makeId: [{ value: asset.makeId, disabled: true }],
      modelId: [asset.modelId, [Validators.required]],
      name: [asset.name, [Validators.required, Validators.minLength(2)]],
      serialNumber: [asset.serialNumber, [Validators.required, Validators.minLength(2)]],
      itAssetCode: [asset.itAssetCode, [Validators.required, Validators.minLength(2)]],
      macAddress: [asset.macAddress || ''],
      ipv4Address: [asset.ipv4Address || ''],
      osId: [{ value: asset.osId, disabled: true }],
      osVersionId: [asset.osVersionId],
      warrantyExpiry: [asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split('T')[0] : ''],
      status: [asset.status || 'IN_STOCK', [Validators.required]]
    });
  }

  private setupModalFormDependenciesForForm(form: FormGroup): void {
    // Model selection triggers auto-fill
    form.get('modelId')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged()
    ).subscribe(modelId => {
      if (modelId) {
        const selectedModel = this.assetModels.find(m => m.id === modelId);
        if (selectedModel) {
          // Auto-fill Asset Type and Make based on Model
          form.patchValue({
            assetTypeId: selectedModel.typeId,
            makeId: selectedModel.makeId
          });
        }
      }
    });
  }

  saveInlineAsset(asset: Asset): void {
    if (!asset.assetId) return;
    
    const editForm = this.getInlineEditForm(asset);
    if (!editForm || editForm.invalid) return;

    const formData = editForm.getRawValue();
    const updateData: Partial<Asset> = {
      ...formData,
      assetId: asset.assetId,
      poNumber: asset.poNumber
    };

    this.assetService.updateAsset(asset.assetId, updateData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          // Remove from editing state
          this.cancelInlineEditing(asset);
        })
      )
      .subscribe({
        next: (updatedAsset) => {
          // Update the asset in the filteredModalAssets array
          const index = this.filteredModalAssets.findIndex(a => a.assetId === asset.assetId);
          if (index !== -1) {
            this.filteredModalAssets[index] = updatedAsset;
          }
          
          // Update the asset in createdAssetsByPo map
          if (this.selectedPo) {
            const assets = this.createdAssetsByPo.get(this.selectedPo.poNumber) || [];
            const assetIndex = assets.findIndex(a => a.assetId === asset.assetId);
            if (assetIndex !== -1) {
              assets[assetIndex] = updatedAsset;
              this.createdAssetsByPo.set(this.selectedPo.poNumber, assets);
            }
          }
        },
        error: (error) => {
          console.error('Error updating asset:', error);
          // Handle error appropriately
        }
      });
  }

  // New methods for create asset form toggle
  toggleCreateAssetForm(): void {
    this.showCreateAssetForm = !this.showCreateAssetForm;
    if (this.showCreateAssetForm) {
      this.openCreateAssetForm();
    }
  }

  cancelCreateAssetForm(): void {
    this.showCreateAssetForm = false;
    this.modalAssetForm.reset({
      status: 'IN_STOCK'
    });
  }

  /**
   * Get the status of a Purchase Order based on its properties
   */
  getPOStatus(po: AssetPoWithDetails): string {
    // If PO has assets created equal to total devices, it's completed
    if (po.createdAssetsCount && po.createdAssetsCount >= po.totalDevices) {
      return 'Completed';
    }
    
    // If PO has some assets but not all, it's pending
    if (po.createdAssetsCount && po.createdAssetsCount > 0) {
      return 'Pending';
    }
    
    // If PO has no assets created yet, it's active (ready for asset creation)
    return 'Active';
  }

  /**
   * Get badge class for PO status
   */
  getPOStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }

  /**
   * Get count of active Purchase Orders
   */
  getActivePOCount(): number {
    return this.assetPos.filter(po => this.getPOStatus(po) === 'Active').length;
  }

  /**
   * Get count of pending Purchase Orders
   */
  getPendingPOCount(): number {
    return this.assetPos.filter(po => this.getPOStatus(po) === 'Pending').length;
  }

  /**
   * Get count of completed Purchase Orders
   */
  getCompletedPOCount(): number {
    return this.assetPos.filter(po => this.getPOStatus(po) === 'Completed').length;
  }

  /**
   * Get count of cancelled Purchase Orders
   */
  getCancelledPOCount(): number {
    return this.assetPos.filter(po => this.getPOStatus(po) === 'Cancelled').length;
  }
} 