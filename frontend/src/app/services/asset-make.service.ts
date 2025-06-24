import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AssetMake } from '../models/asset-make.model';

@Injectable({
  providedIn: 'root'
})
export class AssetMakeService {
  private readonly apiUrl = 'http://localhost:8080/api/asset-makes';

  constructor(private http: HttpClient) {}

  getAllAssetMakes(): Observable<AssetMake[]> {
    return this.http.get<{content: AssetMake[], totalElements: number, totalPages: number}>(this.apiUrl)
      .pipe(
        map(response => response.content || []),
        tap(makes => console.log('Asset makes fetched successfully:', makes)),
        catchError((error) => {
          console.error('Failed to load asset makes from backend:', error);
          throw error;
        })
      );
  }

  getAssetMakesByType(typeId: number): Observable<AssetMake[]> {
    return this.http.get<AssetMake[]>(`${this.apiUrl}/by-type/${typeId}/all`)
      .pipe(
        tap(makes => console.log('Asset makes by type fetched successfully:', makes)),
        catchError((error) => {
          console.error('Failed to load asset makes by type from backend:', error);
          throw error;
        })
      );
  }

  getAssetMake(id: number): Observable<AssetMake> {
    return this.http.get<AssetMake>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError((error) => {
          console.error('Failed to get asset make from backend:', error);
          throw error;
        })
      );
  }

  createAssetMake(assetMake: Omit<AssetMake, 'id'>): Observable<AssetMake> {
    console.log('Creating asset make:', assetMake);
    return this.http.post<AssetMake>(this.apiUrl, assetMake)
      .pipe(
        tap(result => console.log('Asset make created successfully:', result)),
        catchError((error) => {
          console.error('Failed to create asset make via API:', error);
          throw error;
        })
      );
  }

  updateAssetMake(id: number, assetMake: Partial<AssetMake>): Observable<AssetMake> {
    return this.http.put<AssetMake>(`${this.apiUrl}/${id}`, assetMake)
      .pipe(
        tap(result => console.log('Asset make updated successfully:', result)),
        catchError((error) => {
          console.error('Failed to update asset make via API:', error);
          throw error;
        })
      );
  }

  deleteAssetMake(id: number): Observable<void> {
    return this.http.delete(`${this.apiUrl}/${id}`, { 
      responseType: 'text' as 'json' // Handle 204 No Content properly
    })
      .pipe(
        map(() => void 0), // Convert any response to void
        tap(() => console.log('Asset make deleted successfully')),
        catchError((error) => {
          console.error('Failed to delete asset make via API:', error);
          throw error;
        })
      );
  }
} 