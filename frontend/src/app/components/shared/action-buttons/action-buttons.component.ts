import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActionButtonConfig {
  showEdit?: boolean;
  showDelete?: boolean;
  editTooltip?: string;
  deleteTooltip?: string;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
}

@Component({
  selector: 'app-action-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center space-x-2">
      <!-- Edit Button -->
      <button
        *ngIf="config.showEdit !== false"
        type="button"
        (click)="onEdit()"
        [disabled]="config.editDisabled"
        class="action-btn action-btn-edit"
        [title]="config.editTooltip || 'Edit'">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      </button>
      
      <!-- Delete Button -->
      <button
        *ngIf="config.showDelete !== false"
        type="button"
        (click)="onDelete()"
        [disabled]="config.deleteDisabled"
        class="action-btn action-btn-delete"
        [title]="config.deleteTooltip || 'Delete'">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
  `,
  styleUrls: ['./action-buttons.component.css']
})
export class ActionButtonsComponent {
  @Input() config: ActionButtonConfig = {};
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  onEdit(): void {
    if (!this.config.editDisabled) {
      this.edit.emit();
    }
  }

  onDelete(): void {
    if (!this.config.deleteDisabled) {
      this.delete.emit();
    }
  }
} 