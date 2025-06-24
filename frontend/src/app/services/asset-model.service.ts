import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AssetModel, AssetModelWithDetails } from '../models/asset-model.model';
import { AssetTypeService } from './asset-type.service';
import { AssetMakeService } from './asset-make.service';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root'
})
export class AssetModelService {


  constructor(
    private http: HttpClient,
    private assetTypeService: AssetTypeService,
    private assetMakeService: AssetMakeService,
    private apiConfig: ApiConfigService
  ) {}

  getAllAssetModels(): Observable<AssetModel[]> {
    return this.http.get<any>(this.apiConfig.endpoints.assetModels.getAll)
      .pipe(
        tap(response => this.apiConfig.logResponse('asset-models/getAll', response)),
        map(response => this.apiConfig.extractData<AssetModel>(response)),
        catchError((error) => {
          console.error('Failed to load asset models from backend:', error);
          // Return empty array instead of mock data to ensure DB integration
          return of([]);
        })
      );
  }

  getAllAssetModelsWithDetails(): Observable<AssetModelWithDetails[]> {
    return forkJoin({
      models: this.getAllAssetModels(),
      types: this.assetTypeService.getAllAssetTypes(),
      makes: this.assetMakeService.getAllAssetMakes()
    }).pipe(
      map(({ models, types, makes }) => {
        return models.map(model => {
          const make = makes.find(m => m.id === model.makeId);
          const type = types.find(t => t.id === make?.typeId);
          
          return {
            ...model,
            assetMakeName: make?.name,
            assetTypeName: type?.name
          } as AssetModelWithDetails;
        });
      })
    );
  }

  getAssetModel(id: number): Observable<AssetModel> {
    return this.http.get<any>(`${this.apiConfig.endpoints.assetModels.getAll}/${id}`)
      .pipe(
        tap(response => this.apiConfig.logResponse('asset-models/get', response)),
        map(response => this.apiConfig.extractItem<AssetModel>(response)),
        catchError((error) => {
          console.error('Failed to get asset model from backend:', error);
          throw error;
        })
      );
  }

  createAssetModel(assetModel: Omit<AssetModel, 'id'>): Observable<AssetModel> {
    console.log('Creating asset model:', assetModel);
    return this.http.post<any>(this.apiConfig.endpoints.assetModels.create, assetModel)
      .pipe(
        tap(response => this.apiConfig.logResponse('asset-models/create', response)),
        map(response => this.apiConfig.extractItem<AssetModel>(response)),
        catchError((error) => {
          console.error('Failed to create asset model via API:', error);
          // Re-throw error to let component handle it properly
          throw error;
        })
      );
  }

  updateAssetModel(id: number, assetModel: Partial<AssetModel>): Observable<AssetModel> {
    return this.http.put<any>(`${this.apiConfig.endpoints.assetModels.update}/${id}`, assetModel)
      .pipe(
        tap(response => this.apiConfig.logResponse('asset-models/update', response)),
        map(response => this.apiConfig.extractItem<AssetModel>(response)),
        catchError((error) => {
          console.error('Failed to update asset model via API:', error);
          throw error;
        })
      );
  }

  deleteAssetModel(id: number): Observable<void> {
    return this.http.delete(`${this.apiConfig.endpoints.assetModels.delete}/${id}`, { 
      responseType: 'text' as 'json' // Handle 204 No Content properly
    })
      .pipe(
        map(() => void 0), // Convert any response to void
        tap(() => console.log('Asset model deleted successfully')),
        catchError((error) => {
          console.error('Failed to delete asset model via API:', error);
          throw error;
        })
      );
  }

  getAssetModelsByMake(makeId: number): Observable<AssetModel[]> {
    return this.http.get<AssetModel[]>(`${this.apiConfig.endpoints.assetModels.getByMake}/${makeId}/all`)
      .pipe(
        tap(response => this.apiConfig.logResponse('asset-models/getByMake', response)),
        catchError((error) => {
          console.error('Failed to get asset models by make from backend:', error);
          throw error;
        })
      );
  }
} 