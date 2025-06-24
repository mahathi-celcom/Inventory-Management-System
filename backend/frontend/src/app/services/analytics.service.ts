import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AssetStatusSummary {
  status: string;
  count: number;
  percentage: number;
}

export interface OSTypeSummary {
  osType: string;
  count: number;
  percentage: number;
}

export interface DepartmentTypeSummary {
  department: string;
  assetType: string;
  count: number;
}

export interface WarrantySummary {
  assetType: string;
  inWarranty: number;
  outOfWarranty: number;
  totalAssets: number;
  warrantyPercentage: number;
}

export interface AssetAgingSummary {
  ageRange: string;
  count: number;
  percentage: number;
}

export interface AssetDetail {
  id: number;
  assetTag: string;
  serialNumber: string;
  assetType: string;
  department: string;
  assignedUser: string;
  acquisitionDate: string;
  ageInYears: number;
  status: string;
}

export interface AnalyticsFilters {
  department?: string;
  assetType?: string;
  ageRange?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private baseUrl = '/api/analytics';

  /**
   * Get asset status summary for pie/bar charts
   */
  getAssetStatusSummary(): Observable<AssetStatusSummary[]> {
    return this.http.get<AssetStatusSummary[]>(`${this.baseUrl}/status-summary`);
  }

  /**
   * Get OS type summary for pie/donut charts
   */
  getOSTypeSummary(): Observable<OSTypeSummary[]> {
    return this.http.get<OSTypeSummary[]>(`${this.baseUrl}/os-summary`);
  }

  /**
   * Get department and asset type matrix for tabular view
   */
  getDepartmentTypeSummary(): Observable<DepartmentTypeSummary[]> {
    return this.http.get<DepartmentTypeSummary[]>(`${this.baseUrl}/department-type-summary`);
  }

  /**
   * Get warranty summary for table + grouped bar chart
   */
  getWarrantySummary(): Observable<WarrantySummary[]> {
    return this.http.get<WarrantySummary[]>(`${this.baseUrl}/warranty-summary`);
  }

  /**
   * Get asset aging summary with optional filters
   */
  getAssetAgingSummary(filters?: AnalyticsFilters): Observable<AssetAgingSummary[]> {
    let params = new HttpParams();
    
    if (filters?.department) {
      params = params.set('department', filters.department);
    }
    if (filters?.assetType) {
      params = params.set('assetType', filters.assetType);
    }

    return this.http.get<AssetAgingSummary[]>(`${this.baseUrl}/aging`, { params });
  }

  /**
   * Get detailed assets by age range
   */
  getAssetsByAgeRange(ageRange: string, filters?: AnalyticsFilters): Observable<AssetDetail[]> {
    let params = new HttpParams();
    
    if (filters?.department) {
      params = params.set('department', filters.department);
    }
    if (filters?.assetType) {
      params = params.set('assetType', filters.assetType);
    }

    return this.http.get<AssetDetail[]>(`${this.baseUrl}/assets/age-range/${ageRange}`, { params });
  }

  /**
   * Export filtered asset data to CSV
   */
  exportToCSV(filters?: AnalyticsFilters): Observable<Blob> {
    let params = new HttpParams();
    
    if (filters?.department) {
      params = params.set('department', filters.department);
    }
    if (filters?.assetType) {
      params = params.set('assetType', filters.assetType);
    }
    if (filters?.ageRange) {
      params = params.set('ageRange', filters.ageRange);
    }

    return this.http.get(`${this.baseUrl}/export/csv`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Export full asset data to CSV
   */
  exportFullCSV(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/csv/full`, {
      responseType: 'blob'
    });
  }

  /**
   * Utility method to download CSV blob
   */
  downloadCSV(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Generate filename with timestamp
   */
  generateCSVFilename(prefix: string = 'assets'): string {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
    return `${prefix}_${timestamp}.csv`;
  }
} 