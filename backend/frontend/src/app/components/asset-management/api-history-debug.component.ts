import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../services/asset.service';

@Component({
  selector: 'app-api-history-debug',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 bg-white border border-gray-300 rounded-lg shadow-lg max-w-4xl mx-auto mt-8">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">🔍 API History Debug Tool</h2>
      
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Asset ID to test:</label>
        <input 
          type="number" 
          [(ngModel)]="testAssetId" 
          class="border border-gray-300 rounded px-3 py-2 w-32"
          placeholder="e.g. 1">
        <button 
          (click)="testAllEndpoints()" 
          [disabled]="loading"
          class="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
          {{ loading ? 'Testing...' : 'Test All Endpoints' }}
        </button>
      </div>

      <!-- Status History Results -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-3 text-gray-800">📊 Status History Results</h3>
        <div class="bg-gray-50 border border-gray-200 rounded p-4">
          <div class="mb-2">
            <strong>Endpoint:</strong> 
            <code class="bg-gray-100 px-2 py-1 rounded text-sm">GET /api/asset-status-histories/asset/{{ testAssetId }}/all</code>
          </div>
          <div class="mb-2">
            <strong>Status:</strong> 
            <span [class]="statusHistoryStatus === 'success' ? 'text-green-600' : statusHistoryStatus === 'error' ? 'text-red-600' : 'text-gray-600'">
              {{ statusHistoryStatus }}
            </span>
          </div>
          @if (statusHistoryError) {
            <div class="mb-2">
              <strong>Error:</strong> 
              <span class="text-red-600">{{ statusHistoryError }}</span>
            </div>
          }
          @if (statusHistoryData.length > 0) {
            <div class="mb-2">
              <strong>Records found:</strong> {{ statusHistoryData.length }}
            </div>
            <details class="mt-2">
              <summary class="cursor-pointer text-blue-600 hover:text-blue-800">View Raw Data</summary>
              <pre class="mt-2 bg-white border border-gray-300 rounded p-2 text-xs overflow-auto max-h-60">{{ statusHistoryData | json }}</pre>
            </details>
          } @else if (statusHistoryStatus === 'success') {
            <div class="text-orange-600">No status history records found</div>
          }
        </div>
      </div>

      <!-- Assignment History Results -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-3 text-gray-800">👥 Assignment History Results</h3>
        <div class="bg-gray-50 border border-gray-200 rounded p-4">
          <div class="mb-2">
            <strong>Endpoint:</strong> 
            <code class="bg-gray-100 px-2 py-1 rounded text-sm">GET /api/asset-assignment-history/asset/{{ testAssetId }}</code>
          </div>
          <div class="mb-2">
            <strong>Status:</strong> 
            <span [class]="assignmentHistoryStatus === 'success' ? 'text-green-600' : assignmentHistoryStatus === 'error' ? 'text-red-600' : 'text-gray-600'">
              {{ assignmentHistoryStatus }}
            </span>
          </div>
          @if (assignmentHistoryError) {
            <div class="mb-2">
              <strong>Error:</strong> 
              <span class="text-red-600">{{ assignmentHistoryError }}</span>
            </div>
          }
          @if (assignmentHistoryData && assignmentHistoryData.content && assignmentHistoryData.content.length > 0) {
            <div class="mb-2">
              <strong>Records found:</strong> {{ assignmentHistoryData.content.length }}
            </div>
            <div class="mb-2">
              <strong>Total Elements:</strong> {{ assignmentHistoryData.totalElements }}
            </div>
            <details class="mt-2">
              <summary class="cursor-pointer text-blue-600 hover:text-blue-800">View Raw Data</summary>
              <pre class="mt-2 bg-white border border-gray-300 rounded p-2 text-xs overflow-auto max-h-60">{{ assignmentHistoryData | json }}</pre>
            </details>
          } @else if (assignmentHistoryStatus === 'success') {
            <div class="text-orange-600">No assignment history records found</div>
          }
        </div>
      </div>

      <!-- Network Info -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-3 text-gray-800">🌐 Network Information</h3>
        <div class="bg-gray-50 border border-gray-200 rounded p-4">
          <div class="mb-2">
            <strong>Base URL:</strong> {{ baseUrl }}
          </div>
          <div class="mb-2">
            <strong>Current Origin:</strong> {{ window.location.origin }}
          </div>
          <div class="mb-2">
            <strong>Environment:</strong> {{ environment }}
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex space-x-4">
        <button 
          (click)="testStatusHistoryOnly()" 
          [disabled]="loading"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
          Test Status History Only
        </button>
        <button 
          (click)="testAssignmentHistoryOnly()" 
          [disabled]="loading"
          class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50">
          Test Assignment History Only
        </button>
        <button 
          (click)="clearResults()" 
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          Clear Results
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class ApiHistoryDebugComponent {
  private assetService = inject(AssetService);
  
  testAssetId = 1;
  loading = false;
  
  // Status History
  statusHistoryStatus: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  statusHistoryData: any[] = [];
  statusHistoryError = '';
  
  // Assignment History
  assignmentHistoryStatus: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  assignmentHistoryData: any = null;
  assignmentHistoryError = '';
  
  // Environment info
  baseUrl = '';
  window = window;
  environment = 'development';

  constructor() {
    this.baseUrl = window.location.origin;
  }

  async testAllEndpoints() {
    this.loading = true;
    this.clearResults();
    
    await Promise.all([
      this.testStatusHistoryOnly(),
      this.testAssignmentHistoryOnly()
    ]);
    
    this.loading = false;
  }

  async testStatusHistoryOnly() {
    this.statusHistoryStatus = 'loading';
    this.statusHistoryError = '';
    this.statusHistoryData = [];
    
    try {
      console.log(`🔍 Testing status history for asset ${this.testAssetId}`);
      const data = await this.assetService.getAssetStatusHistory(this.testAssetId).toPromise();
      this.statusHistoryData = data || [];
      this.statusHistoryStatus = 'success';
      console.log('✅ Status history test successful:', data);
    } catch (error: any) {
      this.statusHistoryStatus = 'error';
      this.statusHistoryError = this.getErrorMessage(error);
      console.error('❌ Status history test failed:', error);
    }
  }

  async testAssignmentHistoryOnly() {
    this.assignmentHistoryStatus = 'loading';
    this.assignmentHistoryError = '';
    this.assignmentHistoryData = null;
    
    try {
      console.log(`🔍 Testing assignment history for asset ${this.testAssetId}`);
      const data = await this.assetService.getAssetAssignmentHistory(this.testAssetId).toPromise();
      this.assignmentHistoryData = data;
      this.assignmentHistoryStatus = 'success';
      console.log('✅ Assignment history test successful:', data);
    } catch (error: any) {
      this.assignmentHistoryStatus = 'error';
      this.assignmentHistoryError = this.getErrorMessage(error);
      console.error('❌ Assignment history test failed:', error);
    }
  }

  clearResults() {
    this.statusHistoryStatus = 'idle';
    this.statusHistoryData = [];
    this.statusHistoryError = '';
    
    this.assignmentHistoryStatus = 'idle';
    this.assignmentHistoryData = null;
    this.assignmentHistoryError = '';
  }

  private getErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'Network error - Backend not accessible';
    } else if (error.status === 404) {
      return `HTTP 404 - Endpoint not found (${error.url})`;
    } else if (error.status === 500) {
      return 'HTTP 500 - Internal server error';
    } else if (error.status === 403) {
      return 'HTTP 403 - Forbidden';
    } else if (error.status === 401) {
      return 'HTTP 401 - Unauthorized';
    } else if (error.message) {
      return `${error.status || 'Unknown'}: ${error.message}`;
    } else {
      return `Unknown error: ${JSON.stringify(error)}`;
    }
  }
} 