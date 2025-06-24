import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface ModalConfig {
  title: string;
  fields: ModalField[];
  submitText?: string;
  cancelText?: string;
}

export interface ModalField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: { value: any; label: string }[];
}

@Component({
  selector: 'app-add-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-modal.component.html',
  styleUrl: './add-modal.component.css'
})
export class AddModalComponent {
  @Input() isOpen = false;
  @Input() config: ModalConfig = { title: '', fields: [] };
  @Input() isSubmitting = false;
  @Input() initialValues: any = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<any>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(): void {
    if (this.config.fields.length > 0) {
      this.buildForm();
    }
  }

  private buildForm(): void {
    const formControls: { [key: string]: any } = {};
    
    this.config.fields.forEach(field => {
      const validators = field.required ? [Validators.required] : [];
      const initialValue = this.initialValues ? (this.initialValues[field.name] || '') : '';
      formControls[field.name] = [initialValue, validators];
    });

    this.form = this.fb.group(formControls);
  }

  onSubmit(): void {
    if (this.form.valid && !this.isSubmitting) {
      this.submitForm.emit(this.form.value);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }

  onClose(): void {
    this.form.reset();
    this.closeModal.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        const fieldConfig = this.config.fields.find(f => f.name === fieldName);
        return `${fieldConfig?.label || fieldName} is required`;
      }
    }
    return '';
  }
} 