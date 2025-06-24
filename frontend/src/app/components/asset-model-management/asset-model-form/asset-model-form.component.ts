import { Component, OnInit, OnChanges, Input, Output, EventEmitter, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AssetType } from '../../../models/asset-type.model';
import { AssetMake } from '../../../models/asset-make.model';
import { AssetModel } from '../../../models/asset-model.model';
import { AssetTypeService } from '../../../services/asset-type.service';
import { AssetMakeService } from '../../../services/asset-make.service';
import { AssetModelService } from '../../../services/asset-model.service';

@Component({
  selector: 'app-asset-model-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './asset-model-form.component.html',
  styleUrl: './asset-model-form.component.css'
})
export class AssetModelFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() editingModel: AssetModel | null = null;
  @Input() refreshTrigger: any;
  @Output() modelSaved = new EventEmitter<AssetModel>();
  @Output() formCancelled = new EventEmitter<void>();
  @Output() openTypeModal = new EventEmitter<void>();
  @Output() openMakeModal = new EventEmitter<number>();
  @Output() editTypeModal = new EventEmitter<AssetType>();
  @Output() editMakeModal = new EventEmitter<AssetMake>();
  @Output() deleteAssetType = new EventEmitter<number>();
  @Output() deleteAssetMake = new EventEmitter<number>();

  private destroy$ = new Subject<void>();

  assetModelForm: FormGroup;
  assetTypes: AssetType[] = [];
  assetMakes: AssetMake[] = [];
  filteredMakes: AssetMake[] = [];
  isSubmitting = false;
  isEditMode = false;

  // Status mapping for backend compatibility
  private readonly statusMapping: { [key: string]: string } = {
    'Active': 'Active',
    'Inactive': 'Inactive',
    'Not For Buying': 'NotForBuying'
  };

  // Reverse mapping for displaying data from backend
  private readonly statusDisplayMapping: { [key: string]: string } = {
    'Active': 'Active',
    'Inactive': 'Inactive',
    'NotForBuying': 'Not For Buying'
  };

  constructor(
    private fb: FormBuilder,
    private assetTypeService: AssetTypeService,
    private assetMakeService: AssetMakeService,
    private assetModelService: AssetModelService
  ) {
    this.assetModelForm = this.fb.group({
      typeId: ['', [Validators.required]],
      makeId: ['', [Validators.required]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      ram: [''],
      storage: [''],
      processor: [''],
      status: ['Active', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadAssetTypes();
    this.loadAssetMakes();
    this.setupFormSubscriptions();
    
    if (this.editingModel) {
      this.isEditMode = true;
      this.populateForm(this.editingModel);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Check if refreshTrigger has actually changed
    if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
      console.log('Refresh trigger changed, reloading form data...');
      this.loadAssetTypes();
      this.loadAssetMakes();
    }
    
    // Handle editing model changes
    if (changes['editingModel']) {
      if (this.editingModel) {
        this.isEditMode = true;
        // Delay population to ensure data is loaded first
        setTimeout(() => {
          this.populateForm(this.editingModel!);
        }, 100);
      } else {
        this.isEditMode = false;
        this.resetForm(); 
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAssetTypes(): void {
    this.assetTypeService.getAllAssetTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.assetTypes = types;
          console.log('Loaded asset types:', types);
        },
        error: (error) => {
          console.error('Error loading asset types:', error);
        }
      });
  }

  private loadAssetMakes(): void {
    this.assetMakeService.getAllAssetMakes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (makes) => {
          this.assetMakes = makes;
          console.log('Loaded asset makes:', makes);
          this.filterMakesByType();
        },
        error: (error) => {
          console.error('Error loading asset makes:', error);
        }
      });
  }

  private setupFormSubscriptions(): void {
    // Watch for asset type changes to filter makes
    this.assetModelForm.get('typeId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterMakesByType();
        // Reset make selection when type changes
        this.assetModelForm.get('makeId')?.setValue('');
      });
  }

  private filterMakesByType(): void {
    const selectedTypeId = this.assetModelForm.get('typeId')?.value;
    if (selectedTypeId) {
      this.filteredMakes = this.assetMakes.filter(make => make.typeId === Number(selectedTypeId));
    } else {
      this.filteredMakes = [];
    }
  }

  private populateForm(model: AssetModel): void {
    // Find the asset type for this model's make
    const make = this.assetMakes.find(m => m.id === model.makeId);
    const typeId = make ? make.typeId : '';

    // Map status from backend format to display format
    const displayStatus = this.statusDisplayMapping[model.status || 'Active'] || model.status || 'Active';

    console.log('📥 Backend status:', model.status, '→ Display status:', displayStatus);

    this.assetModelForm.patchValue({
      typeId: typeId,
      makeId: model.makeId,
      name: model.name,
      ram: model.ram || '',
      storage: model.storage || '',
      processor: model.processor || '',
      status: displayStatus
    });

    // Trigger make filtering
    this.filterMakesByType();
  }

  onSubmit(): void {
    if (this.assetModelForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formValue = this.assetModelForm.value;
      
      // Map status to backend-compatible format
      const mappedStatus = this.statusMapping[formValue.status] || formValue.status;
      
      const assetModelData: Omit<AssetModel, 'id'> = {
        typeId: Number(formValue.typeId),
        makeId: Number(formValue.makeId),
        name: formValue.name.trim(),
        ram: formValue.ram?.trim() || undefined,
        storage: formValue.storage?.trim() || undefined,
        processor: formValue.processor?.trim() || undefined,
        status: mappedStatus
      };

      console.log('🔄 Asset Model Data being sent to API:', assetModelData);
      console.log('📤 Original form status:', formValue.status, '→ Mapped status:', mappedStatus);

      const operation = this.isEditMode 
        ? this.assetModelService.updateAssetModel(this.editingModel!.id!, assetModelData)
        : this.assetModelService.createAssetModel(assetModelData);

      operation.pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (savedModel) => {
            this.modelSaved.emit(savedModel);
            this.resetForm();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error saving asset model:', error);
            this.isSubmitting = false;
            // You might want to emit an error event here for the parent to handle
            alert(`Failed to ${this.isEditMode ? 'update' : 'create'} asset model. Please try again.`);
          }
        });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.assetModelForm.controls).forEach(key => {
        this.assetModelForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.resetForm();
    this.formCancelled.emit();
  }

  onAddAssetType(): void {
    this.openTypeModal.emit();
  }

  onAddAssetMake(): void {
    const selectedTypeId = this.assetModelForm.get('typeId')?.value;
    if (selectedTypeId) {
      this.openMakeModal.emit(Number(selectedTypeId));
    }
  }

  onEditAssetType(): void {
    const selectedTypeId = this.assetModelForm.get('typeId')?.value;
    if (selectedTypeId) {
      const selectedType = this.assetTypes.find(type => type.id === Number(selectedTypeId));
      if (selectedType) {
        this.editTypeModal.emit(selectedType);
      }
    }
  }

  onEditAssetMake(): void {
    const selectedMakeId = this.assetModelForm.get('makeId')?.value;
    if (selectedMakeId) {
      const selectedMake = this.filteredMakes.find(make => make.id === Number(selectedMakeId));
      if (selectedMake) {
        this.editMakeModal.emit(selectedMake);
      }
    }
  }

  onDeleteAssetType(): void {
    const selectedTypeId = this.assetModelForm.get('typeId')?.value;
    if (selectedTypeId) {
      const selectedType = this.assetTypes.find(type => type.id === Number(selectedTypeId));
      if (selectedType && confirm(`Are you sure you want to delete the asset type "${selectedType.name}"?`)) {
        this.deleteAssetType.emit(Number(selectedTypeId));
        // Clear the form selection after deletion
        this.assetModelForm.get('typeId')?.setValue('');
        this.assetModelForm.get('makeId')?.setValue('');
        this.filteredMakes = [];
      }
    }
  }

  onDeleteAssetMake(): void {
    const selectedMakeId = this.assetModelForm.get('makeId')?.value;
    if (selectedMakeId) {
      const selectedMake = this.filteredMakes.find(make => make.id === Number(selectedMakeId));
      if (selectedMake && confirm(`Are you sure you want to delete the asset make "${selectedMake.name}"?`)) {
        this.deleteAssetMake.emit(Number(selectedMakeId));
        // Clear the make selection after deletion
        this.assetModelForm.get('makeId')?.setValue('');
      }
    }
  }

  private resetForm(): void {
    this.assetModelForm.reset();
    this.isEditMode = false;
    this.editingModel = null;
    this.filteredMakes = [];
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.assetModelForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.assetModelForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }


} 