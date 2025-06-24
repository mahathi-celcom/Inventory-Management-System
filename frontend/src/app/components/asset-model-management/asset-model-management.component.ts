import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AssetModel, AssetModelWithDetails } from '../../models/asset-model.model';
import { AssetType } from '../../models/asset-type.model';
import { AssetMake } from '../../models/asset-make.model';
import { AssetModelFormComponent } from './asset-model-form/asset-model-form.component';
import { AssetModelTableComponent } from './asset-model-table/asset-model-table.component';
import { AddModalComponent, ModalConfig } from '../shared/add-modal/add-modal.component';
import { LayoutComponent, NavigationItem } from '../shared/layout/layout.component';
import { AssetTypeService } from '../../services/asset-type.service';
import { AssetMakeService } from '../../services/asset-make.service';
import { AssetModelService } from '../../services/asset-model.service';

@Component({
  selector: 'app-asset-model-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    AssetModelFormComponent, 
    AssetModelTableComponent, 
    AddModalComponent,
    LayoutComponent
  ],
  templateUrl: './asset-model-management.component.html',
  styleUrl: './asset-model-management.component.css'
})
export class AssetModelManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Navigation
  navigationItems: NavigationItem[] = [];

  // Form state
  editingModel: AssetModel | null = null;
  showForm = false; // Keep for backward compatibility
  showFormModal = false;

  // Modal state
  showTypeModal = false;
  showMakeModal = false;
  typeModalConfig: ModalConfig = {
    title: 'Add New Asset Type',
    fields: [
      { name: 'name', label: 'Type Name', type: 'text', required: true, placeholder: 'e.g., Laptop, Desktop, Server' },
      { 
        name: 'assetCategory', 
        label: 'Asset Category', 
        type: 'select', 
        required: true, 
        placeholder: 'Select Category',
        options: [
          { value: 'Hardware', label: 'Hardware' },
          { value: 'Software', label: 'Software' }
        ]
      },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' }
    ],
    submitText: 'Add Type',
    cancelText: 'Cancel'
  };
  makeModalConfig: ModalConfig = {
    title: 'Add New Asset Make',
    fields: [
      { name: 'name', label: 'Make Name', type: 'text', required: true, placeholder: 'e.g., Apple, Dell, HP' }
    ],
    submitText: 'Add Make',
    cancelText: 'Cancel'
  };

  // Loading states
  isSubmittingType = false;
  isSubmittingMake = false;

  // Success message states
  successMessage = '';
  showSuccessMessage = false;
  
  // Error message states
  errorMessage = '';
  showErrorMessage = false;

  // Refresh trigger for table
  refreshTrigger = 0; // Start with 0, will be updated in ngOnInit

  // Current asset type for make modal
  selectedtypeId: number | null = null;

  // Edit mode tracking
  editingAssetType: AssetType | null = null;
  editingAssetMake: AssetMake | null = null;

  // Filter properties for summary section
  allAssetModels: AssetModelWithDetails[] = [];
  filteredAssetModels: AssetModelWithDetails[] = [];
  quickSearchFilter = '';
  selectedAssetTypeFilter = '';
  selectedStatusFilter = '';
  selectedCategoryFilter = '';
  uniqueAssetTypes: string[] = [];

  // Status mapping for backend compatibility
  private readonly statusDisplayMapping: { [key: string]: string } = {
    'Active': 'Active',
    'Inactive': 'Inactive',
    'NotForBuying': 'Not For Buying'
  };

  constructor(
    private assetTypeService: AssetTypeService,
    private assetMakeService: AssetMakeService,
    private assetModelService: AssetModelService
  ) {}

  ngOnInit(): void {
    this.initializeNavigation();
    // Component initialization
    this.loadAssetModelsForSummary();
    // Ensure initial load of data
    this.refreshTable();
  }

  private initializeNavigation(): void {
    this.navigationItems = [
      {
        label: 'Dashboard',
        route: '/dashboard',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10z"></path>
        </svg>`
      },
      {
        label: 'Assets',
        route: '/assets',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>`
      },
      {
        label: 'Asset Models',
        route: '/asset-models',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>`
      },
      {
        label: 'Asset POs',
        route: '/asset-pos',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>`
      },
      {
        label: 'Vendors',
        route: '/vendors',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>`
      },
      {
        label: 'OS & Versions',
        route: '/os-versions',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>`
      },
      {
        label: 'Users',
        route: '/users',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
        </svg>`
      }
    ];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Form event handlers
  onModelSaved(model: AssetModel): void {
    console.log('Model saved:', model);
    this.editingModel = null;
    
    // Show success message
    this.showSuccessMessage = true;
    this.successMessage = `Asset model "${model.name}" ${model.id ? 'updated' : 'created'} successfully!`;
    
    // Hide success message after delay
    setTimeout(() => {
      this.showSuccessMessage = false;
      this.successMessage = '';
    }, 3000);
    
    // Refresh both form and table to reflect changes
    this.refreshAll();
  }

  onFormCancelled(): void {
    this.editingModel = null;
    // Hide form completely on cancel as requested
    this.showForm = false;
    this.showFormModal = false;
  }

  onOpenTypeModal(): void {
    this.editingAssetType = null;
    this.typeModalConfig.title = 'Add New Asset Type';
    this.typeModalConfig.submitText = 'Add Type';
    this.showTypeModal = true;
  }

  onEditTypeModal(assetType: AssetType): void {
    this.editingAssetType = assetType;
    this.typeModalConfig.title = 'Edit Asset Type';
    this.typeModalConfig.submitText = 'Update Type';
    this.showTypeModal = true;
  }

  onOpenMakeModal(typeId: number): void {
    this.selectedtypeId = typeId;
    this.editingAssetMake = null;
    this.makeModalConfig.title = 'Add New Asset Make';
    this.makeModalConfig.submitText = 'Add Make';
    this.showMakeModal = true;
  }

  onEditMakeModal(assetMake: AssetMake): void {
    this.editingAssetMake = assetMake;
    this.makeModalConfig.title = 'Edit Asset Make';
    this.makeModalConfig.submitText = 'Update Make';
    this.showMakeModal = true;
  }

  // Table event handlers
  onEditModel(model: AssetModelWithDetails): void {
    this.editingModel = {
      id: model.id,
      typeId: model.typeId,
      makeId: model.makeId,
      name: model.name,
      ram: model.ram,
      storage: model.storage,
      processor: model.processor,
      status: model.status
    };
    this.showForm = true;
    this.showFormModal = true;
  }

  onDeleteModel(model: AssetModelWithDetails): void {
    // Deletion is handled in the table component
    this.refreshTable();
  }

  // Modal event handlers
  onCloseTypeModal(): void {
    this.showTypeModal = false;
    this.isSubmittingType = false;
    this.editingAssetType = null;
  }

  onCloseMakeModal(): void {
    this.showMakeModal = false;
    this.isSubmittingMake = false;
    this.selectedtypeId = null;
    this.editingAssetMake = null;
  }

  onSubmitTypeModal(formData: any): void {
    this.isSubmittingType = true;
    
    const assetTypeData: Omit<AssetType, 'id'> = {
      name: formData.name.trim(),
      assetCategory: formData.assetCategory,
      description: formData.description?.trim() || undefined,
      status: 'Active'
    };

    const operation = this.editingAssetType
      ? this.assetTypeService.updateAssetType(this.editingAssetType.id!, assetTypeData)
      : this.assetTypeService.createAssetType(assetTypeData);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (assetType) => {
          const action = this.editingAssetType ? 'updated' : 'created';
          console.log(`Asset type ${action}:`, assetType);
          this.isSubmittingType = false;
          
          // Show success message
          this.showSuccessMessage = true;
          this.successMessage = `Asset type "${assetType.name}" ${action} successfully!`;
          
          // Close modal immediately and hide success message after delay
          this.onCloseTypeModal();
          setTimeout(() => {
            this.showSuccessMessage = false;
            this.successMessage = '';
          }, 3000);
          
          // Refresh all components to reflect the changes
          this.refreshAll();
        },
        error: (error) => {
          const action = this.editingAssetType ? 'update' : 'create';
          console.error(`Error ${action}ing asset type:`, error);
          this.isSubmittingType = false;
          this.showErrorMessage = true;
          this.errorMessage = `Failed to ${action} asset type. Please try again.`;
          setTimeout(() => {
            this.showErrorMessage = false;
            this.errorMessage = '';
          }, 5000);
        }
      });
  }

  onSubmitMakeModal(formData: any): void {
    if (!this.editingAssetMake && !this.selectedtypeId) {
      console.error('No asset type selected for make creation');
      this.isSubmittingMake = false;
      return;
    }

    this.isSubmittingMake = true;
    
    const assetMakeData: Omit<AssetMake, 'id'> = {
      name: formData.name.trim(),
      typeId: this.editingAssetMake?.typeId || this.selectedtypeId!,
      status: 'Active'
    };

    const operation = this.editingAssetMake
      ? this.assetMakeService.updateAssetMake(this.editingAssetMake.id!, assetMakeData)
      : this.assetMakeService.createAssetMake(assetMakeData);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (assetMake) => {
          const action = this.editingAssetMake ? 'updated' : 'created';
          console.log(`Asset make ${action}:`, assetMake);
          this.isSubmittingMake = false;
          
          // Show success message
          this.showSuccessMessage = true;
          this.successMessage = `Asset make "${assetMake.name}" ${action} successfully!`;
          
          // Close modal immediately and hide success message after delay
          this.onCloseMakeModal();
          setTimeout(() => {
            this.showSuccessMessage = false;
            this.successMessage = '';
          }, 3000);
          
          // Refresh all components to reflect the changes
          this.refreshAll();
        },
        error: (error) => {
          const action = this.editingAssetMake ? 'update' : 'create';
          console.error(`Error ${action}ing asset make:`, error);
          this.isSubmittingMake = false;
          this.showErrorMessage = true;
          this.errorMessage = `Failed to ${action} asset make. Please try again.`;
          setTimeout(() => {
            this.showErrorMessage = false;
            this.errorMessage = '';
          }, 5000);
        }
      });
  }

  // Utility methods
  refreshTable(): void {
    // Use a more reliable refresh mechanism
    this.refreshTrigger = Math.random() * 1000000;
    console.log('Refreshing table with trigger:', this.refreshTrigger);
  }

  private refreshFormData(): void {
    // Force refresh of form component data
    // This will reload asset types and makes in the dropdowns
    this.refreshTrigger = Math.random() * 1000000;
    console.log('Refreshing form data with trigger:', this.refreshTrigger);
  }

  private refreshAll(): void {
    // Refresh both form and table
    this.refreshTrigger = Math.random() * 1000000;
    console.log('Refreshing all components with trigger:', this.refreshTrigger);
    // Also refresh summary data
    this.loadAssetModelsForSummary();
  }

  private loadAssetModelsForSummary(): void {
    this.assetModelService.getAllAssetModelsWithDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (models) => {
          this.allAssetModels = models;
          this.filteredAssetModels = [...models];
          this.updateUniqueAssetTypes();
          this.applyAssetFilters();
        },
        error: (error) => {
          console.error('Error loading asset models for summary:', error);
        }
      });
  }

  private updateUniqueAssetTypes(): void {
    this.uniqueAssetTypes = [...new Set(
      this.allAssetModels
        .map(model => model.assetTypeName)
        .filter((name): name is string => name !== undefined && name !== null && name.trim() !== '')
    )].sort();
  }

  onNavigationClick(item: NavigationItem): void {
    console.log('Navigation clicked:', item);
  }

  toggleFormVisibility(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.editingModel = null;
    }
  }

  // New modal methods
  openCreateModal(): void {
    this.editingModel = null;
    this.showForm = true;
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showForm = false;
    this.showFormModal = false;
    this.editingModel = null;
  }

  closeModalOnBackdrop(event: Event): void {
    // Only close if clicking on the backdrop (not the modal content)
    if (event.target === event.currentTarget) {
      this.closeFormModal();
    }
  }

  // Handle make modal opening with selected type
  openMakeModalForType(typeId: number): void {
    this.selectedtypeId = typeId;
    this.showMakeModal = true;
  }

  // Delete handlers
  onDeleteAssetType(typeId: number): void {
    // Find the asset type name for the confirmation dialog
    const selectedType = this.getAssetTypeName(typeId);
    const typeName = selectedType || 'this asset type';
    
    if (confirm(`Are you sure you want to delete ${typeName}? This action cannot be undone.`)) {
      this.assetTypeService.deleteAssetType(typeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Asset type deleted successfully');
            this.showSuccessMessage = true;
            this.successMessage = `Asset type "${typeName}" deleted successfully!`;
            
            setTimeout(() => {
              this.showSuccessMessage = false;
              this.successMessage = '';
            }, 3000);
            
            // Refresh all components to reflect the deletion
            this.refreshAll();
          },
          error: (error) => {
            console.error('Error deleting asset type:', error);
            this.showErrorMessage = true;
            this.errorMessage = `Failed to delete asset type. It may be in use by asset models.`;
            setTimeout(() => {
              this.showErrorMessage = false;
              this.errorMessage = '';
            }, 5000);
          }
        });
    }
  }

  onDeleteAssetMake(makeId: number): void {
    // Find the asset make name for the confirmation dialog
    const selectedMake = this.getAssetMakeName(makeId);
    const makeName = selectedMake || 'this asset make';
    
    if (confirm(`Are you sure you want to delete ${makeName}? This action cannot be undone.`)) {
      this.assetMakeService.deleteAssetMake(makeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Asset make deleted successfully');
            this.showSuccessMessage = true;
            this.successMessage = `Asset make "${makeName}" deleted successfully!`;
            
            setTimeout(() => {
              this.showSuccessMessage = false;
              this.successMessage = '';
            }, 3000);
            
            // Refresh all components to reflect the deletion
            this.refreshAll();
          },
          error: (error) => {
            console.error('Error deleting asset make:', error);
            this.showErrorMessage = true;
            this.errorMessage = `Failed to delete asset make. It may be in use by asset models.`;
            setTimeout(() => {
              this.showErrorMessage = false;
              this.errorMessage = '';
            }, 5000);
          }
        });
    }
  }

  // Helper methods for getting names for delete confirmations
  private getAssetTypeName(typeId: number): string | null {
    // This is a placeholder - in a real app, you'd need to fetch or cache this data
    return `Asset Type #${typeId}`;
  }

  private getAssetMakeName(makeId: number): string | null {
    // This is a placeholder - in a real app, you'd need to fetch or cache this data  
    return `Asset Make #${makeId}`;
  }

  // Asset count methods for summary card
  getTotalAssetCount(): number {
    return this.filteredAssetModels.length;
  }

  getActiveAssetCount(): number {
    return this.filteredAssetModels.filter(asset => asset.status === 'Active').length;
  }

  getInactiveAssetCount(): number {
    return this.filteredAssetModels.filter(asset => asset.status === 'Inactive').length;
  }

  getNotForBuyingAssetCount(): number {
    return this.filteredAssetModels.filter(asset => asset.status === 'NotForBuying').length;
  }

  // Get display-friendly status text
  getDisplayStatus(status: string): string {
    return this.statusDisplayMapping[status] || status || 'Active';
  }

  // Filter methods
  applyAssetFilters(): void {
    this.filteredAssetModels = this.allAssetModels.filter(asset => {
      // 🎯 Category filter (highest priority - affects available types)
      if (this.selectedCategoryFilter) {
        const assetCategory = (asset as any).assetCategory || this.determineCategoryFromTypeName(asset.assetTypeName);
        if (assetCategory !== this.selectedCategoryFilter) {
          return false;
        }
      }

      // Quick search filter
      if (this.quickSearchFilter) {
        const searchTerm = this.quickSearchFilter.toLowerCase();
        const assetName = (asset.name || '').toLowerCase();
        const assetTypeName = (asset.assetTypeName || '').toLowerCase();
        const assetMakeName = (asset.assetMakeName || '').toLowerCase();
        
        if (!assetName.includes(searchTerm) && 
            !assetTypeName.includes(searchTerm) && 
            !assetMakeName.includes(searchTerm)) {
          return false;
        }
      }

      // Asset type filter
      if (this.selectedAssetTypeFilter && asset.assetTypeName !== this.selectedAssetTypeFilter) {
        return false;
      }

      // Status filter - handle both display and backend formats
      if (this.selectedStatusFilter) {
        const displayStatus = this.getDisplayStatus(asset.status || 'Active');
        if (displayStatus !== this.selectedStatusFilter && (asset.status || 'Active') !== this.selectedStatusFilter) {
          return false;
        }
      }

      return true;
    });

    // 🎯 Update available asset types based on current category filter
    this.updateAvailableAssetTypes();
  }

  private updateAvailableAssetTypes(): void {
    let availableModels = this.allAssetModels;
    
    // Filter by category if selected to show only relevant asset types
    if (this.selectedCategoryFilter) {
      availableModels = this.allAssetModels.filter(model => {
        const modelCategory = this.determineCategoryFromTypeName(model.assetTypeName);
        return modelCategory === this.selectedCategoryFilter;
      });
    }

    // Update unique asset types based on filtered models
    this.uniqueAssetTypes = [...new Set(
      availableModels
        .map(model => model.assetTypeName)
        .filter((name): name is string => name !== undefined && name !== null && name.trim() !== '')
    )].sort();
  }

  private determineCategoryFromTypeName(typeName?: string): string {
    if (!typeName) return 'HARDWARE';
    
    const softwareKeywords = ['software', 'application', 'operating system', 'license', 'program'];
    const lowerTypeName = typeName.toLowerCase();
    
    return softwareKeywords.some(keyword => lowerTypeName.includes(keyword)) ? 'SOFTWARE' : 'HARDWARE';
  }

  clearAssetFilters(): void {
    this.quickSearchFilter = '';
    this.selectedAssetTypeFilter = '';
    this.selectedStatusFilter = '';
    this.selectedCategoryFilter = '';
    this.applyAssetFilters();
  }

  // 🔹 NEW: Hardware/Software Category Filtering Methods
  filterByCategory(category: string): void {
    this.selectedCategoryFilter = category;
    this.selectedAssetTypeFilter = ''; // Reset type filter when category changes
    this.applyAssetFilters();
  }

  getFilterButtonClass(category: string): string {
    const isActive = this.selectedCategoryFilter === category;
    
    if (category === 'HARDWARE') {
      return isActive 
        ? 'bg-blue-600 text-white shadow-lg border-blue-600' 
        : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50';
    } else if (category === 'SOFTWARE') {
      return isActive 
        ? 'bg-green-600 text-white shadow-lg border-green-600' 
        : 'bg-white text-green-600 border border-green-300 hover:bg-green-50';
    } else {
      // All Models button
      return isActive 
        ? 'bg-gray-600 text-white shadow-lg border-gray-600' 
        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50';
    }
  }
} 