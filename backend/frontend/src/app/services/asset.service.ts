import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, forkJoin, of } from 'rxjs';
import { map, catchError, tap, debounceTime, distinctUntilChanged, switchMap, finalize } from 'rxjs/operators';
import { ApiConfigService } from './api-config.service';
import { 
  Asset, 
  AssetSummary, 
  PageResponse, 
  AssetFilter,
  AssetFilterOptions,
  AssetFilterRequest,
  FilterMetadata,
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
  AssetDTO,
  BulkAssetCreationResponse,
  STATUS_RULES,
  ASSET_MESSAGES,
  ASSET_STATUS,
  BulkAssetUpdateRequest,
  BulkAssetUpdateResponse,
  AssetUserAssignment,
  AssetAssignmentHistoryRequest,
  AssetAssignmentHistoryResponse,
  AssetUnassignmentRequest,
  AssetStatusHistoryRequest,
  AssetStatusHistoryResponse
} from '../models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private assetsSubject = new BehaviorSubject<Asset[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private summarySubject = new BehaviorSubject<AssetSummary | null>(null);
  private filtersSubject = new BehaviorSubject<AssetFilterOptions>({});
  public currentFilters = signal<AssetFilterOptions>({});

  // Public observables
  public assets$ = this.assetsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public summary$ = this.summarySubject.asObservable();
  public filters$ = this.filtersSubject.asObservable();

  // Cache for dropdown data
  private dropdownCache = {
    assetTypes: null as AssetType[] | null,
    assetMakes: null as AssetMake[] | null,
    assetModels: null as AssetModel[] | null,
    assetModelsWithDetails: null as AssetModelWithDetails[] | null,
    vendors: null as Vendor[] | null,
    users: null as User[] | null,
    operatingSystems: null as OperatingSystem[] | null,
    osVersions: null as OSVersion[] | null,
    purchaseOrders: null as PurchaseOrder[] | null
  };

  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {}

  // CRUD Operations
  getAllAssets(filter?: AssetFilterOptions, page = 0, size = 10, sort?: string, sortDirection: 'ASC' | 'DESC' = 'DESC'): Observable<PageResponse<Asset>> {
    this.setLoading(true);
    this.clearError();

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    // Add sorting parameters
    if (sort) {
      params = params.set('sort', sort);
      params = params.set('sortDirection', sortDirection);
    }

    // Enhanced filter parameter mapping
    if (filter) {
      // Quick search - searches across multiple fields
      if (filter.search && filter.search.trim()) {
        params = params.set('search', filter.search.trim());
      }

      // Status filter
      if (filter.status && filter.status !== 'All' && filter.status !== 'ALL') {
        params = params.set('status', filter.status);
      }

      // Asset Model filter
      if (filter.model && filter.model !== '') {
        params = params.set('modelId', filter.model);
      }
      if (filter.modelId) {
        params = params.set('modelId', filter.modelId.toString());
      }

      // OS Version filter
      if (filter.osVersion && filter.osVersion !== '') {
        params = params.set('osVersionId', filter.osVersion);
      }
      if (filter.osVersionId) {
        params = params.set('osVersionId', filter.osVersionId.toString());
      }

      // Assignment Status filter
      if (filter.assignmentStatus && filter.assignmentStatus !== 'All' && filter.assignmentStatus !== '') {
        params = params.set('assignmentStatus', filter.assignmentStatus);
      }

      // Ownership filter
      if (filter.ownership && filter.ownership !== 'All' && filter.ownership !== 'ALL') {
        params = params.set('ownerType', filter.ownership);
      }

      // Asset Type filter
      if (filter.typeId && filter.typeId !== '') {
        params = params.set('typeId', filter.typeId);
      }

      // Make filter
      if (filter.makeId) {
        params = params.set('makeId', filter.makeId.toString());
      }

      // Vendor filter
      if (filter.vendorId && filter.vendorId !== '') {
        params = params.set('vendorId', filter.vendorId);
      }

      // User assignment filter
      if (filter.currentUserId) {
        params = params.set('currentUserId', filter.currentUserId.toString());
      }

      // Show broken assets filter
      if (filter.showBrokenAssets !== undefined) {
        params = params.set('showBroken', filter.showBrokenAssets.toString());
      }
    }

    console.log('🔍 Sending filter request to backend:', {
      endpoint: this.apiConfig.endpoints.assets.getAll,
      params: params.toString(),
      filters: filter
    });

    return this.http.get<any>(this.apiConfig.endpoints.assets.getAll, { params })
      .pipe(
        map(response => {
          console.log('📊 Backend response:', response);
          
          // Handle different backend response formats
          if (response.content && Array.isArray(response.content)) {
            // Spring Boot PageResponse format
            return {
              content: response.content as Asset[],
              page: response.page?.number || response.page || 0,
              size: response.page?.size || response.size || size,
              totalElements: response.page?.totalElements || response.totalElements || 0,
              totalPages: response.page?.totalPages || response.totalPages || 0,
              first: response.page?.first || response.first || false,
              last: response.page?.last || response.last || false
            } as PageResponse<Asset>;
          } else if (response.data && Array.isArray(response.data)) {
            // Custom wrapper format
            return {
              content: response.data as Asset[],
              page: response.currentPage || 0,
              size: response.pageSize || size,
              totalElements: response.totalElements || response.data.length,
              totalPages: response.totalPages || 1,
              first: (response.currentPage || 0) === 0,
              last: (response.currentPage || 0) >= (response.totalPages || 1) - 1
            } as PageResponse<Asset>;
          } else if (Array.isArray(response)) {
            // Simple array response - fallback
            const assets = response as Asset[];
            return {
              content: assets,
              page: 0,
              size: assets.length,
              totalElements: assets.length,
              totalPages: 1,
              first: true,
              last: true
            } as PageResponse<Asset>;
          } else {
            // Unknown format - return empty
            console.warn('⚠️ Unknown response format:', response);
            return {
              content: [],
              page: 0,
              size: 0,
              totalElements: 0,
              totalPages: 0,
              first: true,
              last: true
            } as PageResponse<Asset>;
          }
        }),
        tap(response => {
          console.log('✅ Processed response:', {
            totalAssets: response.totalElements,
            currentPage: response.page,
            totalPages: response.totalPages,
            assetsInPage: response.content.length
          });
          
          this.assetsSubject.next(response.content);
          this.setLoading(false);
        }),
        catchError(error => this.handleError(error))
      );
  }

  getAssetById(id: number): Observable<Asset> {
    this.setLoading(true);
    this.clearError();

    const url = this.apiConfig.buildUrlWithId('assets', 'getById', id);
    return this.http.get<any>(url)
      .pipe(
        map(response => {
          // Handle wrapped response
          if (response.data) return response.data as Asset;
          return response as Asset;
        }),
        tap(() => this.setLoading(false)),
        catchError(error => this.handleError(error))
      );
  }

  createAsset(asset: Partial<Asset>): Observable<Asset> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<any>(this.apiConfig.endpoints.assets.create, asset)
      .pipe(
        map(response => {
          if (response.data) return response.data as Asset;
          return response as Asset;
        }),
        tap(newAsset => {
          const currentAssets = this.assetsSubject.value;
          this.assetsSubject.next([newAsset, ...currentAssets]);
          this.setLoading(false);
        }),
        catchError(error => this.handleError(error))
      );
  }

  updateAsset(id: number, asset: Partial<Asset>): Observable<Asset> {
    this.setLoading(true);
    this.clearError();

    const url = this.apiConfig.buildUrlWithId('assets', 'update', id);
    return this.http.put<any>(url, asset)
      .pipe(
        map(response => {
          if (response.data) return response.data as Asset;
          return response as Asset;
        }),
        tap(updatedAsset => {
          const currentAssets = this.assetsSubject.value;
          const index = currentAssets.findIndex(a => a.assetId === id);
          if (index !== -1) {
            currentAssets[index] = updatedAsset;
            this.assetsSubject.next([...currentAssets]);
          }
          this.setLoading(false);
        }),
        catchError(error => this.handleError(error))
      );
  }

  deleteAsset(id: number): Observable<void> {
    this.setLoading(true);
    this.clearError();

    const url = this.apiConfig.buildUrlWithId('assets', 'delete', id);
    return this.http.delete<void>(url)
      .pipe(
        tap(() => {
          const currentAssets = this.assetsSubject.value;
          this.assetsSubject.next(currentAssets.filter(a => a.assetId !== id));
          this.setLoading(false);
        }),
        catchError(error => this.handleError(error))
      );
  }

  // Advanced Filtering
  searchAssets(searchTerm: string): Observable<Asset[]> {
    if (!searchTerm.trim()) {
      return of([]);
    }

    const params = new HttpParams().set('search', searchTerm);
    return this.http.get<Asset[]>(this.apiConfig.endpoints.assets.search, { params })
      .pipe(
        map(response => this.apiConfig.extractData(response) as Asset[]),
        debounceTime(300),
        distinctUntilChanged(),
        catchError(error => this.handleError(error))
      );
  }

  filterAssets(filter: AssetFilter): Observable<Asset[]> {
    let params = new HttpParams();
    
    Object.keys(filter).forEach(key => {
      const value = (filter as any)[key];
      if (value && value !== 'All' && value !== '') {
        params = params.set(key, value);
      }
    });

    return this.http.get<Asset[]>(this.apiConfig.endpoints.assets.getAll, { params })
      .pipe(
        map(response => this.apiConfig.extractData(response) as Asset[]),
        tap(assets => this.assetsSubject.next(assets)),
        catchError(error => this.handleError(error))
      );
  }

  // Dashboard Summary
  getAssetSummary(): Observable<AssetSummary> {
    return this.http.get<AssetSummary>('/api/assets/summary')
      .pipe(
        tap(summary => this.summarySubject.next(summary)),
        catchError(error => {
          // Fallback to mock data for development
          const mockSummary: AssetSummary = {
            totalAssets: 0,
            activeAssets: 0,
            brokenAssets: 0,
            assignedAssets: 0
          };
          this.summarySubject.next(mockSummary);
          return of(mockSummary);
        })
      );
  }

  // Dropdown Data Methods with proper type handling
  getAssetTypes(): Observable<AssetType[]> {
    if (this.dropdownCache.assetTypes) {
      return of(this.dropdownCache.assetTypes);
    }

    return this.http.get<any>(this.apiConfig.endpoints.assetTypes.getAll)
      .pipe(
        map(response => {
          const data = Array.isArray(response) ? response : 
                      response.data ? response.data : 
                      response.content ? response.content : [];
          return data as AssetType[];
        }),
        tap(data => this.dropdownCache.assetTypes = data),
        catchError(error => {
          console.error('Error loading asset types:', error);
          return of([]);
        })
      );
  }

  getAssetMakes(): Observable<AssetMake[]> {
    if (this.dropdownCache.assetMakes) {
      return of(this.dropdownCache.assetMakes);
    }

    return this.http.get<any>(this.apiConfig.endpoints.assetMakes.getAll)
      .pipe(
        map(response => {
          const data = Array.isArray(response) ? response : 
                      response.data ? response.data : 
                      response.content ? response.content : [];
          return data as AssetMake[];
        }),
        tap(data => this.dropdownCache.assetMakes = data),
        catchError(error => {
          console.error('Error loading asset makes:', error);
          return of([]);
        })
      );
  }

  getAssetModels(): Observable<AssetModel[]> {
    if (this.dropdownCache.assetModels) {
      return of(this.dropdownCache.assetModels);
    }

    return this.http.get<any>(this.apiConfig.endpoints.assetModels.getAll)
      .pipe(
        map(response => {
          const data = Array.isArray(response) ? response : 
                      response.data ? response.data : 
                      response.content ? response.content : [];
          return data as AssetModel[];
        }),
        tap(data => this.dropdownCache.assetModels = data),
        catchError(error => {
          console.error('Error loading asset models:', error);
          return of([]);
        })
      );
  }

  getAssetModelsByMake(makeId: number): Observable<AssetModel[]> {
    const url = `${this.apiConfig.endpoints.assetModels.getByMake}/${makeId}`;
    return this.http.get<any>(url)
      .pipe(
        map(response => {
          const data = Array.isArray(response) ? response : 
                      response.data ? response.data : 
                      response.content ? response.content : [];
          return data as AssetModel[];
        }),
        catchError(error => {
          console.error('Error loading models by make:', error);
          return of([]);
        })
      );
  }

  getAssetModelsWithDetails(): Observable<AssetModelWithDetails[]> {
    if (this.dropdownCache.assetModelsWithDetails) {
      return of(this.dropdownCache.assetModelsWithDetails);
    }

    // For now, we'll use the existing endpoint and transform the data
    // In a real implementation, this would be a dedicated backend endpoint
    return forkJoin({
      models: this.getAssetModels(),
      makes: this.getAssetMakes(),
      types: this.getAssetTypes()
    }).pipe(
      map(({ models, makes, types }) => {
        const modelsWithDetails: AssetModelWithDetails[] = models.map(model => {
          const make = makes.find(m => m.id === model.makeId);
          const type = types.find(t => t.id === (make as any)?.typeId);
          
          return {
            id: model.id,
            name: model.name,
            makeId: model.makeId,
            makeName: make?.name || 'Unknown Make',
            typeId: type?.id || 0,
            typeName: type?.name || 'Unknown Type',
            ram: model.ram,
            storage: model.storage,
            processor: model.processor
          };
        });
        
        this.dropdownCache.assetModelsWithDetails = modelsWithDetails;
        return modelsWithDetails;
      }),
      catchError(error => {
        console.error('Error loading asset models with details:', error);
          return of([]);
        })
      );
  }

  getVendors(): Observable<Vendor[]> {
    if (this.dropdownCache.vendors) {
      return of(this.dropdownCache.vendors);
    }

    return this.http.get<any>(this.apiConfig.endpoints.vendors.getAll)
      .pipe(
        map(response => {
          const data = Array.isArray(response) ? response : 
                      response.data ? response.data : 
                      response.content ? response.content : [];
          return data as Vendor[];
        }),
        tap(data => this.dropdownCache.vendors = data),
        catchError(error => {
          console.error('Error loading vendors:', error);
          return of([]);
        })
      );
  }

  getUsers(): Observable<User[]> {
    if (this.dropdownCache.users) {
      return of(this.dropdownCache.users);
    }

    console.log('🔍 USER SERVICE: Making API call to /api/users');
    return this.http.get<any>('/api/users')
      .pipe(
        tap(rawResponse => {
          console.log('🔍 USER SERVICE: Raw API Response:', rawResponse);
          console.log('🔍 USER SERVICE: Response type:', typeof rawResponse);
          console.log('🔍 USER SERVICE: Is Array:', Array.isArray(rawResponse));
        }),
        map(response => {
          const data = Array.isArray(response) ? response : 
                      response.data ? response.data : 
                      response.content ? response.content : [];
          
          console.log('🔍 USER SERVICE: Extracted data:', data);
          console.log('🔍 USER SERVICE: Data length:', data.length);
          
          if (data.length > 0) {
            console.log('🔍 USER SERVICE: First item structure:', data[0]);
            console.log('🔍 USER SERVICE: First item keys:', Object.keys(data[0]));
          }
          
          // 🔧 FIX: Map various backend user properties to frontend name property
          const mappedData = data.map((user: any) => ({
            id: user.id,
            name: user.fullName || user.name || user.username || user.email || `User ${user.id}`,
            email: user.email || '',
            fullName: user.fullName,
            username: user.username
          } as User));
          
          console.log('🔍 USER SERVICE: Mapped data with name property:', mappedData);
          
          return mappedData;
        }),
        tap(data => {
          console.log('🔍 USER SERVICE: Final mapped data:', data);
          this.dropdownCache.users = data;
        }),
        catchError(error => {
          console.error('🔍 USER SERVICE: Error loading users:', error);
          console.error('🔍 USER SERVICE: Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url
          });
          return of([]);
        })
      );
  }

  getOperatingSystems(): Observable<OperatingSystem[]> {
    if (this.dropdownCache.operatingSystems) {
      console.log('🔍 OS SERVICE: Returning cached data:', this.dropdownCache.operatingSystems);
      return of(this.dropdownCache.operatingSystems);
    }

    console.log('🔍 OS SERVICE: Making API call to /api/os');
    return this.http.get<any>('/api/os')
      .pipe(
        tap(rawResponse => {
          console.log('🔍 OS SERVICE: Raw API Response:', rawResponse);
          console.log('🔍 OS SERVICE: Response type:', typeof rawResponse);
          console.log('🔍 OS SERVICE: Is Array:', Array.isArray(rawResponse));
        }),
        map(response => {
          const data = Array.isArray(response) ? response : 
                      response.data ? response.data : 
                      response.content ? response.content : [];
          
          console.log('🔍 OS SERVICE: Extracted data:', data);
          console.log('🔍 OS SERVICE: Data length:', data.length);
          
          if (data.length > 0) {
            console.log('🔍 OS SERVICE: First item structure:', data[0]);
            console.log('🔍 OS SERVICE: First item keys:', Object.keys(data[0]));
          }
          
          // 🔧 FIX: Map backend osType to frontend name property
          const mappedData = data.map((os: any) => ({
            id: os.id,
            name: os.osType || os.name, // Use osType from backend or fallback to name
            osType: os.osType, // Keep original for reference
            status: os.status
          } as OperatingSystem));
          
          console.log('🔍 OS SERVICE: Mapped data with name property:', mappedData);
          
          return mappedData;
        }),
        tap(data => {
          console.log('🔍 OS SERVICE: Final mapped data:', data);
          this.dropdownCache.operatingSystems = data;
        }),
        catchError(error => {
          console.error('🔍 OS SERVICE: Error loading operating systems:', error);
          console.error('🔍 OS SERVICE: Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url
          });
          return of([]);
        })
      );
  }

  getOSVersions(): Observable<OSVersion[]> {
    if (this.dropdownCache.osVersions) {
      return of(this.dropdownCache.osVersions);
    }

    console.log('🔍 OS VERSION SERVICE: Making API call to /api/os-versions');
    return this.http.get<any>('/api/os-versions')
      .pipe(
        tap(rawResponse => {
          console.log('🔍 OS VERSION SERVICE: Raw API Response:', rawResponse);
          console.log('🔍 OS VERSION SERVICE: Response type:', typeof rawResponse);
          console.log('🔍 OS VERSION SERVICE: Is Array:', Array.isArray(rawResponse));
        }),
        map(response => {
          const data = Array.isArray(response) ? response : 
                      response.data ? response.data : 
                      response.content ? response.content : [];
          
          console.log('🔍 OS VERSION SERVICE: Extracted data:', data);
          console.log('🔍 OS VERSION SERVICE: Data length:', data.length);
          
          if (data.length > 0) {
            console.log('🔍 OS VERSION SERVICE: First item structure:', data[0]);
            console.log('🔍 OS VERSION SERVICE: First item keys:', Object.keys(data[0]));
          }
          
          // 🔧 FIX: Map backend OS version properties to frontend name property
          const mappedData = data.map((version: any) => ({
            id: version.id,
            name: version.versionNumber || version.name || `Version ${version.id}`,
            osId: version.osId,
            versionNumber: version.versionNumber || version.name,
            status: version.status
          } as OSVersion));
          
          console.log('🔍 OS VERSION SERVICE: Mapped data with name property:', mappedData);
          
          return mappedData;
        }),
        tap(data => {
          console.log('🔍 OS VERSION SERVICE: Final mapped data:', data);
          this.dropdownCache.osVersions = data;
        }),
        catchError(error => {
          console.error('🔍 OS VERSION SERVICE: Error loading OS versions:', error);
          console.error('🔍 OS VERSION SERVICE: Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url
          });
          return of([]);
        })
      );
  }

  getOSVersionsByOS(osId: number): Observable<OSVersion[]> {
    return this.http.get<any>(`/api/os-versions/os/${osId}`)
      .pipe(
        map(response => {
          const data = Array.isArray(response) ? response : 
                      response.data ? response.data : 
                      response.content ? response.content : [];
          return data as OSVersion[];
        }),
        catchError(error => {
          console.error('Error loading OS versions by OS:', error);
          return of([]);
        })
      );
  }

  getPurchaseOrders(): Observable<PurchaseOrder[]> {
    if (this.dropdownCache.purchaseOrders) {
      return of(this.dropdownCache.purchaseOrders);
    }

    return this.http.get<any>(this.apiConfig.endpoints.assetPos.getAll)
      .pipe(
        map(response => {
          const data = Array.isArray(response) ? response : 
                      response.data ? response.data : 
                      response.content ? response.content : [];
          return data.map((po: any) => ({
            id: po.id || 0,
            name: po.poNumber || '',
            poNumber: po.poNumber || '',
            acquisitionType: po.acquisitionType,
            vendorId: po.vendorId,
            ownerType: po.ownerType
          } as PurchaseOrder));
        }),
        tap(data => this.dropdownCache.purchaseOrders = data),
        catchError(error => {
          console.error('Error loading purchase orders:', error);
          return of([]);
        })
      );
  }

  getPOById(id: number): Observable<AssetPODTO> {
    const url = this.apiConfig.buildUrlWithId('assetPos', 'getById', id);
    return this.http.get<AssetPODTO>(url)
      .pipe(
        map(response => this.apiConfig.extractItem(response) as AssetPODTO),
        catchError(error => this.handleError(error))
      );
  }

  getPOByNumber(poNumber: string): Observable<AssetPODTO | null> {
    const params = new HttpParams().set('poNumber', poNumber);
    return this.http.get<any>(this.apiConfig.endpoints.assetPos.getAll, { params })
      .pipe(
        map(response => {
          const data = Array.isArray(response) ? response : 
                      response.data ? response.data : 
                      response.content ? response.content : [];
          return data.length > 0 ? data[0] as AssetPODTO : null;
        }),
        catchError(error => {
          console.error('Error loading PO by number:', error);
          return of(null);
        })
      );
  }

  // ===== REAL-TIME DEPENDENT DROPDOWN API METHODS =====
  
  /**
   * Get OS Versions by OS ID - Real-time dependent dropdown
   * GET /api/os-versions/os/{osId}
   */
  getOSVersionsByOSRealTime(osId: number): Observable<OSVersion[]> {
    if (!osId) {
      return of([]);
    }

    return this.http.get<any>(`/api/os-versions/os/${osId}`)
      .pipe(
        map(response => {
          const data = Array.isArray(response) ? response : 
                      response.data ? response.data : 
                      response.content ? response.content : [];
          return data.map((version: any) => ({
            id: version.id,
            name: version.versionNumber,
            osId: version.osId,
            versionNumber: version.versionNumber
          } as OSVersion));
        }),
        catchError(error => {
          console.error('Error loading OS versions by OS (real-time):', error);
          return of([]);
        })
      );
  }

  /**
   * Get Asset Model Details by Model ID - Real-time dependent auto-fill
   * GET /api/asset-models/{modelId}/details
   */
  getAssetModelDetails(modelId: number): Observable<AssetModelDetails> {
    return this.http.get<any>(`/api/asset-models/${modelId}/details`)
      .pipe(
        map(response => {
          const data = response.data || response;
          return {
            id: data.id,
            name: data.name,
            typeId: data.typeId,
            assetTypeName: data.assetTypeName,
            makeId: data.makeId,
            makeName: data.makeName,
            ram: data.ram,
            storage: data.storage,
            processor: data.processor
          } as AssetModelDetails;
        }),
        catchError(error => {
          console.error('Error loading asset model details:', error);
          throw error;
        })
      );
  }

  /**
   * Get PO Details by PO Number - Real-time dependent auto-fill
   * GET /api/asset-pos/po/{poNumber}
   */
  getPODetailsRealTime(poNumber: string): Observable<PODetails> {
    return this.http.get<any>(`/api/asset-pos/po/${poNumber}`)
      .pipe(
        map(response => {
          const data = response.data || response;
          return {
            poNumber: data.poNumber,
            acquisitionType: data.acquisitionType,
            acquisitionDate: data.acquisitionDate,
            invoiceNumber: data.invoiceNumber,
            acquisitionPrice: data.acquisitionPrice,
            vendorId: data.vendorId,
            ownerType: data.ownerType,
            leaseEndDate: data.leaseEndDate,
            minContractPeriod: data.minContractPeriod,
            rentalAmount: data.rentalAmount,
            currentPrice: data.currentPrice,
            totalDevices: data.totalDevices
          } as PODetails;
        }),
        catchError(error => {
          console.error('Error loading PO details:', error);
          throw error;
        })
      );
  }

  /**
   * ✅ NEW: Get PO Details by Number - Requested method
   * GET /api/asset-pos/po/{poNumber}
   */
  getPODetailsByNumber(poNumber: string): Observable<PODetails> {
    if (!poNumber || !poNumber.trim()) {
      return throwError(() => new Error('PO Number is required'));
    }

    return this.http.get<any>(`/api/asset-pos/po/${poNumber.trim()}`)
      .pipe(
        map(response => {
          const data = response.data || response;
          return {
            poNumber: data.poNumber,
            acquisitionType: data.acquisitionType,
            acquisitionDate: data.acquisitionDate,
            invoiceNumber: data.invoiceNumber,
            acquisitionPrice: data.acquisitionPrice,
            vendorId: data.vendorId,
            ownerType: data.ownerType,
            leaseEndDate: data.leaseEndDate,
            minContractPeriod: data.minContractPeriod,
            rentalAmount: data.rentalAmount,
            currentPrice: data.currentPrice,
            totalDevices: data.totalDevices
          } as PODetails;
        }),
        catchError(error => {
          console.error('Error in getPODetailsByNumber:', error);
          
          // Return a more specific error message based on status
          let errorMessage = 'Failed to load PO details';
          if (error.status === 404) {
            errorMessage = `PO Number "${poNumber}" not found`;
          } else if (error.status === 400) {
            errorMessage = `Invalid PO Number format: "${poNumber}"`;
          } else if (error.status === 0) {
            errorMessage = 'Backend service unavailable';
          }
          
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Get Vendor Warranty Details by Vendor ID - Real-time dependent auto-fill
   * GET /api/vendors/{vendorId}/warranty-details
   */
  getVendorWarrantyDetails(vendorId: number): Observable<VendorWarrantyDetails> {
    return this.http.get<any>(`/api/vendors/${vendorId}/warranty-details`)
      .pipe(
        map(response => {
          const data = response.data || response;
          return {
            vendorId: data.vendorId,
            name: data.name,
            extendedWarrantyVendor: data.extendedWarrantyVendor,
            extendedWarrantyVendorId: data.extendedWarrantyVendorId,
            defaultWarrantyMonths: data.defaultWarrantyMonths || 12,
            extendedWarrantyMonths: data.extendedWarrantyMonths || 24
          } as VendorWarrantyDetails;
        }),
        catchError(error => {
          console.error('Error loading vendor warranty details:', error);
          throw error;
        })
      );
  }

  // Bulk Operations
  bulkDeleteAssets(ids: number[]): Observable<void> {
    this.setLoading(true);
    const deleteRequests = ids.map(id => 
      this.http.delete<void>(this.apiConfig.buildUrlWithId('assets', 'delete', id))
    );

    return forkJoin(deleteRequests).pipe(
      tap(() => {
        const currentAssets = this.assetsSubject.value;
        const filteredAssets = currentAssets.filter(asset => !ids.includes(asset.assetId!));
        this.assetsSubject.next(filteredAssets);
        this.setLoading(false);
      }),
      map(() => void 0),
      catchError(error => this.handleError(error))
    );
  }

  bulkUpdateAssets(updates: { id: number; data: Partial<Asset> }[]): Observable<Asset[]> {
    this.setLoading(true);
    const updateRequests = updates.map(update => 
      this.http.put<Asset>(
        this.apiConfig.buildUrlWithId('assets', 'update', update.id), 
        update.data
      )
    );

    return forkJoin(updateRequests).pipe(
      map(responses => responses.map(response => this.apiConfig.extractItem(response) as Asset)),
      tap(updatedAssets => {
        const currentAssets = this.assetsSubject.value;
        updatedAssets.forEach((updatedAsset: Asset) => {
          const index = currentAssets.findIndex(a => a.assetId === updatedAsset.assetId);
          if (index !== -1) {
            currentAssets[index] = updatedAsset;
          }
        });
        this.assetsSubject.next([...currentAssets]);
        this.setLoading(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // ✅ NEW: Bulk Asset Creation for PO Workflow
  /**
   * ✅ IMPROVED: Bulk create assets with proper DTO and JSON array format
   * Sends a JSON array directly to the backend as expected
   */
  bulkCreateAssets(assets: AssetDTO[]): Observable<BulkAssetCreationResponse> {
    this.setLoading(true);
    this.clearError();

    // ✅ Ensure we're sending a clean JSON array with trimmed strings
    const cleanAssets = this.sanitizeAssetsForCreation(assets);
    
    // ✅ Debug logging - shows exactly what's being sent to backend
    console.group('🚀 Bulk Asset Creation Request');
    console.log('📊 Total assets to create:', cleanAssets.length);
    console.log('📋 Raw payload (JSON array format):', cleanAssets);
    console.log('🔍 First asset example:', cleanAssets[0]);
    console.log('📝 JSON stringified payload:', JSON.stringify(cleanAssets, null, 2));
    console.groupEnd();

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
          // ✅ Success logging
          console.group('✅ Bulk Asset Creation Response');
          console.log('🎉 Success count:', result.successCount);
          console.log('❌ Failed count:', result.failedAssets?.length || 0);
          console.log('📦 Created assets:', result.createdAssets);
          if (result.failedAssets?.length > 0) {
            console.warn('⚠️ Failed assets:', result.failedAssets);
          }
          console.groupEnd();

          // Add newly created assets to the current list
          if (result.createdAssets && result.createdAssets.length > 0) {
            const currentAssets = this.assetsSubject.value;
            this.assetsSubject.next([...result.createdAssets, ...currentAssets]);
          }
          this.setLoading(false);
        }),
        catchError(error => {
          console.group('❌ Bulk Asset Creation Error');
          console.error('💥 Error details:', error);
          console.error('📄 Error message:', error.message);
          console.error('🔍 Error response:', error.error);
          console.groupEnd();
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * ✅ ENHANCED: Sanitize and trim assets data for creation
   * - Removes null/undefined/empty values
   * - Trims all string fields to remove whitespace/tabs
   * - Ensures clean data format for backend
   */
  private sanitizeAssetsForCreation(assets: AssetDTO[]): AssetDTO[] {
    return assets.map((asset, index) => {
      const cleanedAsset: Partial<AssetDTO> = {};
      
      // Process each field with proper type handling
      Object.entries(asset).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          // ✅ Trim string fields to remove whitespace, tabs, etc.
          if (typeof value === 'string') {
            const trimmedValue = this.trimStringField(value);
            if (trimmedValue) { // Only include non-empty trimmed strings
              (cleanedAsset as any)[key] = trimmedValue;
            }
          } 
          // ✅ Keep numbers and booleans as-is
          else if (typeof value === 'number' || typeof value === 'boolean') {
            (cleanedAsset as any)[key] = value;
          }
        }
      });
      
      // ✅ Debug logging for each asset
      if (index === 0) { // Log first asset as example
        console.log(`🔧 Asset ${index + 1} sanitization:`, {
          original: asset,
          cleaned: cleanedAsset,
          trimmedFields: this.getStringFieldsCount(asset, cleanedAsset)
        });
      }
      
      return cleanedAsset as AssetDTO;
    });
  }

  /**
   * ✅ NEW: Comprehensive string trimming utility
   * Removes leading/trailing whitespace, tabs, newlines, etc.
   */
  private trimStringField(value: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }
    
    // Remove leading/trailing whitespace, tabs, newlines, carriage returns
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
   * ✅ NEW: Helper method for debugging string field processing
   */
  private getStringFieldsCount(original: AssetDTO, cleaned: Partial<AssetDTO>): any {
    const originalStrings = Object.entries(original).filter(([, value]) => typeof value === 'string').length;
    const cleanedStrings = Object.entries(cleaned).filter(([, value]) => typeof value === 'string').length;
    
    return {
      originalStringFields: originalStrings,
      cleanedStringFields: cleanedStrings,
      fieldsRemoved: originalStrings - cleanedStrings
    };
  }

  // ✅ NEW: Create assets linked to a specific PO using correct endpoint
  createAssetsByPO(poNumber: string, assets: AssetDTO[]): Observable<BulkAssetCreationResponse> {
    this.setLoading(true);
    this.clearError();

    // ✅ Sanitize assets for creation
    const cleanAssets = this.sanitizeAssetsForCreation(assets);
    
    // ✅ Prepare request body in correct format for PO-based creation
    const requestBody = {
      assets: cleanAssets
    };
    
    console.log(`🔧 POST /api/assets/by-po/${poNumber} - Request body:`, requestBody);
    console.log(`🔧 Total assets to create: ${cleanAssets.length}`);

    return this.http.post<any>(`/api/assets/by-po/${poNumber}`, requestBody)
      .pipe(
        map(response => {
          console.log(`🔧 POST /api/assets/by-po/${poNumber} - Response:`, response);
          
          // Handle different response formats
          if (response.data) {
            return response.data as BulkAssetCreationResponse;
          }
          return response as BulkAssetCreationResponse;
        }),
        tap(result => {
          console.log(`🔧 Success: Created ${result.successCount} assets for PO ${poNumber}`);
          
          // Add newly created assets to the current list
          if (result.createdAssets && result.createdAssets.length > 0) {
            const currentAssets = this.assetsSubject.value;
            this.assetsSubject.next([...result.createdAssets, ...currentAssets]);
          }
          this.setLoading(false);
        }),
        catchError(error => {
          console.error(`🔧 Error creating assets for PO ${poNumber}:`, error);
          console.error('🔧 Request body that failed:', requestBody);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  // ✅ NEW: Get all assets linked to a specific PO
  getAssetsByPO(poNumber: string): Observable<Asset[]> {
    return this.http.get<any>(`/api/assets/by-po/${poNumber}`)
      .pipe(
        map(response => {
          const data = Array.isArray(response) ? response : 
                      response.data ? response.data : 
                      response.content ? response.content : [];
          return data as Asset[];
        }),
        catchError(error => {
          console.error('Error loading assets by PO:', error);
          return of([]);
        })
      );
  }

  // ✅ FIXED: Update existing assets using correct bulk-update endpoint
  updateAllAssetsByPO(poNumber: string, assetUpdates: Partial<Asset>[]): Observable<Asset[]> {
    this.setLoading(true);
    this.clearError();

    // ✅ CORRECTED: Use proper bulk-update payload format (only assetId + fields to update)
    const requestBody: BulkAssetUpdateRequest = {
      assets: assetUpdates.map(asset => {
        // Validate assetId is present for updates
        if (!asset.assetId) {
          throw new Error(`Asset ID is required for bulk update. Asset: ${asset.name || 'Unknown'}`);
        }

        return {
          // ✅ REQUIRED: Asset ID for identifying which asset to update
          assetId: asset.assetId,
          
          // ✅ Core fields that can be updated
          name: asset.name || '',
          serialNumber: asset.serialNumber || '',
          status: asset.status || 'In Stock',
          
          // ✅ Optional identification fields
          itAssetCode: asset.itAssetCode || null,
          macAddress: asset.macAddress || null,
          ipv4Address: asset.ipv4Address || null,
          inventoryLocation: asset.inventoryLocation || null,
          tags: asset.tags || null,
          
          // ✅ Model and type fields
          modelId: asset.modelId || null,
          typeId: asset.typeId || null,
          makeId: asset.makeId || null,
          
          // ✅ Assignment fields
          currentUserId: asset.currentUserId || null,
          
          // ✅ OS fields
          osId: asset.osId || null,
          osVersionId: asset.osVersionId || null,
          
          // ✅ Business fields (acquisitionType, ownerType should not change in updates)
          acquisitionType: asset.acquisitionType || 'Bought',
          ownerType: asset.ownerType || 'Celcom',
          
          // ✅ Financial and date fields
          invoiceNumber: asset.invoiceNumber || null,
          acquisitionDate: asset.acquisitionDate || null,
          acquisitionPrice: asset.acquisitionPrice || null,
          rentalAmount: asset.rentalAmount || null,
          currentPrice: asset.currentPrice || null,
          depreciationPct: asset.depreciationPct || 0,
          minContractPeriod: asset.minContractPeriod || null,
          
          // ✅ Vendor and warranty fields
          vendorId: asset.vendorId || null,
          extendedWarrantyVendorId: asset.extendedWarrantyVendorId || null,
          warrantyExpiry: asset.warrantyExpiry || null,
          extendedWarrantyExpiry: asset.extendedWarrantyExpiry || null,
          leaseEndDate: asset.leaseEndDate || null,
          
          // ✅ NOTE: poNumber not included - it's handled by the backend logic
          // Backend will maintain PO association based on business rules
        } as Partial<Asset>;
      })
    };

    console.log(`🔧 PUT /api/assets/bulk-update - Request body:`, requestBody);
    console.log(`🔧 Total assets to update: ${requestBody.assets.length}`);
    console.log(`🔧 PO context: ${poNumber} (not sent in payload, but used for business logic)`);

    // ✅ CORRECTED: Use the proper bulk-update endpoint
    return this.http.put<BulkAssetUpdateResponse>(`/api/assets/bulk-update`, requestBody)
      .pipe(
        map(response => {
          console.log(`🔧 PUT /api/assets/bulk-update - Response:`, response);
          
          // Handle different response formats - prefer typed response first
          let updatedAssets: Asset[];
          
          if (response && response.updatedAssets) {
            // Proper typed response
            updatedAssets = response.updatedAssets;
            console.log(`🔧 Success: ${response.updatedCount} assets updated, ${response.failedAssets?.length || 0} failed`);
          } else {
            // Fallback for different response formats
          const data = Array.isArray(response) ? response : 
                        (response as any).data ? (response as any).data : 
                        (response as any).assets ? (response as any).assets :
                        (response as any).content ? (response as any).content : [];
            updatedAssets = data as Asset[];
          }
          
          console.log(`🔧 Extracted ${updatedAssets.length} updated assets from response`);
          return updatedAssets;
        }),
        tap(updatedAssets => {
          // Update the assets in the current list
          const currentAssets = this.assetsSubject.value;
          updatedAssets.forEach((updatedAsset: Asset) => {
            const index = currentAssets.findIndex(a => a.assetId === updatedAsset.assetId);
            if (index !== -1) {
              currentAssets[index] = updatedAsset;
              console.log(`🔧 Updated asset ${updatedAsset.assetId} in local cache`);
            }
          });
          this.assetsSubject.next([...currentAssets]);
          this.setLoading(false);
        }),
        catchError(error => {
          console.error(`🔧 Error updating assets via bulk-update:`, error);
          console.error('🔧 Request body that failed:', requestBody);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  // ✅ NEW: Delete all assets linked to a specific PO (soft delete)
  deleteAllAssetsByPO(poNumber: string): Observable<void> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<void>(`/api/assets/by-po/${poNumber}`)
      .pipe(
        tap(() => {
          // Remove deleted assets from the current list
          const currentAssets = this.assetsSubject.value;
          const filteredAssets = currentAssets.filter(asset => asset.poNumber !== poNumber);
          this.assetsSubject.next(filteredAssets);
          this.setLoading(false);
        }),
        catchError(error => {
          console.error('Error deleting assets by PO:', error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  // Utility Methods
  clearCache(): void {
    Object.keys(this.dropdownCache).forEach(key => {
      (this.dropdownCache as any)[key] = null;
    });
  }

  refreshData(): void {
    this.clearCache();
    this.getAllAssets().subscribe();
    this.getAssetSummary().subscribe();
  }

  // Export functionality
  exportAssets(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    const params = new HttpParams().set('format', format);
    return this.http.get(`/api/assets/export`, { 
      params, 
      responseType: 'blob' 
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Private helper methods
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.setLoading(false);
    
    let errorMessage: string = ASSET_MESSAGES.ERROR.SERVER;
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = ASSET_MESSAGES.ERROR.NETWORK;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = ASSET_MESSAGES.ERROR.VALIDATION;
          break;
        case 404:
          errorMessage = ASSET_MESSAGES.ERROR.NOT_FOUND;
          break;
        case 0:
          errorMessage = ASSET_MESSAGES.ERROR.BACKEND_RUNNING;
          break;
        default:
          errorMessage = error.error?.message || ASSET_MESSAGES.ERROR.SERVER;
      }
    }

    this.errorSubject.next(errorMessage);
    console.error('Asset Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  // Statistics and Dashboard Data
  getAssetStats(): Observable<AssetSummary> {
    return this.http.get<AssetSummary>(this.apiConfig.endpoints.assets.stats)
      .pipe(
        map(response => this.apiConfig.extractItem(response) as AssetSummary),
        catchError(error => {
          // Fallback to mock data if service unavailable
          const mockStats: AssetSummary = {
            totalAssets: this.assetsSubject.value.length,
            activeAssets: this.assetsSubject.value.filter(a => a.status === 'Active').length,
            brokenAssets: this.assetsSubject.value.filter(a => a.status === 'Broken').length,
            assignedAssets: this.assetsSubject.value.filter(a => a.currentUserId).length
          };
          return of(mockStats);
        })
      );
  }

  // Filters Management
  updateFilters(filters: AssetFilterOptions): void {
    this.filtersSubject.next(filters);
    this.currentFilters.set(filters);
    this.loadAssets();
  }

  getFilters(): AssetFilterOptions {
    return this.filtersSubject.value;
  }

  // Add missing loadAssets method
  loadAssets(): void {
    // This method should load assets based on current filters
    const currentFilters = this.currentFilters();
    this.getAllAssets(currentFilters).subscribe({
      next: (response) => {
        this.assetsSubject.next(response.content);
      },
      error: (error) => {
        console.error('Error loading assets:', error);
      }
    });
  }

  // ✅ NEW: Asset Status Change Methods with Audit Trail

  /**
   * Change asset status with automatic rules and audit trail
   * PUT /api/assets/{id}/status
   * 
   * ✅ Backend Integration: Sends PUT request as per user requirements
   * ✅ Payload: { status, remarks, changedBy }
   * ✅ Response: Updated asset with status history
   * ✅ Auto-creates record in asset_status_history table
   */
  changeAssetStatus(request: AssetStatusChangeRequest): Observable<AssetStatusChangeResponse> {
    this.setLoading(true);
    this.clearError();

    // ✅ ENHANCED DEBUG LOGGING AS REQUESTED
    console.log('🔄 Asset Service - changeAssetStatus called with request:', request);

    // ✅ Validate asset ID exists and is valid
    if (!request.assetId || request.assetId <= 0) {
      console.error('❌ Invalid asset ID:', request.assetId);
      return throwError(() => new Error('Invalid asset ID'));
    }

    // ✅ Validate status value matches dropdown options - ENHANCED DEBUG
    const validStatuses = Object.values(ASSET_STATUS);
    console.log('🔍 Service validation:');
    console.log('  - Valid statuses array:', validStatuses);
    console.log('  - Request newStatus:', JSON.stringify(request.newStatus));
    console.log('  - Status type check:', typeof request.newStatus);
    console.log('  - Status in valid array:', validStatuses.includes(request.newStatus as any));
    
    if (!validStatuses.includes(request.newStatus as any)) {
      console.error('❌ Invalid status validation failed');
      console.error('  - Provided status:', JSON.stringify(request.newStatus));
      console.error('  - Expected one of:', validStatuses);
      return throwError(() => new Error(`Invalid status: ${request.newStatus}. Expected one of: ${validStatuses.join(', ')}`));
    }

    const url = `/api/assets/${request.assetId}/status`;
    
    // ✅ Prepare payload with strict null handling for backend consistency
    const payload = {
      assetId: request.assetId,
      status: request.newStatus, // ✅ Send the API-safe uppercase value
      remarks: request.remarks || null, // Always null if empty/undefined
      changedById: request.changedById // Can be null if no user context
    };

    // ✅ HTTP headers configuration
    const httpOptions = {
      headers: {
        'Content-Type': 'application/json'
        // TODO: Add Authorization header when auth service is integrated
        // 'Authorization': `Bearer ${this.authService.getToken()}`
      }
    };

    // ✅ COMPREHENSIVE API CALL LOGGING
    console.log('🌐 Making API call:');
    console.log('  - URL:', url);
    console.log('  - Method: PUT');
    console.log('  - Payload:', JSON.stringify(payload, null, 2));
    console.log('  - Headers:', httpOptions.headers);
    console.log('  - Full request details:', {
      url,
      method: 'PUT',
      payload,
      assetId: request.assetId,
      headers: httpOptions.headers,
      timestamp: new Date().toISOString()
    });

    return this.http.put<any>(url, payload, httpOptions)
      .pipe(
        map(response => {
          console.log('✅ Raw API response received:', response);
          console.log('✅ Response type:', typeof response);
          console.log('✅ Response keys:', Object.keys(response));
          
          const data = response.data || response;
          console.log('✅ Processed response data:', data);
          
          const result = {
            asset: data.asset || data,
            statusHistory: data.statusHistory || [],
            message: data.message || 'Asset status updated successfully'
          } as AssetStatusChangeResponse;
          
          console.log('✅ Final mapped response:', result);
          return result;
        }),
        tap(response => {
          // ✅ Update the local asset cache immediately for better UX
          const currentAssets = this.assetsSubject.value;
          const index = currentAssets.findIndex(a => 
            a.assetId === response.asset.assetId
          );
          
          if (index !== -1) {
            // Update the asset with new status
            const updatedAsset = { ...currentAssets[index], ...response.asset };
            currentAssets[index] = updatedAsset;
            this.assetsSubject.next([...currentAssets]);
            console.log('🔄 Local cache updated for asset:', updatedAsset.name);
          }
          
          this.setLoading(false);
        }),
        catchError(error => {
          console.error('❌ Status update API error:');
          console.error('  - HTTP Status:', error.status);
          console.error('  - Status Text:', error.statusText);
          console.error('  - Error Message:', error.message);
          console.error('  - Response Body:', error.error);
          console.error('  - Full Error Object:', error);
          console.error('  - Request URL:', url);
          console.error('  - Request Payload:', JSON.stringify(payload));
          
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Get asset status history for audit trail
   * GET /api/asset-status-histories/asset/{assetId}/all
   */
  getAssetStatusHistory(assetId: number): Observable<AssetStatusHistoryDTO[]> {
    this.setLoading(true);
    this.clearError();

    const url = `/api/asset-status-histories/asset/${assetId}/all`;
    console.log('🔗 Making status history API call:', {
      url,
      method: 'GET',
      assetId,
      timestamp: new Date().toISOString()
    });

    return this.http.get<any>(url)
      .pipe(
        map(response => {
          console.log('📥 Raw API response:', response);
          console.log('📥 Response type:', typeof response);
          console.log('📥 Response is array:', Array.isArray(response));
          
          const data = response.data || response;
          console.log('📊 Extracted data:', data);
          console.log('📊 Data type:', typeof data);
          console.log('📊 Data is array:', Array.isArray(data));
          
          const result = Array.isArray(data) ? data : [];
          console.log('✅ Final result:', result);
          console.log('✅ Result length:', result.length);
          
          return result;
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('❌ Status history API error:', error);
          console.error('❌ Error status:', error.status);
          console.error('❌ Error message:', error.message);
          console.error('❌ Full error object:', error);
          console.error('❌ Request URL:', `/api/asset-status-histories/asset/${assetId}/all`);
          this.setLoading(false);
          
          // Don't return mock data - let the error propagate so we can debug API issues
          return throwError(() => error);
        })
      );
  }

  /**
   * Validate status change rules on frontend
   */
  validateStatusChange(newStatus: string, currentUserId?: number): { isValid: boolean; error?: string } {
    // Rule: Active status requires user assignment
    if (newStatus === 'Active' && !currentUserId) {
      return {
        isValid: false,
        error: 'Active status requires an employee to be assigned'
      };
    }

    return { isValid: true };
  }

  /**
   * Get automatic status based on user assignment/removal
   */
  getAutoStatusForUserChange(isAssigning: boolean, currentStatus: string): string | null {
    if (isAssigning) {
      // When assigning user, automatically set to Active
      return 'Active';
    } else {
      // When removing user, automatically set to In Stock (unless it's Broken/Ceased)
      const removesUserStatuses = ['Broken', 'Ceased'];
      if (!removesUserStatuses.includes(currentStatus)) {
        return 'In Stock';
      }
    }
    return null;
  }

  /**
   * Check if status requires user unassignment
   */
  shouldUnassignUser(newStatus: string): boolean {
    const removesUserStatuses = ['Broken', 'Ceased'];
    return removesUserStatuses.includes(newStatus);
  }

  /**
   * Check if status requires user assignment
   */
  requiresUserAssignment(status: string): boolean {
    const requiresUserStatuses = ['Active'];
    return requiresUserStatuses.includes(status);
  }

  // ✅ NEW: Assignment History Management
  
  /**
   * Get assignment history for a specific asset
   * GET /api/asset-assignment-history/asset/{assetId} (paginated)
   */
  getAssetAssignmentHistory(assetId: number, page = 0, size = 10, sortBy = 'assignedDate', sortDir = 'DESC'): Observable<AssetAssignmentHistoryResponse> {
    this.setLoading(true);
    this.clearError();

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    const url = `/api/asset-assignment-history/asset/${assetId}`;
    console.log('🔗 Making assignment history API call:', {
      url,
      method: 'GET',
      assetId,
      params: { page, size, sortBy, sortDir },
      timestamp: new Date().toISOString()
    });

    return this.http.get<any>(url, { params })
      .pipe(
        map(response => {
          console.log('📥 Raw assignment history response:', response);
          console.log('📥 Response type:', typeof response);
          
          // Handle different response formats from backend
          const data = response.data || response;
          console.log('📊 Extracted data:', data);
          
          // Build proper response structure
          const result: AssetAssignmentHistoryResponse = {
            content: data.content || data.history || data || [],
            history: data.history || data.content || data || [], // Legacy support
            totalElements: data.totalElements || data.total || (Array.isArray(data) ? data.length : 0),
            totalPages: data.totalPages || Math.ceil((data.totalElements || data.total || 0) / size),
            currentPage: data.currentPage || data.page || page,
            page: data.page || data.currentPage || page,
            size: data.size || size,
            message: data.message || 'Assignment history retrieved successfully'
          };
          
          console.log('✅ Final assignment history result:', result);
          console.log('✅ Content length:', result.content.length);
          
          return result;
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('❌ Assignment history API error:', error);
          console.error('❌ Error status:', error.status);
          console.error('❌ Error message:', error.message);
          console.error('❌ Full error object:', error);
          console.error('❌ Request URL:', `/api/asset-assignment-history/asset/${assetId}`);
          
          this.setLoading(false);
          
          // Don't return mock data - let the error propagate so we can debug API issues
          return throwError(() => error);
        })
      );
  }

  /**
   * Create new assignment history record
   */
  createAssignmentHistory(request: AssetAssignmentHistoryRequest): Observable<AssetUserAssignment> {
    const url = `/api/asset-assignment-history`;
    return this.http.post<AssetUserAssignment>(url, request)
      .pipe(
        catchError(error => {
          console.error('Error creating assignment history:', error);
          // Return mock success for development
          return of({
            id: Date.now(),
            assetId: request.assetId,
            userId: request.userId,
            assignedDate: request.assignedDate || new Date().toISOString(),
            remarks: request.remarks,
            isActive: true
          });
        })
      );
  }

  /**
   * Update assignment history record (for unassignment)
   */
  updateAssignmentHistory(id: number, request: AssetUnassignmentRequest): Observable<AssetUserAssignment> {
    const url = `/api/asset-assignment-history/${id}`;
    return this.http.put<AssetUserAssignment>(url, request)
      .pipe(
        catchError(error => {
          console.error('Error updating assignment history:', error);
          // Return mock success for development
          return of({
            id: id,
            assetId: request.assetId,
            userId: request.userId,
            assignedDate: new Date().toISOString(),
            unassignedDate: request.unassignedDate || new Date().toISOString(),
            remarks: request.remarks,
            isActive: false
          });
        })
      );
  }

  /**
   * Get current assignments for all assets
   */
  getCurrentAssignments(): Observable<AssetUserAssignment[]> {
    const url = `/api/asset-assignment-history/current`;
    return this.http.get<AssetUserAssignment[]>(url)
      .pipe(
        catchError(error => {
          console.error('Error fetching current assignments:', error);
          return of([]);
        })
      );
  }

  // ✅ NEW: Enhanced Status History Management

  /**
   * Create status history record
   */
  createStatusHistory(request: AssetStatusHistoryRequest): Observable<AssetStatusHistory> {
    const url = `/api/asset-status-histories`;
    return this.http.post<AssetStatusHistory>(url, request)
      .pipe(
        catchError(error => {
          console.error('Error creating status history:', error);
          // Return mock success for development
          return of({
            id: Date.now(),
            assetId: request.assetId,
            status: request.status,
            changedById: request.changedBy || 1,
            changeDate: request.changeDate || new Date().toISOString(),
            remarks: request.remarks
          });
        })
      );
  }

  /**
   * Get paginated status history for an asset
   */
  getAssetStatusHistoryPaginated(assetId: number, page = 0, size = 10, sortBy = 'changeDate', sortDir = 'DESC'): Observable<AssetStatusHistoryResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    const url = `/api/asset-status-histories/asset/${assetId}`;
    return this.http.get<AssetStatusHistoryResponse>(url, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching paginated status history:', error);
          // Return mock data for development
          const mockStatusHistory = [
            {
              id: 1,
              assetId: assetId,
              status: 'In Stock',
              changedById: 1,
              changedByName: 'System',
              changeDate: new Date().toISOString(),
              remarks: 'Asset created'
            }
          ];
          
          const mockResponse: AssetStatusHistoryResponse = {
            content: mockStatusHistory, // Paginated content array
            history: mockStatusHistory, // Legacy support
            totalElements: 1,
            totalPages: 1,
            currentPage: 0,
            pageNumber: 0,
            page: 0,
            size: 10,
            message: 'Status history retrieved (mock data)'
          };
          
          return of(mockResponse);
        })
      );
  }

  /**
   * Get all status history for an asset (non-paginated)
   */
  getAllAssetStatusHistory(assetId: number): Observable<AssetStatusHistory[]> {
    const url = `/api/asset-status-histories/asset/${assetId}/all`;
    return this.http.get<AssetStatusHistory[]>(url)
      .pipe(
        catchError(error => {
          console.error('Error fetching all status history:', error);
          // Return mock data for development
          return of([
            {
              id: 1,
              assetId: assetId,
              status: 'In Stock',
              changedById: 1,
              changedByName: 'System',
              changeDate: new Date().toISOString(),
              remarks: 'Asset created'
            }
          ]);
        })
      );
  }

  /**
   * Get all assignment history for an asset (non-paginated)
   * GET /api/asset-assignment-history/asset/{assetId}/all
   */
  getAllAssetAssignmentHistory(assetId: number): Observable<AssetUserAssignment[]> {
    const url = `/api/asset-assignment-history/asset/${assetId}/all`;
    console.log('🔗 Making all assignment history API call:', {
      url,
      method: 'GET',
      assetId,
      timestamp: new Date().toISOString()
    });

    return this.http.get<any>(url)
      .pipe(
        map(response => {
          console.log('📥 Raw all assignment history response:', response);
          console.log('📥 Response type:', typeof response);
          console.log('📥 Response is array:', Array.isArray(response));
          
          const data = response.data || response;
          console.log('📊 Extracted data:', data);
          console.log('📊 Data type:', typeof data);
          console.log('📊 Data is array:', Array.isArray(data));
          
          const result = Array.isArray(data) ? data : [];
          console.log('✅ Final result:', result);
          console.log('✅ Result length:', result.length);
          
          return result;
        }),
        catchError(error => {
          console.error('❌ All assignment history API error:', error);
          console.error('❌ Error status:', error.status);
          console.error('❌ Error message:', error.message);
          console.error('❌ Full error object:', error);
          console.error('❌ Request URL:', `/api/asset-assignment-history/asset/${assetId}/all`);
          
          // Don't return mock data - let the error propagate so we can debug API issues
          return throwError(() => error);
        })
      );
  }

  // ✅ NEW: Combined operations for status changes with unassignment

  /**
   * Change status with automatic user unassignment if needed
   */
  changeStatusWithUnassignment(assetId: number, newStatus: string, currentUserId?: number, remarks?: string): Observable<{ asset: Asset; statusHistory: AssetStatusHistory; assignmentHistory?: AssetUserAssignment }> {
    const currentUser = this.getCurrentUserId();
    
    // Step 1: If user is assigned and status change requires unassignment
    if (currentUserId && this.shouldUnassignUser(newStatus)) {
      // Create unassignment request
      const unassignmentRequest: AssetUnassignmentRequest = {
        assetId: assetId,
        userId: currentUserId,
        unassignedDate: new Date().toISOString(),
        remarks: `Unassigned due to status change to ${newStatus}`
      };

      // Step 2: Change status
      const statusRequest: AssetStatusChangeRequest = {
        assetId: assetId,
        newStatus: newStatus,
        changedById: currentUser,
        remarks: remarks,
        currentUserId: currentUserId
      };

      // Execute both operations
      return forkJoin({
        statusChange: this.changeAssetStatus(statusRequest),
        unassignment: this.updateAssignmentHistory(currentUserId, unassignmentRequest)
      }).pipe(
        map(results => ({
          asset: results.statusChange.asset,
          statusHistory: results.statusChange.statusHistory[0],
          assignmentHistory: results.unassignment
        }))
      );
    } else {
      // Just change status
      const statusRequest: AssetStatusChangeRequest = {
        assetId: assetId,
        newStatus: newStatus,
        changedById: currentUser,
        remarks: remarks,
        currentUserId: currentUserId
      };

      return this.changeAssetStatus(statusRequest).pipe(
        map(response => ({
          asset: response.asset,
          statusHistory: response.statusHistory[0]
        }))
      );
    }
  }

  private getCurrentUserId(): number | null {
    // Mock implementation - replace with actual auth service
    return 1;
  }

  // NEW: Advanced filtering with comprehensive backend support
  filterAssetsAdvanced(filterRequest: AssetFilterRequest): Observable<PageResponse<Asset>> {
    this.setLoading(true);
    this.clearError();

    const endpoint = `${this.apiConfig.endpoints.assets.getAll}/filter`;
    
    console.log('🔍 Advanced filter request:', {
      endpoint,
      filters: filterRequest
    });

    return this.http.post<any>(endpoint, filterRequest)
      .pipe(
        map(response => this.processFilterResponse(response)),
        tap(response => {
          this.assetsSubject.next(response.content);
          this.setLoading(false);
        }),
        catchError(error => this.handleError(error))
      );
  }

  // NEW: Get filter metadata and statistics
  getFilterMetadata(filterRequest?: AssetFilterRequest): Observable<FilterMetadata> {
    const endpoint = `${this.apiConfig.endpoints.assets.getAll}/filter/metadata`;
    
    return this.http.post<FilterMetadata>(endpoint, filterRequest || {})
      .pipe(
        catchError(error => {
          console.error('Error getting filter metadata:', error);
          return of({
            totalElements: 0,
            totalPages: 0,
            currentPage: 0,
            pageSize: 10,
            hasNext: false,
            hasPrevious: false,
            appliedFilters: filterRequest || {}
          } as FilterMetadata);
        })
      );
  }

  // NEW: Process different backend response formats
  private processFilterResponse(response: any): PageResponse<Asset> {
    if (response.content && Array.isArray(response.content)) {
      return {
        content: response.content as Asset[],
        page: response.page?.number || response.page || 0,
        size: response.page?.size || response.size || 10,
        totalElements: response.page?.totalElements || response.totalElements || 0,
        totalPages: response.page?.totalPages || response.totalPages || 0,
        first: response.page?.first || response.first || false,
        last: response.page?.last || response.last || false
      } as PageResponse<Asset>;
    }
    
    // Fallback for empty response
    return {
      content: [],
      page: 0,
      size: 0,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true
    } as PageResponse<Asset>;
  }

} 