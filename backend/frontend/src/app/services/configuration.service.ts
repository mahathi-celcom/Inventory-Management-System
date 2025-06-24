import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface SystemConfiguration {
  assetStatuses: StatusOption[];
  ownerTypes: OwnerTypeOption[];
  acquisitionTypes: AcquisitionTypeOption[];
  assetConfig: AssetConfigSettings;
  defaultValues: DefaultValues;
}

export interface StatusOption {
  code: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  color?: string;
  textColor?: string;
  cssClass?: string;
}

export interface OwnerTypeOption {
  code: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface AcquisitionTypeOption {
  code: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface AssetConfigSettings {
  pageSize: number;
  minNameLength: number;
  minSerialLength: number;
  itemSize: number;
}

export interface DefaultValues {
  defaultStatus: string;
  defaultOwnerType: string;
  defaultAcquisitionType: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private http = inject(HttpClient);
  
  // Cache the configuration to avoid multiple API calls
  private configurationSubject = new BehaviorSubject<SystemConfiguration | null>(null);
  public configuration$ = this.configurationSubject.asObservable();
  
  private isLoading = false;

  constructor() {
    // Load configuration on service initialization
    this.loadConfiguration();
  }

  /**
   * Load system configuration from the database
   */
  loadConfiguration(): Observable<SystemConfiguration> {
    if (this.isLoading) {
      return this.configuration$.pipe(
        map(config => config || this.getFallbackConfiguration())
      );
    }

    this.isLoading = true;

    return this.http.get<SystemConfiguration>('/api/system/configuration')
      .pipe(
        map(config => {
          this.configurationSubject.next(config);
          this.isLoading = false;
          return config;
        }),
        catchError(error => {
          console.warn('Failed to load system configuration from database, using fallback:', error);
          const fallbackConfig = this.getFallbackConfiguration();
          this.configurationSubject.next(fallbackConfig);
          this.isLoading = false;
          return of(fallbackConfig);
        })
      );
  }

  /**
   * Get current configuration (cached)
   */
  getCurrentConfiguration(): SystemConfiguration {
    return this.configurationSubject.value || this.getFallbackConfiguration();
  }

  /**
   * Get asset statuses
   */
  getAssetStatuses(): StatusOption[] {
    const config = this.getCurrentConfiguration();
    return config.assetStatuses.filter(status => status.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /**
   * Get asset statuses for filtering (includes "All" option)
   */
  getAssetStatusesForFilter(): StatusOption[] {
    const statuses = this.getAssetStatuses();
    return [
      { code: 'ALL', name: 'All', displayOrder: 0, isActive: true },
      ...statuses
    ];
  }

  /**
   * Get owner types
   */
  getOwnerTypes(): OwnerTypeOption[] {
    const config = this.getCurrentConfiguration();
    return config.ownerTypes.filter(type => type.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /**
   * Get owner types for filtering (includes "All" option)
   */
  getOwnerTypesForFilter(): OwnerTypeOption[] {
    const types = this.getOwnerTypes();
    return [
      { code: 'ALL', name: 'All', displayOrder: 0, isActive: true },
      ...types
    ];
  }

  /**
   * Get acquisition types
   */
  getAcquisitionTypes(): AcquisitionTypeOption[] {
    const config = this.getCurrentConfiguration();
    return config.acquisitionTypes.filter(type => type.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /**
   * Get acquisition types for filtering (includes "All" option)
   */
  getAcquisitionTypesForFilter(): AcquisitionTypeOption[] {
    const types = this.getAcquisitionTypes();
    return [
      { code: 'ALL', name: 'All', displayOrder: 0, isActive: true },
      ...types
    ];
  }

  /**
   * Get asset configuration settings
   */
  getAssetConfig(): AssetConfigSettings {
    const config = this.getCurrentConfiguration();
    return config.assetConfig;
  }

  /**
   * Get default values
   */
  getDefaultValues(): DefaultValues {
    const config = this.getCurrentConfiguration();
    return config.defaultValues;
  }

  /**
   * Get status styling information
   */
  getStatusStyling(statusCode: string): { cssClass: string; textColor: string } {
    const status = this.getAssetStatuses().find(s => s.code === statusCode);
    return {
      cssClass: status?.cssClass || 'status-badge-inactive',
      textColor: status?.textColor || 'text-celcom-danger'
    };
  }

  /**
   * Check if status is active
   */
  isStatusActive(statusCode: string): boolean {
    const status = this.getAssetStatuses().find(s => s.code === statusCode);
    return status?.code === this.getDefaultValues().defaultStatus;
  }

  /**
   * Fallback configuration when API is not available
   */
  private getFallbackConfiguration(): SystemConfiguration {
    return {
      assetStatuses: [
        { code: 'IN_STOCK', name: 'In Stock', displayOrder: 1, isActive: true, cssClass: 'status-badge-warning', textColor: 'text-celcom-warning' },
        { code: 'ACTIVE', name: 'Active', displayOrder: 2, isActive: true, cssClass: 'status-badge-active', textColor: 'text-celcom-success' },
        { code: 'IN_REPAIR', name: 'In Repair', displayOrder: 3, isActive: true, cssClass: 'status-badge-warning', textColor: 'text-celcom-warning' },
        { code: 'BROKEN', name: 'Broken', displayOrder: 4, isActive: true, cssClass: 'status-badge-danger', textColor: 'text-celcom-danger' },
        { code: 'CEASED', name: 'Ceased', displayOrder: 5, isActive: true, cssClass: 'status-badge-inactive', textColor: 'text-celcom-danger' }
      ],
      ownerTypes: [
        { code: 'CELCOM', name: 'Celcom', displayOrder: 1, isActive: true },
        { code: 'VENDOR', name: 'Vendor', displayOrder: 2, isActive: true }
      ],
      acquisitionTypes: [
        { code: 'BOUGHT', name: 'Bought', displayOrder: 1, isActive: true },
        { code: 'LEASED', name: 'Leased', displayOrder: 2, isActive: true },
        { code: 'RENTED', name: 'Rented', displayOrder: 3, isActive: true }
      ],
      assetConfig: {
        pageSize: 10,
        minNameLength: 2,
        minSerialLength: 2,
        itemSize: 80
      },
      defaultValues: {
        defaultStatus: 'IN_STOCK',
        defaultOwnerType: 'CELCOM',
        defaultAcquisitionType: 'BOUGHT'
      }
    };
  }

  /**
   * Refresh configuration from database
   */
  refreshConfiguration(): Observable<SystemConfiguration> {
    this.configurationSubject.next(null);
    return this.loadConfiguration();
  }
} 