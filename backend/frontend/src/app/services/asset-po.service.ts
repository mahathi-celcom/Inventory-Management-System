import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AssetPo, AssetPoWithDetails, AssetPoFilter, LegacyVendor, AssetPoCascadeUpdateResponse, AssetPoSimpleCascadeResponse, AssetPoMigrationResponse } from '../models/asset-po.model';
import { Vendor } from '../models/vendor.model';
import { ApiConfigService } from './api-config.service';
import { VendorService } from './vendor.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class AssetPoService {

  // Mock data for testing
  private mockAssetPos: AssetPo[] = [
    {
      poId: 1,
      acquisitionType: 'BOUGHT',
      poNumber: 'PO-2024-001',
      invoiceNumber: 'INV-001-2024',
      acquisitionDate: '2024-01-15',
      vendorId: 1,
      ownerType: 'Celcom',
      acquisitionPrice: 50000.00,
      depreciationPct: 20.0,
      currentPrice: 40000.00,
      totalDevices: 10
    },
    {
      poId: 2,
      acquisitionType: 'RENTED',
      poNumber: 'PO-2024-002',
      invoiceNumber: 'INV-002-2024',
      acquisitionDate: '2024-02-01',
      vendorId: 2,
      ownerType: 'Vendor',
      leaseEndDate: '2025-02-01',
      rentalAmount: 5000.00,
      minContractPeriod: 12,
      acquisitionPrice: 30000.00,
      depreciationPct: 0.0,
      currentPrice: 30000.00,
      totalDevices: 5
    },
    {
      poId: 3,
      acquisitionType: 'RENTED',
      poNumber: 'PO-2024-003',
      invoiceNumber: 'INV-003-2024',
      acquisitionDate: '2024-03-01',
      vendorId: 3,
      ownerType: 'Vendor',
      leaseEndDate: '2024-12-31',
      rentalAmount: 2500.00,
      minContractPeriod: 6,
      acquisitionPrice: 15000.00,
      depreciationPct: 0.0,
      currentPrice: 15000.00,
      totalDevices: 3
    }
  ];

  // Mock vendor data (legacy format)
  private mockVendors: LegacyVendor[] = [
    { id: 1, name: 'Apple Inc.', status: 'Active' },
    { id: 2, name: 'Dell Technologies', status: 'Active' },
    { id: 3, name: 'HP Inc.', status: 'Active' },
    { id: 4, name: 'Lenovo Group', status: 'Active' },
    { id: 5, name: 'Microsoft Corporation', status: 'Active' }
  ];

  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService,
    private vendorService: VendorService,
    private snackBar: MatSnackBar
  ) {}

  getAllAssetPos(): Observable<AssetPo[]> {
    return this.http.get<any>('/api/asset-pos')
      .pipe(
        tap(response => this.apiConfig.logResponse('asset-pos/getAll', response)),
        map(response => {
          const extractedData = this.apiConfig.extractData<any>(response);
          
          // Map API response to our AssetPo interface with proper ID handling
          const mappedPos = extractedData.map((item: any) => {
            // Handle different possible ID field names from backend
            const poId = item.poId || item.id || item.assetPoId;
            
            if (!poId) {
              console.warn('⚠️ Asset PO item missing ID:', item);
            }

            return {
              poId: poId,
              acquisitionType: item.acquisitionType,
              poNumber: item.poNumber,
              invoiceNumber: item.invoiceNumber,
              acquisitionDate: item.acquisitionDate,
              vendorId: item.vendorId,
              ownerType: item.ownerType,
              leaseEndDate: item.leaseEndDate,
              rentalAmount: item.rentalAmount,
              minContractPeriod: item.minContractPeriod,
              acquisitionPrice: item.acquisitionPrice,
              depreciationPct: item.depreciationPct,
              currentPrice: item.currentPrice,
              totalDevices: item.totalDevices
            } as AssetPo;
          });

          console.log('📦 Mapped Asset POs:', mappedPos.length, 'items');
          return mappedPos;
        }),
        catchError((error) => {
          console.error('Failed to load asset POs from backend:', error);
          throw error; // Re-throw error instead of using mock data
        })
      );
  }

  getAllAssetPosWithDetails(): Observable<AssetPoWithDetails[]> {
    return forkJoin({
      pos: this.getAllAssetPos(),
      vendors: this.vendorService.getAllVendors()
    }).pipe(
      map(({ pos, vendors }) => {
        return pos.map(po => {
          const vendor = vendors.find(v => v.vendorId === po.vendorId);
          
          return {
            ...po,
            name: vendor?.name
          } as AssetPoWithDetails;
        });
      })
    );
  }

  getAssetPo(id: number): Observable<AssetPo> {
    return this.http.get<any>(`/api/asset-pos/${id}`)
      .pipe(
        tap(response => this.apiConfig.logResponse('asset-pos/get', response)),
        map(response => this.apiConfig.extractItem<AssetPo>(response)),
        catchError((error) => {
          console.error('Failed to get asset PO from backend:', error);
          const mockPo = this.mockAssetPos.find(po => po.poId === id);
          if (mockPo) {
            return of(mockPo);
          }
          throw error;
        })
      );
  }

  createAssetPo(assetPo: Omit<AssetPo, 'poId'>): Observable<AssetPo> {
    console.log('Creating asset PO:', assetPo);
    
    // Clean up the data before sending
    const cleanedData = {
      ...assetPo,
      // Ensure numbers are properly typed
      vendorId: Number(assetPo.vendorId),
      acquisitionPrice: Number(assetPo.acquisitionPrice),
      depreciationPct: Number(assetPo.depreciationPct),
      currentPrice: Number(assetPo.currentPrice),
      totalDevices: Number(assetPo.totalDevices),
      // Handle lease fields based on acquisition type
      leaseEndDate: assetPo.acquisitionType === 'BOUGHT' ? null : assetPo.leaseEndDate,
      rentalAmount: assetPo.acquisitionType === 'BOUGHT' ? null : (assetPo.rentalAmount ? Number(assetPo.rentalAmount) : null),
      minContractPeriod: assetPo.acquisitionType === 'BOUGHT' ? null : (assetPo.minContractPeriod ? Number(assetPo.minContractPeriod) : null)
    };

    return this.http.post<any>('/api/asset-pos', cleanedData)
      .pipe(
        tap(response => this.apiConfig.logResponse('asset-pos/create', response)),
        map(response => this.apiConfig.extractItem<AssetPo>(response)),
        catchError((error) => {
          console.error('Failed to create asset PO via API:', error);
          // Re-throw the error instead of using mock data for production
          throw error;
        })
      );
  }

  updateAssetPo(id: number, assetPo: Partial<AssetPo>): Observable<AssetPo> {
    // Validate ID before proceeding
    if (id === undefined || id === null || !Number.isInteger(id) || id <= 0) {
      const errorMsg = `Invalid Asset PO ID for UPDATE: ${id} (type: ${typeof id})`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log('Updating asset PO:', id, assetPo);
    
    // Clean up the data before sending
    const cleanedData = {
      ...assetPo,
      // Ensure numbers are properly typed
      vendorId: assetPo.vendorId ? Number(assetPo.vendorId) : undefined,
      acquisitionPrice: assetPo.acquisitionPrice ? Number(assetPo.acquisitionPrice) : undefined,
      depreciationPct: assetPo.depreciationPct !== undefined ? Number(assetPo.depreciationPct) : undefined,
      currentPrice: assetPo.currentPrice ? Number(assetPo.currentPrice) : undefined,
      totalDevices: assetPo.totalDevices ? Number(assetPo.totalDevices) : undefined,
      // Handle lease fields based on acquisition type
      leaseEndDate: assetPo.acquisitionType === 'BOUGHT' ? null : assetPo.leaseEndDate,
      rentalAmount: assetPo.acquisitionType === 'BOUGHT' ? null : (assetPo.rentalAmount ? Number(assetPo.rentalAmount) : null),
      minContractPeriod: assetPo.acquisitionType === 'BOUGHT' ? null : (assetPo.minContractPeriod ? Number(assetPo.minContractPeriod) : null)
    };

    const url = `/api/asset-pos/${id}`;
    console.log(`📝 UPDATE URL: ${url}`);

    return this.http.put<any>(url, cleanedData)
      .pipe(
        tap(response => this.apiConfig.logResponse('asset-pos/update', response)),
        map(response => {
          const responseData = this.apiConfig.extractItem<any>(response);
          
          // Ensure proper ID mapping in response
          const mappedResponse = {
            ...responseData,
            poId: responseData.poId || responseData.id || responseData.assetPoId
          } as AssetPo;
          
          return mappedResponse;
        }),
        catchError((error) => {
          console.error('Failed to update asset PO via API:', error);
          throw error;
        })
      );
  }

  // ✅ NEW: Smart cascade update with PO number classification logic
  updateAssetPoWithCascade(id: number, assetPo: Partial<AssetPo>, originalPoNumber?: string): Observable<AssetPoCascadeUpdateResponse> {
    // Validate ID before proceeding
    if (id === undefined || id === null || !Number.isInteger(id) || id <= 0) {
      const errorMsg = `Invalid Asset PO ID for CASCADE UPDATE: ${id} (type: ${typeof id})`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log(`🔄 Smart cascade updating Asset PO ${id} and linked assets:`, assetPo);
    console.log(`🔄 Original PO Number: "${originalPoNumber}", New PO Number: "${assetPo.poNumber}"`);
    
    // ✅ NEW: Classification logic for endpoint selection
    const endpoint = this.selectUpdateEndpoint(originalPoNumber, assetPo.poNumber);
    console.log(`🎯 Selected endpoint: ${endpoint.url} (${endpoint.type})`);
    
    // Clean up the data before sending
    const cleanedData = {
      ...assetPo,
      // Ensure numbers are properly typed
      vendorId: assetPo.vendorId ? Number(assetPo.vendorId) : undefined,
      acquisitionPrice: assetPo.acquisitionPrice ? Number(assetPo.acquisitionPrice) : undefined,
      depreciationPct: assetPo.depreciationPct !== undefined ? Number(assetPo.depreciationPct) : undefined,
      currentPrice: assetPo.currentPrice ? Number(assetPo.currentPrice) : undefined,
      totalDevices: assetPo.totalDevices ? Number(assetPo.totalDevices) : undefined,
      // Handle lease fields based on acquisition type
      leaseEndDate: assetPo.acquisitionType === 'BOUGHT' ? null : assetPo.leaseEndDate,
      rentalAmount: assetPo.acquisitionType === 'BOUGHT' ? null : (assetPo.rentalAmount ? Number(assetPo.rentalAmount) : null),
      minContractPeriod: assetPo.acquisitionType === 'BOUGHT' ? null : (assetPo.minContractPeriod ? Number(assetPo.minContractPeriod) : null)
    };

    const url = `/api/asset-pos/${id}${endpoint.path}`;
    console.log(`🔄 SMART UPDATE URL: ${url}`);
    console.log(`🔄 Update Type: ${endpoint.type}`);
    console.log(`🔄 Payload:`, cleanedData);

    return this.http.put<AssetPoCascadeUpdateResponse>(url, cleanedData)
      .pipe(
        tap(response => {
          console.log(`🔄 Smart cascade update response (${endpoint.type}):`, response);
          this.apiConfig.logResponse(`asset-pos/${endpoint.type}`, response);
        }),
        map(response => {
          // Ensure proper response format and add endpoint info to message
          let enhancedMessage = response.message || 'Update completed successfully';
          
          if (endpoint.type === 'safe-pk-update') {
            enhancedMessage = `${enhancedMessage} (Safe PK Update used due to PO number change)`;
          } else if (endpoint.type === 'cascade-fallback') {
            enhancedMessage = `${enhancedMessage} (⚠️ Used cascade fallback - PO number change detected)`;
          }
            
          return {
            assetPO: response.assetPO,
            linkedAssetsUpdated: response.linkedAssetsUpdated || 0,
            message: enhancedMessage
          } as AssetPoCascadeUpdateResponse;
        }),
        catchError((error) => {
          console.error(`❌ Failed to smart cascade update Asset PO ${id} using ${endpoint.type}:`, error);
          throw error;
        })
      );
  }

  // ✅ NEW: Classification logic for endpoint selection with fallback
  private selectUpdateEndpoint(originalPoNumber?: string, newPoNumber?: string): { path: string; url: string; type: string } {
    // Handle edge cases
    const originalPo = this.normalizePoNumber(originalPoNumber);
    const newPo = this.normalizePoNumber(newPoNumber);
    
    console.log(`🎯 PO Classification - Original: "${originalPo}", New: "${newPo}"`);
    
    // Scenario 1: PO number unchanged (or both empty/null)
    if (originalPo === newPo) {
      console.log(`✅ PO numbers match - using standard cascade endpoint`);
      return {
        path: '/cascade',
        url: 'cascade',
        type: 'cascade'
      };
    }
    
    // Scenario 2: PO number changed - TEMPORARY: Use cascade endpoint until backend implements safe-pk-update
    console.log(`⚠️ PO number changed - FALLBACK: using cascade endpoint (safe-pk-update not implemented yet)`);
    console.warn(`🚧 BACKEND TODO: Implement POST /api/asset-pos/{id}/safe-pk-update endpoint for PK changes`);
    
    return {
      path: '/cascade',  // ✅ FALLBACK: Use existing endpoint
      url: 'cascade',
      type: 'cascade-fallback'  // ✅ Mark as fallback for proper messaging
    };
    
    // ✅ FUTURE: Uncomment when backend implements safe-pk-update endpoint
    /* 
    return {
      path: '/safe-pk-update',
      url: 'safe-pk-update', 
      type: 'safe-pk-update'
    };
    */
  }

  // ✅ NEW: Normalize PO numbers for comparison
  private normalizePoNumber(poNumber?: string): string {
    if (!poNumber || poNumber.trim() === '') {
      return '';
    }
    return poNumber.trim().toUpperCase();
  }

  // ✅ NEW: Test proxy configuration and backend connectivity
  testBackendConnectivity(): Observable<any> {
    console.log(`🧪 Testing backend connectivity and proxy configuration...`);
    console.log(`🔗 Request will go to: /api/asset-pos (should proxy to localhost:8080)`);
    
    return this.http.get<any>('/api/asset-pos')
      .pipe(
        tap(response => {
          console.log(`✅ Backend connectivity test successful:`, response);
          console.log(`✅ Proxy is working correctly - requests are reaching backend`);
        }),
        catchError((error) => {
          console.error(`❌ Backend connectivity test failed:`, error);
          
          if (error.status === 0) {
            console.error(`🔌 Connection refused - Backend server may not be running on localhost:8080`);
          } else if (error.status === 404) {
            console.error(`🔍 404 Not Found - Endpoint /api/asset-pos doesn't exist on backend`);
          } else if (error.url?.includes('localhost:4200')) {
            console.error(`🚫 Proxy not working - Request hit Angular dev server instead of backend`);
            console.error(`💡 Solution: Make sure you're running 'ng serve' with proxy config`);
          }
          
          throw error;
        })
      );
  }

  deleteAssetPo(id: number): Observable<void> {
    // Validate ID before proceeding
    if (id === undefined || id === null || !Number.isInteger(id) || id <= 0) {
      const errorMsg = `Invalid Asset PO ID for DELETE: ${id} (type: ${typeof id})`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const url = `/api/asset-pos/${id}`;
    console.log(`🗑️ DELETE URL: ${url}`);

    return this.http.delete(url, { 
      responseType: 'text' as 'json' // Handle 204 No Content properly
    })
      .pipe(
        map(() => void 0), // Convert any response to void
        tap(() => console.log('Asset PO deleted successfully')),
        catchError((error) => {
          console.error('Failed to delete asset PO via API:', error);
          throw error; // Re-throw error instead of using mock fallback
        })
      );
  }

  searchAssetPos(filter: AssetPoFilter): Observable<AssetPo[]> {
    return this.http.get<any>('/api/asset-pos/search', { params: filter as any })
      .pipe(
        tap(response => this.apiConfig.logResponse('asset-pos/search', response)),
        map(response => this.apiConfig.extractData<AssetPo>(response)),
        catchError((error) => {
          console.error('Failed to search asset POs from backend:', error);
          let filteredPos = [...this.mockAssetPos];
          
          if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            filteredPos = filteredPos.filter(po => 
              po.poNumber.toLowerCase().includes(searchLower) ||
              po.invoiceNumber.toLowerCase().includes(searchLower)
            );
          }
          
          if (filter.acquisitionType) {
            filteredPos = filteredPos.filter(po => po.acquisitionType === filter.acquisitionType);
          }
          
          if (filter.ownerType) {
            filteredPos = filteredPos.filter(po => po.ownerType === filter.ownerType);
          }
          
          if (filter.vendorId) {
            filteredPos = filteredPos.filter(po => po.vendorId === filter.vendorId);
          }
          
          return of(filteredPos);
        })
      );
  }

  getLeaseExpiringPos(daysAhead: number = 30): Observable<AssetPo[]> {
    return this.http.get<any>(`/api/asset-pos/leases/expiring?days=${daysAhead}`)
      .pipe(
        tap(response => this.apiConfig.logResponse('asset-pos/leases/expiring', response)),
        map(response => this.apiConfig.extractData<AssetPo>(response)),
        catchError((error) => {
          console.error('Failed to get expiring leases from backend:', error);
          const now = new Date();
          const targetDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
          
          const expiringPos = this.mockAssetPos.filter(po => {
            if (po.leaseEndDate && po.acquisitionType === 'RENTED') {
              const leaseEndDate = new Date(po.leaseEndDate);
              return leaseEndDate <= targetDate && leaseEndDate >= now;
            }
            return false;
          });
          
          return of(expiringPos);
        })
      );
  }

  getAllVendors(): Observable<Vendor[]> {
    return this.vendorService.getAllVendors();
  }

  /**
   * Updates only the PO number in a cascade operation
   * Uses the new simple-cascade endpoint that handles the update safely
   */
  updateCascadePo(poId: number, newPoNumber: string): Observable<AssetPoSimpleCascadeResponse> {
    const url = `/api/asset-pos/${poId}/simple-cascade`;
    const payload = { poNumber: newPoNumber };
    
    return this.http.put<AssetPoSimpleCascadeResponse>(url, payload).pipe(
      tap(response => {
        console.log(`✅ Cascade PO update successful:`, response);
        this.showSuccessToast(`PO updated successfully. ${response.affectedAssets} assets affected.`);
      }),
      catchError(error => {
        console.error('❌ Cascade PO update failed:', error);
        this.showErrorToast(error.error?.message || 'Failed to update PO number');
        return throwError(() => error);
      })
    );
  }

  /**
   * Migrates PO number from old to new value using the new transactional backend flow
   * Backend now handles all validation and constraint management properly
   */
  migratePoNumber(oldPoNumber: string, newPoNumber: string): Observable<AssetPoMigrationResponse> {
    const url = `/api/asset-pos/migrate-po-number`;
    const payload = { 
      oldPoNumber: oldPoNumber.trim(),
      newPoNumber: newPoNumber.trim()
    };
    
    console.log(`🔄 Migrating PO number: ${oldPoNumber} → ${newPoNumber}`);
    console.log('📦 Sending payload:', payload);
    
    return this.http.post<AssetPoMigrationResponse>(url, payload).pipe(
      tap(response => {
        console.log(`✅ PO migration successful:`, response);
        const message = `PO migrated! ${response.assetsUpdated} assets updated.`;
        this.showSuccessToast(message);
      }),
      catchError(error => {
        console.error('❌ PO migration failed:', error);
        const errorMessage = error.error?.message || 'Migration failed. Please try again.';
        this.showErrorToast(`Migration failed: ${errorMessage}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Shows a success toast message
   */
  private showSuccessToast(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-toast']
    });
  }

  /**
   * Shows an error toast message
   */
  private showErrorToast(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  // ✅ NEW: Get PO summary with total/linked/remaining assets
  getSummaryByPO(poNumber: string): Observable<{
    totalDevices: number;
    linkedAssets: number;
    remainingAssets: number;
    assets: any[];
  }> {
    return this.http.get<any>(`/api/asset-pos/${poNumber}/summary`)
      .pipe(
        tap(response => this.apiConfig.logResponse('asset-pos/summary', response)),
        map(response => this.apiConfig.extractItem(response) as {
          totalDevices: number;
          linkedAssets: number;
          remainingAssets: number;
          assets: any[];
        }),
        catchError((error) => {
          console.error('Failed to get PO summary:', error);
          throw error;
        })
      );
  }

  // ✅ ENHANCED: Pre-check for deletion conflicts (optional for better UX)
  checkDeletionConflicts(poNumber: string): Observable<{
    canDelete: boolean;
    conflictData?: any;
  }> {
    const url = `/api/asset-pos/${poNumber}/deletion-conflicts`;
    console.log(`🔍 Pre-checking deletion conflicts for PO: ${poNumber}`);
    
    return this.http.get<any>(url).pipe(
      map(response => {
        console.log(`✅ No conflicts found for PO ${poNumber} - safe to delete`);
        return {
          canDelete: true,
          conflictData: null
        };
      }),
      catchError(error => {
        if (error.status === 409) {
          console.log(`⚠️ Deletion conflicts found for PO ${poNumber}:`, error.error);
          return of({
            canDelete: false,
            conflictData: error.error
          });
        }
        console.error(`❌ Error checking deletion conflicts:`, error);
        throw error;
      })
    );
  }

  // ✅ ENHANCED: Delete PO with proper 409 conflict handling
  deletePOWithCascade(poNumber: string): Observable<{
    success: boolean;
    deletedPO?: boolean;
    deletedAssets?: number;
    message?: string;
    conflictData?: any;
  }> {
    const url = `/api/asset-pos/${poNumber}/cascade`;
    console.log(`🗑️ Attempting cascade delete for PO: ${poNumber}`);
    
    return this.http.delete<any>(url).pipe(
      map(response => {
        console.log(`✅ Cascade delete successful:`, response);
        this.showSuccessToast(`PO ${poNumber} and linked assets deleted successfully`);
        return {
          success: true,
          deletedPO: response.deletedPO || true,
          deletedAssets: response.deletedAssets || 0,
          message: response.message || 'PO and assets deleted successfully'
        };
      }),
      catchError(error => {
        if (error.status === 409) {
          console.log(`⚠️ Deletion blocked due to conflicts:`, error.error);
          return of({
            success: false,
            conflictData: error.error
          });
        }
        console.error(`❌ Error during cascade delete:`, error);
        this.showErrorToast('Failed to delete PO. Please try again.');
        throw error;
      })
    );
  }

  // ✅ NEW: Delete individual asset
  deleteAsset(assetId: number): Observable<void> {
    return this.http.delete<void>(`/api/asset-pos/assets/${assetId}`)
      .pipe(
        tap(() => console.log(`Asset ${assetId} deleted successfully`)),
        catchError((error) => {
          console.error('Failed to delete asset:', error);
          throw error;
        })
      );
  }
} 