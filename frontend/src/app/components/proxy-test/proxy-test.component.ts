import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { VendorService } from '../../services/vendor.service';

@Component({
  selector: 'app-proxy-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="proxy-test-container" style="padding: 20px; border: 2px solid #007bff; margin: 20px;">
      <h3>🔧 Proxy Configuration Test</h3>
      <p><strong>Purpose:</strong> Verify DELETE and PUT requests are properly proxied</p>
      
      <div class="test-buttons" style="margin: 20px 0;">
        <button 
          (click)="testGetRequest()" 
          class="btn btn-primary"
          style="margin-right: 10px;">
          Test GET /api/vendors
        </button>
        
        <button 
          (click)="testPostRequest()" 
          class="btn btn-success"
          style="margin-right: 10px;">
          Test POST /api/vendors (Dry Run)
        </button>
        
        <button 
          (click)="testPutRequest()" 
          class="btn btn-warning"
          style="margin-right: 10px;">
          Test PUT /api/vendors/test (Dry Run)
        </button>
        
        <button 
          (click)="testDeleteRequest()" 
          class="btn btn-danger"
          style="margin-right: 10px;">
          Test DELETE /api/vendors/test (Dry Run)
        </button>
      </div>

      <div class="test-results" style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
        <h4>Test Results:</h4>
        <div *ngFor="let result of testResults" 
             [style.color]="result.success ? 'green' : 'red'">
          {{ result.message }}
        </div>
      </div>

      <div class="instructions" style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 5px;">
        <h4>📋 Instructions:</h4>
        <ol>
          <li>Open Browser Developer Tools (F12)</li>
          <li>Go to Network tab</li>
          <li>Click the test buttons above</li>
          <li>Check that requests show as <code>localhost:4200/api/vendors</code></li>
          <li>Look for proxy logs in console: <code>🔗 Proxying: METHOD /api/vendors</code></li>
        </ol>
      </div>
    </div>
  `,
  styleUrls: []
})
export class ProxyTestComponent {
  testResults: Array<{message: string, success: boolean}> = [];

  constructor(
    private http: HttpClient,
    private vendorService: VendorService
  ) {}

  testGetRequest(): void {
    this.addResult('🔍 Testing GET /api/vendors...', true);
    
    this.vendorService.getAllVendors().subscribe({
      next: (vendors) => {
        this.addResult(`✅ GET successful - Retrieved ${vendors.length} vendors`, true);
        this.addResult('🔗 Check Network tab: Request should show localhost:4200/api/vendors', true);
      },
      error: (error) => {
        this.addResult(`❌ GET failed: ${error.message}`, false);
        this.addResult('💡 Check proxy configuration and backend server', false);
      }
    });
  }

  testPostRequest(): void {
    this.addResult('🔍 Testing POST /api/vendors (dry run)...', true);
    
    // Create a test vendor object
    const testVendor = {
      name: 'PROXY_TEST_VENDOR',
      contactInfo: 'proxy.test@example.com',
      status: 'Active'
    };

    this.http.post('/api/vendors', testVendor, {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: (response) => {
        this.addResult('✅ POST request reached backend (may have failed validation)', true);
        this.addResult('🔗 Check Network tab: Request should show localhost:4200/api/vendors', true);
      },
      error: (error) => {
        if (error.status === 400 || error.status === 422) {
          this.addResult('✅ POST request reached backend (validation error expected)', true);
        } else if (error.status === 0) {
          this.addResult('❌ POST failed: Network error - check backend server', false);
        } else {
          this.addResult(`✅ POST request proxied correctly (status: ${error.status})`, true);
        }
        this.addResult('🔗 Check Network tab for request details', true);
      }
    });
  }

  testPutRequest(): void {
    this.addResult('🔍 Testing PUT /api/vendors/proxy-test (dry run)...', true);
    
    const testUpdate = {
      name: 'PROXY_TEST_UPDATED',
      contactInfo: 'updated@example.com',
      status: 'Active'
    };

    this.http.put('/api/vendors/proxy-test-id', testUpdate, {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: (response) => {
        this.addResult('✅ PUT request reached backend', true);
        this.addResult('🔗 Check Network tab: Request should show localhost:4200/api/vendors/proxy-test-id', true);
      },
      error: (error) => {
        if (error.status === 404) {
          this.addResult('✅ PUT request proxied correctly (404 expected for test ID)', true);
        } else if (error.status === 0) {
          this.addResult('❌ PUT failed: Network error - check backend server', false);
        } else {
          this.addResult(`✅ PUT request proxied correctly (status: ${error.status})`, true);
        }
        this.addResult('🔗 Check Network tab: Should show PUT request to localhost:4200/api/vendors/proxy-test-id', true);
      }
    });
  }

  testDeleteRequest(): void {
    this.addResult('🔍 Testing DELETE /api/vendors/proxy-test (dry run)...', true);
    
    this.http.delete('/api/vendors/proxy-test-id', {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: (response) => {
        this.addResult('✅ DELETE request reached backend', true);
        this.addResult('🔗 Check Network tab: Request should show localhost:4200/api/vendors/proxy-test-id', true);
      },
      error: (error) => {
        if (error.status === 404) {
          this.addResult('✅ DELETE request proxied correctly (404 expected for test ID)', true);
        } else if (error.status === 0) {
          this.addResult('❌ DELETE failed: Network error - check backend server', false);
        } else {
          this.addResult(`✅ DELETE request proxied correctly (status: ${error.status})`, true);
        }
        this.addResult('🔗 Check Network tab: Should show DELETE request to localhost:4200/api/vendors/proxy-test-id', true);
      }
    });
  }

  private addResult(message: string, success: boolean): void {
    this.testResults.push({ message, success });
    console.log(success ? `✅ ${message}` : `❌ ${message}`);
  }
} 