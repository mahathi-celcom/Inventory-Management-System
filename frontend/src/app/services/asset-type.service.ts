import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AssetType } from '../models/asset-type.model';

@Injectable({
  providedIn: 'root'
})
export class AssetTypeService {
  private readonly apiUrl = 'http://localhost:8080/api/asset-types';

  // Mock data for testing
  private mockAssetTypes: AssetType[] = [
    { id: 1, name: 'Laptop', description: 'Portable computers', status: 'Active', assetCategory: 'HARDWARE', assetTypeName: 'Laptop' },
    { id: 2, name: 'Desktop', description: 'Desktop computers', status: 'Active', assetCategory: 'HARDWARE', assetTypeName: 'Desktop' },
    { id: 3, name: 'Tablet', description: 'Tablet devices', status: 'Active', assetCategory: 'HARDWARE', assetTypeName: 'Tablet' },
    { id: 4, name: 'Server', description: 'Server hardware', status: 'Active', assetCategory: 'HARDWARE', assetTypeName: 'Server' },
    { id: 5, name: 'Monitor', description: 'Display monitors', status: 'Active', assetCategory: 'HARDWARE', assetTypeName: 'Monitor' },
    { id: 6, name: 'Operating System', description: 'System software', status: 'Active', assetCategory: 'SOFTWARE', assetTypeName: 'Operating System' },
    { id: 7, name: 'Application Software', description: 'Application programs', status: 'Active', assetCategory: 'SOFTWARE', assetTypeName: 'Application Software' },
    { id: 8, name: 'Keyboard', description: 'Input devices', status: 'Active', assetCategory: 'HARDWARE', assetTypeName: 'Keyboard' },
    { id: 9, name: 'Mouse', description: 'Pointing devices', status: 'Active', assetCategory: 'HARDWARE', assetTypeName: 'Mouse' }
  ];

  constructor(private http: HttpClient) {}

  getAllAssetTypes(): Observable<AssetType[]> {
    return this.http.get<AssetType[]>(`${this.apiUrl}/all`)
      .pipe(
        catchError((error) => {
          console.warn('Failed to load asset types from backend, using mock data. Please ensure your backend is running:', error);
          return of(this.mockAssetTypes);
        })
      );
  }

  getAssetType(id: number): Observable<AssetType> {
    return this.http.get<AssetType>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(() => {
          const assetType = this.mockAssetTypes.find(type => type.id === id);
          return of(assetType!);
        })
      );
  }

  createAssetType(assetType: Omit<AssetType, 'id'>): Observable<AssetType> {
    return this.http.post<AssetType>(this.apiUrl, assetType)
      .pipe(
        catchError((error) => {
          console.warn('Failed to create asset type via API, creating locally for development:', error);
          const newAssetType = { ...assetType, id: Date.now(), status: 'Active' } as AssetType;
          this.mockAssetTypes.push(newAssetType);
          return of(newAssetType);
        })
      );
  }

  updateAssetType(id: number, assetType: Partial<AssetType>): Observable<AssetType> {
    return this.http.put<AssetType>(`${this.apiUrl}/${id}`, assetType)
      .pipe(
        catchError(() => {
          const index = this.mockAssetTypes.findIndex(type => type.id === id);
          if (index !== -1) {
            this.mockAssetTypes[index] = { ...this.mockAssetTypes[index], ...assetType };
            return of(this.mockAssetTypes[index]);
          }
          throw new Error('Asset type not found');
        })
      );
  }

  deleteAssetType(id: number): Observable<void> {
    return this.http.delete(`${this.apiUrl}/${id}`, { 
      responseType: 'text' as 'json' // Handle 204 No Content properly
    })
      .pipe(
        map(() => void 0), // Convert any response to void
        tap(() => console.log('Asset type deleted successfully')),
        catchError((error) => {
          console.error('Failed to delete asset type via API:', error);
          throw error;
        })
      );
  }

  // New method: Get asset types filtered by category
  getAssetTypesByCategory(category: string): Observable<AssetType[]> {
    return this.http.get<AssetType[]>(`${this.apiUrl}/category/${category}/active`)
      .pipe(
        tap(types => console.log(`Asset types for category ${category} fetched successfully:`, types)),
        catchError((error) => {
          console.warn(`Failed to load asset types for category ${category} from backend, using mock data:`, error);
          // Filter mock data by category
          const filteredTypes = this.mockAssetTypes.filter(type => 
            type.assetCategory === category && type.status === 'Active'
          );
          return of(filteredTypes);
        })
      );
  }

  // New method: Get all active asset types
  getActiveAssetTypes(): Observable<AssetType[]> {
    return this.http.get<AssetType[]>(`${this.apiUrl}/active`)
      .pipe(
        tap(types => console.log('Active asset types fetched successfully:', types)),
        catchError((error) => {
          console.warn('Failed to load active asset types from backend, using mock data:', error);
          const activeTypes = this.mockAssetTypes.filter(type => type.status === 'Active');
          return of(activeTypes);
        })
      );
  }
} 