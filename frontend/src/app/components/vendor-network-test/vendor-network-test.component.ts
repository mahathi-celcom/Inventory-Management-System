import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendorService } from '../../services/vendor.service';
import { Vendor, VENDOR_STATUS } from '../../models/vendor.model';

@Component({
  selector: 'app-vendor-network-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="network-test-container">
      <h3>🔧 Vendor Network Test (Debug Mode)</h3>
      
      <div class="test-section">
        <h4>Available Vendors for Testing:</h4>
        <div *ngIf="testVendors.length === 0" class="no-vendors">
          No vendors available. Create some first.
        </div>
        <ul class="vendor-list">
          <li *ngFor="let vendor of testVendors" class="vendor-item">
            <strong>{{ vendor.name }}</strong> 
            (ID: {{ vendor.vendorId }}, Status: {{ vendor.status }})
            
            <div class="test-buttons">
              <button (click)="testUpdate(vendor)" class="btn btn-warning">
                Test UPDATE
              </button>
              <button (click)="testDelete(vendor)" class="btn btn-danger">
                Test DELETE
              </button>
            </div>
          </li>
        </ul>
      </div>
      
      <div class="test-results">
        <h4>Test Results:</h4>
        <pre>{{ testResults }}</pre>
      </div>
      
      <div class="debug-info">
        <h4>Debug Information:</h4>
        <button (click)="runAllTests()" class="btn btn-primary">Run All Tests</button>
        <button (click)="clearResults()" class="btn btn-secondary">Clear Results</button>
      </div>
    </div>
  `,
  styles: [`
    .network-test-container {
      padding: 20px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .vendor-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      margin: 5px 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .test-buttons {
      display: flex;
      gap: 10px;
    }
    
    .btn {
      padding: 5px 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .btn-warning { background: #ffc107; color: #212529; }
    .btn-danger { background: #dc3545; color: white; }
    .btn-primary { background: #007bff; color: white; }
    .btn-secondary { background: #6c757d; color: white; }
    
    .test-results {
      margin-top: 20px;
      background: #f1f3f4;
      padding: 15px;
      border-radius: 4px;
      max-height: 400px;
      overflow-y: auto;
    }
    
    pre {
      white-space: pre-wrap;
      font-size: 12px;
    }
    
    .no-vendors {
      color: #6c757d;
      font-style: italic;
    }
  `]
})
export class VendorNetworkTestComponent implements OnInit {
  testVendors: Vendor[] = [];
  testResults = '';

  constructor(private vendorService: VendorService) {}

  ngOnInit(): void {
    this.loadTestVendors();
  }

  loadTestVendors(): void {
    this.addResult('🔄 Loading vendors for testing...');
    
    this.vendorService.getAllVendors().subscribe({
      next: (vendors) => {
        this.testVendors = vendors.slice(0, 3); // Only first 3 for testing
        this.addResult(`✅ Loaded ${vendors.length} vendors (showing first 3)`);
        
        // Debug vendor IDs
        vendors.forEach((vendor, index) => {
          this.addResult(`Vendor ${index + 1}: "${vendor.name}" - ID: ${vendor.vendorId} (${typeof vendor.vendorId})`);
        });
      },
      error: (error) => {
        this.addResult(`❌ Failed to load vendors: ${error.message}`);
      }
    });
  }

  testUpdate(vendor: Vendor): void {
    this.addResult(`\n🔄 Testing UPDATE for: ${vendor.name} (ID: ${vendor.vendorId})`);
    
    // Test data
    const updateData = {
      ...vendor,
      name: vendor.name + ' [UPDATED]',
      contactInfo: 'test-update@example.com'
    };

    this.vendorService.updateVendor(vendor.vendorId!, updateData).subscribe({
      next: (updatedVendor) => {
        this.addResult(`✅ UPDATE successful: ${JSON.stringify(updatedVendor, null, 2)}`);
        
        // Revert the change
        this.vendorService.updateVendor(vendor.vendorId!, vendor).subscribe({
          next: () => this.addResult(`🔄 Reverted changes for ${vendor.name}`),
          error: (revertError) => this.addResult(`⚠️ Failed to revert: ${revertError.message}`)
        });
      },
      error: (error) => {
        this.addResult(`❌ UPDATE failed: Status ${error.status} - ${error.statusText}`);
        this.addResult(`   URL: ${error.url}`);
        this.addResult(`   Error: ${JSON.stringify(error.error, null, 2)}`);
      }
    });
  }

  testDelete(vendor: Vendor): void {
    this.addResult(`\n⚠️ DELETE test cancelled - would remove vendor: ${vendor.name}`);
    this.addResult(`   To test DELETE, manually check browser DevTools Network tab`);
    this.addResult(`   Expected URL: /api/vendors/${vendor.vendorId}`);
    
    // Instead of actually deleting, just simulate the network call analysis
    this.addResult(`\n🔍 DELETE Analysis:`);
    this.addResult(`   Vendor ID: ${vendor.vendorId} (${typeof vendor.vendorId})`);
    this.addResult(`   Expected URL: DELETE /api/vendors/${vendor.vendorId}`);
    this.addResult(`   Vendor object: ${JSON.stringify(vendor, null, 2)}`);
  }

  runAllTests(): void {
    this.clearResults();
    this.addResult('🧪 Running comprehensive network tests...\n');
    
    this.testVendors.forEach((vendor, index) => {
      setTimeout(() => {
        this.addResult(`\n--- Test ${index + 1}: ${vendor.name} ---`);
        this.testUpdate(vendor);
      }, index * 2000); // Stagger tests
    });
  }

  clearResults(): void {
    this.testResults = '';
  }

  private addResult(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.testResults += `[${timestamp}] ${message}\n`;
  }
} 