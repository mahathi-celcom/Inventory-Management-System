import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { AssetPoService } from '../../services/asset-po.service';

interface MigrationDialogData {
  currentPoNumber: string;
}

@Component({
  selector: 'app-po-migration-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <div class="migration-dialog" [class.loading]="isLoading">
      <!-- Header -->
      <div class="dialog-header">
        <h2>PO Number Migration</h2>
        <p>Change PO number and migrate all linked assets</p>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <form [formGroup]="migrationForm" class="migration-form">
          <!-- Current PO -->
          <div class="po-section">
            <label>Current PO Number</label>
            <div class="po-display current">{{ data.currentPoNumber }}</div>
          </div>

          <!-- New PO -->
          <div class="po-section">
            <label>New PO Number</label>
            <input 
              type="text"
              formControlName="newPoNumber" 
              placeholder="Enter new PO number (e.g., PO-2024-022)"
              class="po-input"
              [class.error]="migrationForm.get('newPoNumber')?.invalid && migrationForm.get('newPoNumber')?.touched">
            
            <div *ngIf="migrationForm.get('newPoNumber')?.hasError('required') && migrationForm.get('newPoNumber')?.touched" class="error-text">
              New PO Number is required
            </div>
            <div *ngIf="migrationForm.get('newPoNumber')?.hasError('pattern') && migrationForm.get('newPoNumber')?.touched" class="error-text">
              Invalid format. Expected: PO-YYYY-NNN
            </div>
            <div *ngIf="migrationForm.hasError('sameAsOld') && migrationForm.get('newPoNumber')?.touched" class="error-text">
              Must be different from current PO number
            </div>
          </div>

          <!-- Confirmation Message -->
          <div *ngIf="migrationForm.valid" class="confirmation-message">
            <div class="migration-summary">
              <strong>{{ data.currentPoNumber }}</strong> → <strong>{{ migrationForm.get('newPoNumber')?.value }}</strong>
            </div>
            <p>All assets linked to the current PO will be transferred to the new PO number. This action cannot be undone.</p>
            <p class="confirm-question">Do you want to proceed with this migration?</p>
          </div>
        </form>
      </div>

      <!-- Actions -->
      <div class="dialog-actions">
        <button 
          type="button"
          class="btn-cancel"
          (click)="onCancel()"
          [disabled]="isLoading">
          Cancel
        </button>
        
        <button 
          type="button"
          class="btn-migrate"
          (click)="onMigrate()"
          [disabled]="migrationForm.invalid || isLoading">
          <span *ngIf="isLoading" class="loading-spinner"></span>
          {{ isLoading ? 'Migrating...' : 'Yes, Migrate PO' }}
        </button>
      </div>

      <!-- Loading Overlay -->
      <div *ngIf="isLoading" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Processing migration...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== CELCOM BRAND COLORS ===== */
    :root {
      --celcom-primary: #E2007A;
      --celcom-secondary: #F7941D;
      --celcom-accent: #6C2DC7;
      --celcom-text: #2C005B;
      --celcom-hover: #52006A;
      --celcom-success: #3BB54A;
      --celcom-background: #F4F4F4;
      --celcom-gradient: linear-gradient(135deg, #E2007A 0%, #F7941D 100%);
      --celcom-gradient-hover: linear-gradient(135deg, #52006A 0%, #E2007A 100%);
    }

    .migration-dialog {
      position: relative;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      width: 450px;
      max-width: 90vw;
      box-shadow: 0 25px 80px rgba(226, 0, 122, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border: 1px solid rgba(226, 0, 122, 0.1);
    }

    .migration-dialog.loading {
      pointer-events: none;
    }

    /* ===== HEADER ===== */
    .dialog-header {
      background: var(--celcom-gradient);
      color: white;
      padding: 28px 32px;
      text-align: center;
      position: relative;
    }

    .dialog-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
    }

    .dialog-header h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 700;
      position: relative;
      z-index: 1;
    }

    .dialog-header p {
      margin: 0;
      font-size: 15px;
      opacity: 0.95;
      position: relative;
      z-index: 1;
    }

    /* ===== CONTENT ===== */
    .dialog-content {
      padding: 32px;
      background: linear-gradient(135deg, rgba(226, 0, 122, 0.02) 0%, rgba(247, 148, 29, 0.02) 100%);
    }

    .migration-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ===== PO SECTIONS ===== */
    .po-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .po-section label {
      font-size: 14px;
      font-weight: 700;
      color: var(--celcom-text);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .po-display {
      padding: 18px 24px;
      border-radius: 14px;
      font-family: 'Courier New', monospace;
      font-size: 18px;
      font-weight: 800;
      text-align: center;
      letter-spacing: 1.5px;
      transition: all 0.3s ease;
    }

    .po-display.current {
      background: linear-gradient(135deg, rgba(226, 0, 122, 0.08) 0%, rgba(247, 148, 29, 0.08) 100%);
      border: 3px solid var(--celcom-primary);
      color: var(--celcom-text);
      box-shadow: 0 4px 20px rgba(226, 0, 122, 0.15);
    }

    .po-input {
      padding: 18px 24px;
      border: 3px solid #e8e8e8;
      border-radius: 14px;
      font-family: 'Courier New', monospace;
      font-size: 18px;
      font-weight: 700;
      text-align: center;
      letter-spacing: 1.5px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
      background: #fafafa;
    }

    .po-input:focus {
      border-color: var(--celcom-primary);
      background: white;
      box-shadow: 0 0 0 4px rgba(226, 0, 122, 0.1);
      transform: translateY(-1px);
    }

    .po-input.error {
      border-color: #f44336;
      background: #fff5f5;
      box-shadow: 0 0 0 4px rgba(244, 67, 54, 0.1);
    }

    .error-text {
      color: #f44336;
      font-size: 13px;
      font-weight: 600;
      margin-top: 6px;
      text-align: center;
    }

    /* ===== CONFIRMATION MESSAGE ===== */
    .confirmation-message {
      background: linear-gradient(135deg, rgba(59, 181, 74, 0.08) 0%, rgba(76, 175, 80, 0.08) 100%);
      border: 3px solid #4caf50;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(76, 175, 80, 0.15);
      animation: slideIn 0.4s ease-out;
    }

    .migration-summary {
      font-size: 20px;
      font-weight: 800;
      color: var(--celcom-text);
      margin-bottom: 16px;
      font-family: 'Courier New', monospace;
      letter-spacing: 1px;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 10px;
      border: 2px solid rgba(76, 175, 80, 0.2);
    }

    .confirmation-message p {
      margin: 12px 0;
      font-size: 14px;
      color: #555;
      line-height: 1.6;
    }

    .confirm-question {
      font-weight: 700;
      color: var(--celcom-text);
      font-size: 16px !important;
      margin-top: 20px !important;
      padding: 12px;
      background: rgba(76, 175, 80, 0.1);
      border-radius: 8px;
    }

    /* ===== ACTIONS ===== */
    .dialog-actions {
      padding: 24px 32px 32px;
      display: flex;
      gap: 16px;
      justify-content: flex-end;
      background: white;
      border-top: 1px solid rgba(226, 0, 122, 0.1);
    }

    .btn-cancel {
      padding: 14px 28px;
      border: 2px solid #888;
      background: transparent;
      color: #888;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-cancel:hover:not(:disabled) {
      background: #888;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(136, 136, 136, 0.3);
    }

    .btn-cancel:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-migrate {
      padding: 14px 28px;
      background: linear-gradient(135deg, #6C2DC7 0%, #8E24AA 100%);
      border: none;
      color: white;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 6px 20px rgba(108, 45, 199, 0.4);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .btn-migrate:hover:not(:disabled) {
      background: linear-gradient(135deg, #5A1FA8 0%, #7B1FA2 100%);
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(108, 45, 199, 0.5);
    }

    .btn-migrate:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
      box-shadow: 0 3px 10px rgba(108, 45, 199, 0.3);
      background: linear-gradient(135deg, #9E9E9E 0%, #757575 100%);
    }

    /* ===== LOADING STATES ===== */
    .loading-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.96);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .loading-content {
      text-align: center;
      color: var(--celcom-text);
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(226, 0, 122, 0.2);
      border-top: 4px solid var(--celcom-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    .loading-content p {
      margin: 0;
      font-weight: 700;
      font-size: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 600px) {
      .migration-dialog {
        width: 95vw;
        margin: 20px auto;
        border-radius: 16px;
      }

      .dialog-header {
        padding: 24px 20px;
      }

      .dialog-content {
        padding: 24px 20px;
      }

      .dialog-actions {
        padding: 20px;
        flex-direction: column-reverse;
        gap: 12px;
      }

      .btn-cancel,
      .btn-migrate {
        width: 100%;
        justify-content: center;
        padding: 16px;
      }

      .po-display,
      .po-input {
        font-size: 16px;
        padding: 16px 20px;
      }

      .migration-summary {
        font-size: 18px;
      }
    }

    /* ===== ACCESSIBILITY ===== */
    @media (prefers-reduced-motion: reduce) {
      .migration-dialog,
      .btn-cancel,
      .btn-migrate,
      .po-input,
      .po-display,
      .confirmation-message {
        transition: none;
        animation: none;
      }
      
      .loading-spinner,
      .spinner {
        animation: none;
      }
    }

    /* ===== FOCUS STATES ===== */
    .btn-cancel:focus,
    .btn-migrate:focus,
    .po-input:focus {
      outline: 3px solid rgba(226, 0, 122, 0.3);
      outline-offset: 2px;
    }
  `]
})
export class PoMigrationModalComponent implements OnInit {
  migrationForm: FormGroup;
  isLoading = false;

  // PO Number format pattern (PO-YYYY-NNN)
  private readonly PO_PATTERN = /^PO-\d{4}-\d{3}$/;

  constructor(
    private fb: FormBuilder,
    private assetPoService: AssetPoService,
    private dialogRef: MatDialogRef<PoMigrationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MigrationDialogData
  ) {
    this.migrationForm = this.createForm();
  }

  ngOnInit(): void {
    console.log('🔄 PO Migration modal opened for:', this.data.currentPoNumber);
  }

  private createForm(): FormGroup {
    return this.fb.group({
      newPoNumber: ['', [
        Validators.required,
        Validators.pattern(this.PO_PATTERN)
      ]]
    }, {
      validators: [this.differentFromCurrentValidator]
    });
  }

  // Custom validator to ensure new PO is different from current
  private differentFromCurrentValidator = (control: AbstractControl): {[key: string]: any} | null => {
    const newPo = control.get('newPoNumber')?.value;
    
    if (newPo && newPo.trim() === this.data.currentPoNumber.trim()) {
      return { 'sameAsOld': true };
    }
    
    return null;
  };

  onMigrate(): void {
    if (this.migrationForm.invalid || this.isLoading) {
      return;
    }

    const newPoNumber = this.migrationForm.get('newPoNumber')?.value;
    
    this.isLoading = true;

    this.assetPoService.migratePoNumber(this.data.currentPoNumber, newPoNumber)
      .subscribe({
        next: (response) => {
          console.log('✅ Migration successful:', response);
          
          // Close dialog with success result
          this.dialogRef.close({
            success: true,
            response: response
          });
        },
        error: (error) => {
          console.error('❌ Migration failed:', error);
          this.isLoading = false;
          // Error toast is already shown by the service
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close({
      success: false,
      cancelled: true
    });
  }
} 