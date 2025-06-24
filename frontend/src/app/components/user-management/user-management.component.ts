import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, map, finalize, startWith } from 'rxjs/operators';
import { LayoutComponent, NavigationItem } from '../shared/layout/layout.component';
import { UserService } from '../../services/user.service';
import { 
  User, 
  UserFilter, 
  USER_STATUS, 
  USER_TYPE, 
  USER_TYPE_LABELS,
  USER_CONFIG, 
  USER_MESSAGES,
  PageResponse,
  UserHelper
} from '../../models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LayoutComponent],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit, OnDestroy {
  
  // Navigation
  navigationItems: NavigationItem[] = [];

  // Form and UI State
  userForm!: FormGroup;
  searchForm!: FormGroup;
  isEditMode = false;
  editingUserId: number | null = null;
  isFormVisible = false;
  isTableLoading = false;  // For table/search loading
  isFormSubmitting = false; // For form submission loading
  isDeleting = false;
  deleteUserId: number | null = null;

  // Dynamic User Type Selection State
  selectedUserCategory: 'Employee' | 'Office Asset' = 'Employee';
  selectedEmployeeType: 'Permanent' | 'Contractor' = 'Permanent';

  // Message State
  showSuccessMessage = false;
  showErrorMessage = false;
  successMessage = '';
  errorMessage = '';

  // Data
  users: User[] = [];
  paginatedUsers: User[] = [];
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = USER_CONFIG.PAGE_SIZE;

  // Filter State
  currentFilters: UserFilter = {
    search: '',
    department: '',
    status: USER_STATUS.ALL,
    userType: USER_TYPE.ALL
  };

  // Constants for templates
  USER_STATUS = USER_STATUS;
  USER_TYPE = USER_TYPE;
  USER_TYPE_LABELS = USER_TYPE_LABELS;

  // Math helper for template
  Math = Math;

  // Component State Management
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.initializeNavigation();
    this.setupSearchAndFiltering();
    this.loadUsers();
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
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

  onNavigationClick(item: NavigationItem): void {
    console.log('Navigation clicked:', item);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize reactive forms with dynamic user type logic
   */
  private initializeForms(): void {
    // Main user form with conditional validation
    this.userForm = this.fb.group({
      fullNameOrOfficeName: [
        '', 
        [
          Validators.required, 
          Validators.minLength(USER_CONFIG.MIN_NAME_LENGTH),
          Validators.maxLength(100)
        ]
      ],
      employeeCode: [
        '',
        [
          Validators.required,
          Validators.maxLength(50)
        ]
      ],
      department: [
        '', 
        [
          Validators.maxLength(50)
        ]
      ],
      designation: [
        '', 
        [
          Validators.minLength(2),
          Validators.maxLength(100)
        ]
      ],
      email: [
        '', 
        [
          Validators.email,
          Validators.maxLength(100)
        ]
      ],
      location: [
        '', 
        [
          Validators.maxLength(100)
        ]
      ],
      country: [
        '', 
        [
          Validators.maxLength(50)
        ]
      ],
      city: [
        '', 
        [
          Validators.maxLength(50)
        ]
      ],
      status: [USER_STATUS.ACTIVE, Validators.required]
    });

    // Search form
    this.searchForm = this.fb.group({
      search: [''],
      department: [''],
      status: [USER_STATUS.ALL],
      userType: [USER_TYPE.ALL],
      country: [''],
      city: [''],
      employeeCode: ['']
    });

    // Watch for user type changes to update validation
    this.setupDynamicValidation();
  }

  /**
   * Setup dynamic validation based on user type selection
   */
  private setupDynamicValidation(): void {
    // Watch for changes in user category and employee type
    const updateValidation = () => {
      const emailControl = this.userForm.get('email');
      const employeeCodeControl = this.userForm.get('employeeCode');
      
      if (emailControl) {
        // Clear existing validators
        emailControl.clearValidators();
        
        // Determine final user type
        const finalUserType = this.getFinalUserType();
        
        // Set email validation based on user type
        if (finalUserType === 'Permanent') {
          emailControl.setValidators([Validators.required, Validators.email, Validators.maxLength(100)]);
        } else {
          emailControl.setValidators([Validators.email, Validators.maxLength(100)]);
        }
        
        // Update validity
        emailControl.updateValueAndValidity();
      }

      // Handle Employee Code field for Office Assets
      if (employeeCodeControl) {
        if (this.selectedUserCategory === 'Office Asset') {
          // Disable the field for Office Assets
          employeeCodeControl.disable();
          // Clear the required validator for Office Assets
          employeeCodeControl.clearValidators();
          employeeCodeControl.setValidators([Validators.maxLength(50)]);
        } else {
          // Enable the field for Employees
          employeeCodeControl.enable();
          // Set required validator for Employees
          employeeCodeControl.setValidators([Validators.required, Validators.maxLength(50)]);
        }
        employeeCodeControl.updateValueAndValidity();
      }
    };

    // Initial validation setup
    updateValidation();
  }

  /**
   * Handle user category change (Employee vs Office Asset)
   */
  onUserCategoryChange(category: 'Employee' | 'Office Asset'): void {
    this.selectedUserCategory = category;
    if (category === 'Office Asset') {
      this.selectedEmployeeType = 'Permanent'; // Reset to default
    }
    this.setupDynamicValidation();
  }

  /**
   * Handle employee type change (Permanent vs Contractor)
   */
  onEmployeeTypeChange(type: 'Permanent' | 'Contractor'): void {
    this.selectedEmployeeType = type;
    this.setupDynamicValidation();
  }

  /**
   * Get the final user type for backend submission
   */
  getFinalUserType(): 'Permanent' | 'Contractor' | 'OfficeAsset' {
    if (this.selectedUserCategory === 'Office Asset') {
      return 'OfficeAsset';
    }
    return this.selectedEmployeeType;
  }

  /**
   * Check if email field should be shown as required
   */
  isEmailRequired(): boolean {
    return this.getFinalUserType() === 'Permanent';
  }

  /**
   * Setup search and filtering with debounce
   */
  private setupSearchAndFiltering(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(filters => {
        this.currentFilters = filters;
        this.currentPage = 0;
        this.loadUsers();
      });
  }

  /**
   * Load users from backend
   */
  loadUsers(): void {
    this.isTableLoading = true;
    
    this.userService.getAllUsers(this.currentPage, this.pageSize, this.currentFilters)
      .pipe(
        finalize(() => this.isTableLoading = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => this.handleUserResponse(response),
        error: (error) => {
          console.error('Failed to load users:', error);
          this.showError('Failed to load users. Please check your connection and try again.');
        }
      });
  }

  /**
   * Handle user response from backend
   */
  private handleUserResponse(response: PageResponse<User>): void {
      this.users = response.content;
      this.paginatedUsers = response.content;
    this.currentPage = response.page;
    this.totalPages = response.totalPages;
      this.totalElements = response.totalElements;
    this.cdr.detectChanges();
  }

  /**
   * Show add user form
   */
  showAddForm(): void {
    this.isEditMode = false;
    this.editingUserId = null;
    this.selectedUserCategory = 'Employee';
    this.selectedEmployeeType = 'Permanent';
    this.resetForm();
    this.isFormVisible = true;
    this.setupDynamicValidation();
  }

  /**
   * Show edit user form
   */
  showEditForm(user: User): void {
    this.isEditMode = true;
    this.editingUserId = user.id!;
    this.isFormVisible = true;
    
    // Set user category and type based on existing user
    if (user.userType === 'OfficeAsset') {
      this.selectedUserCategory = 'Office Asset';
      this.selectedEmployeeType = 'Permanent';
    } else {
      this.selectedUserCategory = 'Employee';
      this.selectedEmployeeType = user.userType as 'Permanent' | 'Contractor';
    }
    
    // Populate form
    this.userForm.patchValue({
      fullNameOrOfficeName: user.fullNameOrOfficeName,
      employeeCode: user.employeeCode,
      department: user.department || '',
      designation: user.designation || '',
      email: user.email || '',
      location: user.location || '',
      country: user.country || '',
      city: user.city || '',
      status: user.status
    });
    
    this.setupDynamicValidation();
  }

  /**
   * Hide form
   */
  hideForm(): void {
    this.isFormVisible = false;
    this.isEditMode = false;
    this.editingUserId = null;
    this.resetForm();
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.userForm.reset({
      fullNameOrOfficeName: '',
      employeeCode: '',
      department: '',
      designation: '',
      email: '',
      location: '',
      country: '',
      city: '',
      status: USER_STATUS.ACTIVE
    });
    this.userForm.markAsUntouched();
    this.userForm.markAsPristine();
  }

  /**
   * Submit form (create or update)
   */
  onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isFormSubmitting = true;
    const formValue = this.userForm.value;
      
    // Prepare user data with proper type mapping
    const userData: Partial<User> = {
      ...formValue,
      userType: this.getFinalUserType(),
      isOfficeAsset: this.selectedUserCategory === 'Office Asset'
      };
      
      if (this.isEditMode && this.editingUserId) {
        this.updateUser(this.editingUserId, userData);
      } else {
        this.createUser(userData);
    }
  }

  /**
   * Create new user
   */
  private createUser(userData: Partial<User>): void {
    this.userService.createUser(userData)
      .pipe(
        finalize(() => this.isFormSubmitting = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (user) => {
          this.showSuccess(USER_MESSAGES.SUCCESS.CREATE);
          this.hideForm();
          this.loadUsers();
        },
        error: (error) => {
          console.error('Failed to create user:', error);
          this.showError('Failed to create user. Please try again.');
        }
      });
  }

  /**
   * Update existing user
   */
  private updateUser(id: number, userData: Partial<User>): void {
    this.userService.updateUser(id, userData)
      .pipe(
        finalize(() => this.isFormSubmitting = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (user) => {
          this.showSuccess(USER_MESSAGES.SUCCESS.UPDATE);
          this.hideForm();
          this.loadUsers();
        },
        error: (error) => {
          console.error('Failed to update user:', error);
          this.showError('Failed to update user. Please try again.');
        }
      });
  }

  /**
   * Show delete confirmation
   */
  showDeleteConfirmation(user: User): void {
    this.deleteUserId = user.id!;
  }

  /**
   * Cancel delete operation
   */
  cancelDelete(): void {
    this.deleteUserId = null;
  }

  /**
   * Confirm delete user
   */
  confirmDelete(): void {
    if (this.deleteUserId) {
      this.isDeleting = true;
      
      this.userService.deleteUser(this.deleteUserId)
        .pipe(
          finalize(() => {
            this.isDeleting = false;
            this.deleteUserId = null;
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: () => {
            this.showSuccess(USER_MESSAGES.SUCCESS.DELETE);
            this.loadUsers();
          },
          error: (error) => {
            console.error('Failed to delete user:', error);
            this.showError('Failed to delete user. Please try again.');
          }
        });
    }
  }

  /**
   * Handle page change
   */
  onPageChange(page: number): void {
      this.currentPage = page;
      this.loadUsers();
  }

  /**
   * Get array of page numbers for pagination
   */
  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    const control = this.userForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['email']) return 'Please enter a valid email address';
      if (control.errors['minlength']) return `${fieldName} is too short`;
      if (control.errors['maxlength']) return `${fieldName} is too long`;
    }
    return '';
  }

  /**
   * Check if field has error
   */
  hasFieldError(fieldName: string): boolean {
    const control = this.userForm.get(fieldName);
    return !!(control?.errors && control.touched);
  }

  /**
   * Get user type display text
   */
  getUserTypeDisplay(user: User): string {
    const labels: { [key: string]: string } = {
      'Permanent': 'Permanent Employee',
      'Contractor': 'Contractor', 
      'OfficeAsset': 'Office Asset'
    };
    
    return labels[user.userType] || user.userType || 'Unknown';
  }

  /**
   * Get status badge CSS class
   */
  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Get user to delete
   */
  getUserToDelete(): User | null {
    if (!this.deleteUserId) return null;
    return this.users.find(user => user.id === this.deleteUserId) || null;
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessMessage = true;
    this.showErrorMessage = false;
    
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 5000);
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.errorMessage = message;
    this.showErrorMessage = true;
    this.showSuccessMessage = false;
    
    setTimeout(() => {
      this.showErrorMessage = false;
    }, 5000);
  }

  /**
   * Get total user count
   */
  getTotalUserCount(): number {
    return this.totalElements;
  }

  /**
   * Get permanent employee count
   */
  getPermanentUserCount(): number {
    return this.users.filter(user => user.userType === 'Permanent').length;
  }

  /**
   * Get contractor count
   */
  getContractorUserCount(): number {
    return this.users.filter(user => user.userType === 'Contractor').length;
  }

  /**
   * Get office asset count
   */
  getOfficeAssetUserCount(): number {
    return this.users.filter(user => user.userType === 'OfficeAsset').length;
  }

  /**
   * Clear all filters
   */
  clearUserFilters(): void {
    this.searchForm.reset({
      search: '',
      department: '',
      status: USER_STATUS.ALL,
      userType: USER_TYPE.ALL,
      country: '',
      city: '',
      employeeCode: ''
    });
  }

  /**
   * TrackBy function for user list optimization
   */
  trackByUserId(index: number, user: User): number {
    return user.id || index;
  }

  /**
   * Refresh the user list and optionally clear filters
   */
  refreshUserList(): void {
    this.loadUsers();
  }

  /**
   * Clear all filters and refresh the user list
   */
  clearFiltersAndRefresh(): void {
    this.clearUserFilters();
    this.loadUsers();
  }
} 