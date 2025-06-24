import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { LayoutService } from '../../../services/layout.service';
import { Subject, takeUntil } from 'rxjs';

export interface FormDrawerConfig {
  title: string;
  submitButtonText?: string;
  cancelButtonText?: string;
  width?: string;
  showFooter?: boolean;
  isSubmitting?: boolean;
}

@Component({
  selector: 'app-form-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Form Drawer -->
    <div 
      class="form-drawer"
      [class.form-drawer-open]="isOpen"
      [style.width]="config.width || '400px'">
      
      <!-- Drawer Header -->
      <div class="form-drawer-header">
        <h3 class="form-drawer-title">{{ config.title }}</h3>
        <button 
          type="button"
          (click)="onCancel()"
          class="form-drawer-close-btn"
          [disabled]="config.isSubmitting">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Drawer Content -->
      <div class="form-drawer-content">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="h-full flex flex-col">
          <!-- Form Fields -->
          <div class="form-drawer-body">
            <ng-content></ng-content>
          </div>

          <!-- Form Footer -->
          <div class="form-drawer-footer" *ngIf="config.showFooter !== false">
            <div class="flex items-center justify-end space-x-3">
              <button
                type="button"
                (click)="onCancel()"
                [disabled]="config.isSubmitting"
                class="btn-secondary">
                {{ config.cancelButtonText || 'Cancel' }}
              </button>
              
              <button
                type="submit"
                [disabled]="form.invalid || config.isSubmitting"
                class="btn-primary">
                
                <!-- Loading Spinner -->
                <svg 
                  *ngIf="config.isSubmitting" 
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                
                {{ config.isSubmitting ? 'Saving...' : (config.submitButtonText || 'Save') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Drawer Overlay -->
    <div 
      *ngIf="isOpen" 
      class="form-drawer-overlay"
      (click)="onCancel()">
    </div>
  `,
  styleUrls: ['./form-drawer.component.css']
})
export class FormDrawerComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() config: FormDrawerConfig = { title: '' };
  @Input() form!: FormGroup;
  
  @Output() submit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private layoutService = inject(LayoutService);

  ngOnInit(): void {
    // Auto-focus first input when drawer opens
    if (this.isOpen) {
      this.focusFirstInput();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.form.valid && !this.config.isSubmitting) {
      this.submit.emit(this.form.value);
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.form);
    }
  }

  onCancel(): void {
    if (!this.config.isSubmitting) {
      this.cancel.emit();
      this.close.emit();
    }
  }

  private focusFirstInput(): void {
    setTimeout(() => {
      const firstInput = document.querySelector('.form-drawer input, .form-drawer select, .form-drawer textarea') as HTMLElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 300); // Wait for animation to complete
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control && typeof control === 'object' && 'controls' in control) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
} 