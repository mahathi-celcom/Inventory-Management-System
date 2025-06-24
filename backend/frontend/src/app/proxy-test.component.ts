import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AssetPoService } from './services/asset-po.service';

@Component({
  selector: 'app-proxy-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg m-4">
      <h2 class="text-lg font-bold text-blue-800 mb-4">🧪 Proxy Configuration Test</h2>
      
      <div class="space-y-3">
        <button 
          (click)="testBasicProxy()" 
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Test Basic Proxy
        </button>
        
        <button 
          (click)="testAssetPOEndpoint()" 
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Test Asset PO Endpoint
        </button>
        
        <button 
          (click)="testCascadeEndpoint()" 
          class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          Test Cascade Endpoint
        </button>
      </div>
      
      <div class="mt-4 p-3 bg-gray-100 rounded">
        <h3 class="font-semibold mb-2">Test Results:</h3>
        <div class="text-sm font-mono" [innerHTML]="testResults"></div>
      </div>
      
      <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h3 class="font-semibold text-yellow-800 mb-2">Expected Backend Endpoints:</h3>
        <ul class="text-sm text-yellow-700 space-y-1">
          <li>✅ <code>GET /api/asset-pos</code> - List Asset POs</li>
          <li>✅ <code>PUT /api/asset-pos/{{ '{' }}id{{ '}' }}/cascade</code> - Cascade update</li>
          <li>❌ <code>PUT /api/asset-pos/{{ '{' }}id{{ '}' }}/safe-pk-update</code> - Not implemented yet</li>
        </ul>
      </div>
    </div>
  `
})
export class ProxyTestComponent implements OnInit {
  testResults = '';

  constructor(
    private http: HttpClient,
    private assetPoService: AssetPoService
  ) {}

  ngOnInit() {
    this.log('🚀 Proxy Test Component loaded');
    this.log('📍 Frontend URL: ' + window.location.origin);
    this.log('🎯 Backend should be: http://localhost:8080');
    this.log('🔗 Proxy pattern: /api/* → http://localhost:8080/api/*');
  }

  testBasicProxy() {
    this.log('🧪 Testing basic proxy configuration...');
    
    // Direct HTTP call to test proxy
    this.http.get('/api/asset-pos', { observe: 'response' })
      .subscribe({
        next: (response) => {
          this.log(`✅ Basic proxy test PASSED`);
          this.log(`📦 Status: ${response.status}`);
          this.log(`🔗 URL: ${response.url}`);
          this.log(`📊 Data count: ${Array.isArray(response.body) ? response.body.length : 'N/A'}`);
        },
        error: (error) => {
          this.log(`❌ Basic proxy test FAILED`);
          this.log(`📊 Status: ${error.status}`);
          this.log(`🔗 URL: ${error.url}`);
          this.log(`💬 Message: ${error.message}`);
          
          if (error.status === 0) {
            this.log(`🔌 Backend server not running or not accessible`);
          } else if (error.status === 404) {
            this.log(`🔍 Endpoint not found on backend`);
          }
        }
      });
  }

  testAssetPOEndpoint() {
    this.log('🧪 Testing Asset PO service endpoint...');
    
    this.assetPoService.testBackendConnectivity()
      .subscribe({
        next: (response) => {
          this.log(`✅ Asset PO endpoint test PASSED`);
          this.log(`📊 Response type: ${typeof response}`);
        },
        error: (error) => {
          this.log(`❌ Asset PO endpoint test FAILED`);
          this.log(`📊 Error details: ${JSON.stringify(error, null, 2)}`);
        }
      });
  }

  testCascadeEndpoint() {
    this.log('🧪 Testing cascade endpoint (simulated)...');
    
    // Test if cascade endpoint exists by making a controlled request
    const testPayload = { 
      poNumber: 'TEST-PO-001',
      invoiceNumber: 'TEST-INV-001' 
    };
    
    // Note: This will likely fail in real scenario, but helps debug
    this.http.put('/api/asset-pos/999/cascade', testPayload, { observe: 'response' })
      .subscribe({
        next: (response) => {
          this.log(`✅ Cascade endpoint test response received`);
          this.log(`📊 Status: ${response.status}`);
        },
        error: (error) => {
          this.log(`📊 Cascade endpoint test - Expected error for test ID`);
          this.log(`📊 Status: ${error.status}`);
          
          if (error.status === 404 && error.url?.includes('/cascade')) {
            this.log(`🔍 404 for cascade endpoint - backend may not implement this yet`);
          } else if (error.status === 400 || error.status === 422) {
            this.log(`✅ Endpoint exists but rejected test data (expected)`);
          } else {
            this.log(`❌ Unexpected error: ${error.message}`);
          }
        }
      });
  }

  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.testResults += `[${timestamp}] ${message}<br>`;
    console.log(message);
  }
} 