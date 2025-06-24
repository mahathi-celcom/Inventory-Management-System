import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetTypeService } from '../../services/asset-type.service';
import { AssetMakeService } from '../../services/asset-make.service';
import { AssetModelService } from '../../services/asset-model.service';

@Component({
  selector: 'app-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 bg-white rounded-lg shadow">
      <h2 class="text-xl font-bold mb-4">API Debug Information</h2>
      
      <div class="space-y-4">
        <div>
          <h3 class="font-semibold">Backend Connection Test:</h3>
          <button (click)="testConnections()" class="px-4 py-2 bg-blue-600 text-white rounded">
            Test All Connections
          </button>
        </div>

        <div *ngIf="debugInfo">
          <h3 class="font-semibold">Debug Results:</h3>
          <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">{{ debugInfo | json }}</pre>
        </div>

        <div>
          <h3 class="font-semibold">API Endpoints Being Used:</h3>
          <ul class="list-disc pl-5 text-sm">
            <li>Asset Types: GET http://localhost:8080/api/asset-types/all</li>
            <li>Asset Makes: GET http://localhost:8080/api/asset-makes/all</li>
            <li>Asset Models: GET http://localhost:8080/api/asset-models/all</li>
            <li>Create Asset Type: POST http://localhost:8080/api/asset-types</li>
            <li>Create Asset Make: POST http://localhost:8080/api/asset-makes</li>
            <li>Create Asset Model: POST http://localhost:8080/api/asset-models</li>
          </ul>
        </div>
      </div>
    </div>
  `
})
export class DebugComponent implements OnInit {
  debugInfo: any = null;

  constructor(
    private assetTypeService: AssetTypeService,
    private assetMakeService: AssetMakeService,
    private assetModelService: AssetModelService
  ) {}

  ngOnInit(): void {}

  testConnections(): void {
    this.debugInfo = {
      timestamp: new Date().toISOString(),
      results: {}
    };

    // Test Asset Types
    this.assetTypeService.getAllAssetTypes().subscribe({
      next: (types) => {
        this.debugInfo.results.assetTypes = {
          success: true,
          count: types.length,
          data: types,
          source: types.length > 0 && types[0].id && types[0].id < 1000 ? 'mock' : 'backend'
        };
      },
      error: (error) => {
        this.debugInfo.results.assetTypes = {
          success: false,
          error: error.message || error
        };
      }
    });

    // Test Asset Makes
    this.assetMakeService.getAllAssetMakes().subscribe({
      next: (makes) => {
        this.debugInfo.results.assetMakes = {
          success: true,
          count: makes.length,
          data: makes,
          source: makes.length > 0 && makes[0].id && makes[0].id < 1000 ? 'mock' : 'backend'
        };
      },
      error: (error) => {
        this.debugInfo.results.assetMakes = {
          success: false,
          error: error.message || error
        };
      }
    });

    // Test Asset Models
    this.assetModelService.getAllAssetModels().subscribe({
      next: (models) => {
        this.debugInfo.results.assetModels = {
          success: true,
          count: models.length,
          data: models,
          source: models.length > 0 && models[0].id && models[0].id < 1000 ? 'mock' : 'backend'
        };
      },
      error: (error) => {
        this.debugInfo.results.assetModels = {
          success: false,
          error: error.message || error
        };
      }
    });
  }
} 