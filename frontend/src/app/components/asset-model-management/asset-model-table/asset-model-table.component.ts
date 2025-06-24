import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AssetModelWithDetails } from '../../../models/asset-model.model';
import { AssetModelService } from '../../../services/asset-model.service';

@Component({
  selector: 'app-asset-model-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asset-model-table.component.html',
  styleUrl: './asset-model-table.component.css'
})
export class AssetModelTableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() refreshTrigger: any;
  @Output() editModel = new EventEmitter<AssetModelWithDetails>();
  @Output() deleteModel = new EventEmitter<AssetModelWithDetails>();

  private destroy$ = new Subject<void>();

  assetModels: AssetModelWithDetails[] = [];
  filteredAssetModels: AssetModelWithDetails[] = [];
  loading = false;
  error: string | null = null;

  // Status display mapping for consistent UI display
  private readonly statusDisplayMapping: { [key: string]: string } = {
    'Active': 'Active',
    'Inactive': 'Inactive',
    'NotForBuying': 'Not For Buying'
  };

  // Filter properties
  selectedAssetType = '';
  selectedAssetMake = '';
  modelNameFilter = '';

  // Unique values for dropdowns
  uniqueAssetTypes: string[] = [];
  uniqueAssetMakes: string[] = [];

  constructor(private assetModelService: AssetModelService) {}

  ngOnInit(): void {
    this.loadAssetModels();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload when refresh trigger changes, but not on initial load since ngOnInit handles that
    if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
      console.log('Table refresh trigger changed, reloading asset models...');
      this.loadAssetModels();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAssetModels(): void {
    this.loading = true;
    this.error = null;

    this.assetModelService.getAllAssetModelsWithDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (models) => {
          this.assetModels = models;
          this.filteredAssetModels = [...models];
          this.updateFilterOptions();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load asset models';
          this.loading = false;
          console.error('Error loading asset models:', error);
        }
      });
  }

  private updateFilterOptions(): void {
    // Extract unique asset types
    this.uniqueAssetTypes = [...new Set(
      this.assetModels
        .map(model => model.assetTypeName)
        .filter((name): name is string => name !== undefined && name !== null && name.trim() !== '')
    )].sort();

    // Extract unique asset makes
    this.uniqueAssetMakes = [...new Set(
      this.assetModels
        .map(model => model.assetMakeName)
        .filter((name): name is string => name !== undefined && name !== null && name.trim() !== '')
    )].sort();
  }

  applyFilters(): void {
    this.filteredAssetModels = this.assetModels.filter(model => {
      // Asset Type filter
      if (this.selectedAssetType && model.assetTypeName !== this.selectedAssetType) {
        return false;
      }

      // Asset Make filter
      if (this.selectedAssetMake && model.assetMakeName !== this.selectedAssetMake) {
        return false;
      }

      // Model Name filter (case-insensitive partial match)
      if (this.modelNameFilter) {
        const searchTerm = this.modelNameFilter.toLowerCase();
        const modelName = (model.name || '').toLowerCase();
        if (!modelName.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }

  clearFilters(): void {
    this.selectedAssetType = '';
    this.selectedAssetMake = '';
    this.modelNameFilter = '';
    this.applyFilters();
  }

  onEdit(model: AssetModelWithDetails): void {
    this.editModel.emit(model);
  }

  onDelete(model: AssetModelWithDetails): void {
    this.deleteModel.emit(model);
  }

  confirmDelete(model: AssetModelWithDetails): void {
    if (confirm(`Are you sure you want to delete the asset model "${model.name}"?`)) {
      this.assetModelService.deleteAssetModel(model.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadAssetModels(); // Refresh the table
          },
          error: (error) => {
            console.error('Error deleting asset model:', error);
            alert('Failed to delete asset model. Please try again.');
          }
        });
    }
  }

  refresh(): void {
    this.loadAssetModels();
  }

  trackByModelId(index: number, model: AssetModelWithDetails): number {
    return model.id || index;
  }

  // Status badge styling methods
  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'not for buying':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return '🟢';
      case 'inactive':
        return '🔴';
      case 'not for buying':
        return '🟡';
      default:
        return '⚪';
    }
  }

  // Get display-friendly status text
  getDisplayStatus(status: string): string {
    return this.statusDisplayMapping[status] || status || 'Active';
  }
} 