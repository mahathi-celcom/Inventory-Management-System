import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { AssetService } from './asset.service';
import { 
  Asset, 
  AssetDataStore, 
  ClientSideFilterOptions, 
  FilterState, 
  FilterDropdownOptions,
  AssetWithFilterData,
  User,
  Vendor,
  AssetType,
  AssetMake,
  AssetModelWithDetails,
  OperatingSystem,
  OSVersion,
  PurchaseOrder,
  ASSET_STATUS,
  ASSET_STATUS_DISPLAY,
  OWNER_TYPE,
  ACQUISITION_TYPE
} from '../models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class ClientSideFilterService {
  // Data store signals
  private dataStore = signal<AssetDataStore>({
    assets: [],
    users: [],
    vendors: [],
    assetTypes: [],
    assetMakes: [],
    assetModels: [],
    operatingSystems: [],
    osVersions: [],
    purchaseOrders: [],
    availablePONumbers: [],
    lastUpdated: new Date(),
    isLoaded: false
  });

  // Filter state signals
  private filterOptions = signal<ClientSideFilterOptions>({});
  private loading = signal(false);
  private error = signal<string | null>(null);

  // Computed filtered data
  public filteredAssets = computed(() => this.applyAssetFilters());
  public filteredPOs = computed(() => this.applyPOFilters());
  public hasActiveFilters = computed(() => this.checkHasActiveFilters());
  public totalFilteredAssets = computed(() => this.filteredAssets().length);
  public filterSummary = computed(() => this.generateFilterSummary());

  // Dropdown options
  public dropdownOptions = computed(() => this.generateDropdownOptions());

  // Public observables
  public loading$ = computed(() => this.loading());
  public error$ = computed(() => this.error());
  public dataLoaded$ = computed(() => this.dataStore().isLoaded);

  constructor(private assetService: AssetService) {}

  /**
   * Load all required data for client-side filtering
   */
  loadAllData(): Observable<AssetDataStore> {
    console.log('🔄 Loading complete dataset for client-side filtering...');
    this.loading.set(true);
    this.error.set(null);

    return forkJoin({
      assets: this.assetService.getAllAssets({}, 0, 1000).pipe(
        map(response => response.content),
        catchError(() => of([]))
      ),
      users: this.assetService.getUsers().pipe(catchError(() => of([]))),
      vendors: this.assetService.getVendors().pipe(catchError(() => of([]))),
      assetTypes: this.assetService.getAssetTypes().pipe(catchError(() => of([]))),
      assetMakes: this.assetService.getAssetMakes().pipe(catchError(() => of([]))),
      assetModels: this.assetService.getAssetModelsWithDetails().pipe(catchError(() => of([]))),
      operatingSystems: this.assetService.getOperatingSystems().pipe(catchError(() => of([]))),
      osVersions: this.assetService.getOSVersions().pipe(catchError(() => of([]))),
      purchaseOrders: this.assetService.getPurchaseOrders().pipe(catchError(() => of([])))
    }).pipe(
      map(data => {
        const store: AssetDataStore = {
          assets: this.enhanceAssetsWithFilterData(data.assets, data),
          users: data.users,
          vendors: data.vendors,
          assetTypes: data.assetTypes,
          assetMakes: data.assetMakes,
          assetModels: data.assetModels,
          operatingSystems: data.operatingSystems,
          osVersions: data.osVersions,
          purchaseOrders: data.purchaseOrders,
          availablePONumbers: data.purchaseOrders.map(po => po.poNumber || '').filter(Boolean),
          lastUpdated: new Date(),
          isLoaded: true
        };

        console.log('✅ Complete dataset loaded:', {
          assets: store.assets.length,
          users: store.users.length,
          vendors: store.vendors.length,
          models: store.assetModels.length
        });

        return store;
      }),
      tap(store => {
        this.dataStore.set(store);
        this.loading.set(false);
      }),
      catchError(error => {
        console.error('❌ Error loading complete dataset:', error);
        this.error.set('Failed to load data for filtering');
        this.loading.set(false);
        return of(this.dataStore());
      })
    );
  }

  /**
   * Enhance assets with computed filter-friendly properties
   */
  private enhanceAssetsWithFilterData(assets: Asset[], data: any): AssetWithFilterData[] {
    return assets.map(asset => {
      const model = data.assetModels.find((m: AssetModelWithDetails) => m.id === asset.modelId);
      const user = data.users.find((u: User) => u.id === asset.currentUserId);
      const vendor = data.vendors.find((v: Vendor) => v.id === asset.vendorId);
      const osVersion = data.osVersions.find((osv: OSVersion) => osv.id === asset.osVersionId);
      const os = data.operatingSystems.find((os: OperatingSystem) => os.id === asset.osId);

      const enhanced: AssetWithFilterData = {
        ...asset,
        modelName: model?.name || '',
        makeName: model?.makeName || '',
        typeName: model?.typeName || '',
        currentUserName: user?.name || '',
        vendorName: vendor?.name || '',
        osName: os?.name || '',
        osVersionName: osVersion?.versionNumber || '',
        combinedSearchText: [
          asset.name,
          asset.serialNumber,
          asset.itAssetCode,
          model?.name,
          user?.name,
          vendor?.name
        ].filter(Boolean).join(' ').toLowerCase()
      };

      return enhanced;
    });
  }

  /**
   * Update filter options and trigger filtering
   */
  updateFilters(filters: ClientSideFilterOptions): void {
    console.log('🔍 Updating client-side filters:', filters);
    this.filterOptions.set(filters);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    console.log('🔄 Clearing all client-side filters');
    this.filterOptions.set({});
  }

  /**
   * Apply filters to assets in memory
   */
  private applyAssetFilters(): AssetWithFilterData[] {
    const store = this.dataStore();
    const filters = this.filterOptions();

    if (!store.isLoaded || store.assets.length === 0) {
      return [];
    }

    let filtered = [...store.assets] as AssetWithFilterData[];

    // Apply each filter with AND logic
    if (filters.search?.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(asset => 
        asset.combinedSearchText?.includes(searchTerm)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(asset => asset.status === filters.status);
    }

    if (filters.modelName) {
      filtered = filtered.filter(asset => asset.modelName === filters.modelName);
    }

    if (filters.currentUserName) {
      filtered = filtered.filter(asset => asset.currentUserName === filters.currentUserName);
    }

    if (filters.osName) {
      filtered = filtered.filter(asset => asset.osName === filters.osName);
    }



    console.log(`🔍 Applied filters: ${store.assets.length} → ${filtered.length} assets`);
    return filtered;
  }

  /**
   * Apply filters to POs in memory
   */
  private applyPOFilters(): PurchaseOrder[] {
    const store = this.dataStore();
    const filters = this.filterOptions();

    if (!store.isLoaded || store.purchaseOrders.length === 0) {
      return [];
    }

    let filtered = [...store.purchaseOrders];

    if (filters.poNumber?.trim()) {
      const searchTerm = filters.poNumber.toLowerCase().trim();
      filtered = filtered.filter(po => 
        po.poNumber?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.invoiceNumber?.trim()) {
      const searchTerm = filters.invoiceNumber.toLowerCase().trim();
      filtered = filtered.filter(po => 
        po.name?.toLowerCase().includes(searchTerm) // Assuming name field contains invoice info
      );
    }

    // Add more PO filters as needed

    return filtered;
  }

  /**
   * Check if any filters are active
   */
  private checkHasActiveFilters(): boolean {
    const filters = this.filterOptions();
    return Object.values(filters).some(value => 
      value !== undefined && value !== null && value !== ''
    );
  }

  /**
   * Generate filter summary text
   */
  private generateFilterSummary(): string {
    const filters = this.filterOptions();
    const activeFilters: string[] = [];

    if (filters.search) activeFilters.push(`Search: "${filters.search}"`);
    if (filters.status) activeFilters.push(`Status: ${filters.status}`);
    if (filters.modelName) activeFilters.push(`Model: ${filters.modelName}`);
    if (filters.currentUserName) activeFilters.push(`User: ${filters.currentUserName}`);
    if (filters.osName) activeFilters.push(`OS: ${filters.osName}`);


    return activeFilters.length > 0 ? activeFilters.join(', ') : 'No filters applied';
  }

  /**
   * Generate dropdown options from loaded data
   */
  private generateDropdownOptions(): FilterDropdownOptions {
    const store = this.dataStore();

    if (!store.isLoaded) {
      return {
        statuses: [],
        models: [],
        users: [],
        osOptions: []
      };
    }

    return {
      statuses: Object.entries(ASSET_STATUS_DISPLAY).map(([value, label]) => ({ value, label })),
      models: store.assetModels.map(model => ({ 
        value: model.name, 
        label: `${model.name} (${model.makeName})` 
      })),
      users: store.users.map(user => ({ 
        value: user.name, 
        label: user.name 
      })),
      osOptions: store.operatingSystems.map(os => ({ 
        value: os.name, 
        label: os.name 
      }))
    };
  }

  /**
   * Get current data store
   */
  getDataStore(): AssetDataStore {
    return this.dataStore();
  }

  /**
   * Refresh data (reload from backend)
   */
  refreshData(): Observable<AssetDataStore> {
    return this.loadAllData();
  }
} 