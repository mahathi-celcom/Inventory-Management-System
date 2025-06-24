import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { AssetComponent } from './asset.component';
import { AssetService } from '../../services/asset.service';
import { ApiConfigService } from '../../services/api-config.service';

describe('AssetComponent', () => {
  let component: AssetComponent;
  let fixture: ComponentFixture<AssetComponent>;
  let assetService: jasmine.SpyObj<AssetService>;

  beforeEach(async () => {
    const assetServiceSpy = jasmine.createSpyObj('AssetService', [
      'getAllAssets',
      'getAssetById',
      'createAsset',
      'updateAsset',
      'deleteAsset',
      'getAssetTypes',
      'getAssetMakes',
      'getAssetModels',
      'getAssetModelsByMake',
      'getVendors',
      'getUsers',
      'getOperatingSystems',
      'getOSVersions',
      'getOSVersionsByOS',
      'getPurchaseOrders',
      'getPOByNumber'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        AssetComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatTableModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatTooltipModule,
        MatMenuModule,
        ScrollingModule
      ],
      providers: [
        { provide: AssetService, useValue: assetServiceSpy },
        ApiConfigService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AssetComponent);
    component = fixture.componentInstance;
    assetService = TestBed.inject(AssetService) as jasmine.SpyObj<AssetService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms on construction', () => {
    expect(component.assetForm).toBeDefined();
    expect(component.filterForm).toBeDefined();
  });

  it('should have default values in asset form', () => {
    const assetForm = component.assetForm;
    expect(assetForm.get('status')?.value).toBe('Active');
    expect(assetForm.get('ownerType')?.value).toBe('Celcom');
    expect(assetForm.get('acquisitionType')?.value).toBe('Bought');
  });

  it('should validate required fields', () => {
    const assetForm = component.assetForm;
    
    // Test required fields
    expect(assetForm.get('name')?.hasError('required')).toBeTruthy();
    expect(assetForm.get('serialNumber')?.hasError('required')).toBeTruthy();
    expect(assetForm.get('modelId')?.hasError('required')).toBeTruthy();
  });

  it('should open add asset modal', () => {
    component.openAddAssetModal();
    
    expect(component.isFormModalOpen()).toBeTruthy();
    expect(component.isEditMode()).toBeFalsy();
    expect(component.selectedAsset()).toBeNull();
  });

  it('should close asset modal', () => {
    component.openAddAssetModal();
    component.closeAssetModal();
    
    expect(component.isFormModalOpen()).toBeFalsy();
    expect(component.selectedAsset()).toBeNull();
  });

  it('should track assets by ID', () => {
    const asset = { assetId: 1, name: 'Test Asset', serialNumber: 'SN001' } as any;
    const result = component.trackByAssetId(0, asset);
    
    expect(result).toBe(1);
  });

  it('should handle search input', () => {
    spyOn(component, 'onSearchChange');
    
    component.onSearchChange('test search');
    
    expect(component.onSearchChange).toHaveBeenCalledWith('test search');
  });

  it('should clear filters', () => {
    component.clearFilters();
    
    const filterForm = component.filterForm;
    expect(filterForm.get('search')?.value).toBe('');
    expect(filterForm.get('status')?.value).toBe('All');
    expect(filterForm.get('ownership')?.value).toBe('All');
  });

  it('should get field errors', () => {
    const assetForm = component.assetForm;
    const nameControl = assetForm.get('name');
    
    nameControl?.markAsTouched();
    nameControl?.setValue('');
    
    const error = component.getFieldError('name');
    expect(error).toContain('required');
  });

  it('should handle page changes', () => {
    const pageEvent = { pageIndex: 1, pageSize: 10 } as any;
    spyOn(component, 'loadAssets' as any);
    
    component.onPageChange(pageEvent);
    
    expect(component.currentPage()).toBe(1);
    expect(component.pageSize()).toBe(10);
  });

  it('should handle selection toggle', () => {
    const asset = { assetId: 1, name: 'Test Asset' } as any;
    
    expect(component.selection.isSelected(asset)).toBeFalsy();
    
    component.selection.toggle(asset);
    
    expect(component.selection.isSelected(asset)).toBeTruthy();
  });

  it('should compute filtered assets', () => {
    const assets = [
      { assetId: 1, name: 'Laptop', status: 'Active', ownerType: 'Celcom' },
      { assetId: 2, name: 'Desktop', status: 'Inactive', ownerType: 'Vendor' }
    ] as any[];
    
    component.assets.set(assets);
    component.currentFilters.set({ status: 'Active' });
    
    const filtered = component.filteredAssets();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Laptop');
  });

  it('should compute selection state', () => {
    expect(component.hasSelectedAssets()).toBeFalsy();
    expect(component.selectedCount()).toBe(0);
    
    const asset = { assetId: 1, name: 'Test Asset' } as any;
    component.selection.select(asset);
    
    expect(component.hasSelectedAssets()).toBeTruthy();
    expect(component.selectedCount()).toBe(1);
  });

  it('should handle master toggle', () => {
    const assets = [
      { assetId: 1, name: 'Asset 1' },
      { assetId: 2, name: 'Asset 2' }
    ] as any[];
    
    component.assets.set(assets);
    
    // Select all
    component.masterToggle();
    expect(component.selection.selected.length).toBe(2);
    
    // Deselect all
    component.masterToggle();
    expect(component.selection.selected.length).toBe(0);
  });

  it('should get helper text for dropdowns', () => {
    const users = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' }
    ] as any[];
    
    component.users.set(users);
    
    expect(component.getUserName(1)).toBe('John Doe');
    expect(component.getUserName(999)).toBe('Unknown User');
    expect(component.getUserName()).toBe('Unassigned');
  });

  it('should auto-populate asset type and make when model is selected', () => {
    const modelsWithDetails = [
      { id: 1, name: 'MacBook Pro', makeId: 1, makeName: 'Apple', typeId: 1, typeName: 'Laptop' }
    ] as any[];
    
    component.assetModelsWithDetails.set(modelsWithDetails);
    
    // Simulate model selection
    component.assetForm.patchValue({ modelId: 1 });
    
    expect(component.selectedAssetType()).toBe('Laptop');
    expect(component.selectedAssetMake()).toBe('Apple');
  });

  it('should set currentUserId to null on creation', () => {
    component.openAddAssetModal();
    
    expect(component.assetForm.get('currentUserId')?.value).toBeNull();
  });
}); 