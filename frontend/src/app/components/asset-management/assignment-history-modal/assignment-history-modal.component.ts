import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { AssetService } from '../../../services/asset.service';
import { AssetAssignmentHistoryResponse, AssetUserAssignment, User } from '../../../models/asset.model';

@Component({
  selector: 'app-assignment-history-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assignment-history-modal.component.html',
  styleUrls: ['./assignment-history-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignmentHistoryModalComponent implements OnInit, OnDestroy {
  // ✅ Input properties for asset details
  @Input({ required: true }) assetId!: number;
  @Input({ required: true }) assetName!: string;
  @Input({ required: true }) assetSerial!: string;
  @Input() isVisible = false;

  // ✅ Output events for parent communication
  @Output() closeModal = new EventEmitter<void>();
  @Output() modalClosed = new EventEmitter<void>();

  // ✅ Math helper for template
  Math = Math;

  // ✅ Reactive state using signals
  loading = signal(false);
  error = signal<string | null>(null);
  assignmentHistory = signal<AssetUserAssignment[]>([]);
  users = signal<User[]>([]);
  
  // ✅ Pagination state
  currentPage = signal(0);
  pageSize = signal(10);
  totalElements = signal(0);
  totalPages = signal(0);

  // ✅ Computed properties
  totalAssignments = computed(() => this.assignmentHistory().length);
  hasHistory = computed(() => this.assignmentHistory().length > 0);
  hasError = computed(() => !!this.error());
  currentAssignment = computed(() => 
    this.assignmentHistory().find(assignment => !assignment.unassignedDate)
  );
  pastAssignments = computed(() => 
    this.assignmentHistory().filter(assignment => !!assignment.unassignedDate)
  );
  
  // ✅ Pagination computed properties
  hasNextPage = computed(() => this.currentPage() < this.totalPages() - 1);
  hasPreviousPage = computed(() => this.currentPage() > 0);

  // ✅ Private subjects for cleanup
  private destroy$ = new Subject<void>();
  private retrySubject = new BehaviorSubject<boolean>(false);

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    if (this.assetId && this.isVisible) {
      this.loadAssignmentHistory();
      this.loadUsers();
    }

    // ✅ Setup keyboard event listener for ESC key
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * ✅ Load asset assignment history from backend with pagination
   */
  loadAssignmentHistory(page = 0): void {
    if (!this.assetId) {
      this.error.set('Invalid asset ID');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    console.log(`📋 Loading assignment history for asset ID: ${this.assetId}, page: ${page}`);
    console.log(`🔗 API URL will be: /api/asset-assignment-history/asset/${this.assetId}?page=${page}`);

    this.assetService.getAssetAssignmentHistory(this.assetId, page, this.pageSize(), 'assignedDate', 'DESC')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false)),
        catchError((error) => {
          console.error('❌ Error loading assignment history:', error);
          console.error('❌ Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url
          });
          
          let errorMessage = 'Failed to load assignment history';
          if (error.status === 404) {
            errorMessage = 'Asset not found or no assignment history available';
          } else if (error.status === 403) {
            errorMessage = 'Unauthorized to view assignment history';
          } else if (error.status === 0) {
            errorMessage = 'Network error. Please check your connection.';
          }
          
          this.error.set(errorMessage);
          return of({
            content: [],
            history: [],
            totalElements: 0,
            totalPages: 0,
            currentPage: 0,
            page: 0,
            size: this.pageSize(),
            message: 'No assignment history found'
          } as AssetAssignmentHistoryResponse);
        })
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Assignment history loaded:', response);
          console.log('📊 History details:', {
            totalElements: response.totalElements,
            totalPages: response.totalPages,
            currentPage: response.currentPage || response.page,
            contentLength: response.content?.length || 0,
            historyLength: response.history?.length || 0
          });
          
          // Use content array if available, fallback to history array
          const assignments = response.content || response.history || [];
          
          // ✅ Sort by date descending (newest first)
          const sortedAssignments = assignments.sort((a, b) => 
            new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime()
          );
          
          this.assignmentHistory.set(sortedAssignments);
          this.totalElements.set(response.totalElements || 0);
          this.totalPages.set(response.totalPages || 0);
          this.currentPage.set(response.currentPage || response.page || 0);
          
          if (assignments.length === 0 && page === 0) {
            console.warn('⚠️ No assignment history found for asset ID:', this.assetId);
            console.log('💡 This could mean:');
            console.log('   1. No assignments have been recorded for this asset');
            console.log('   2. Backend endpoint is not returning history data');
            console.log('   3. Database table is empty for this asset');
          }
        }
      });
  }

  /**
   * ✅ Load users for displaying user names
   */
  private loadUsers(): void {
    this.assetService.getUsers()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.warn('⚠️ Could not load users for display names:', error);
          return of([]); // Continue without user names
        })
      )
      .subscribe({
        next: (users) => {
          this.users.set(users);
        }
      });
  }

  /**
   * ✅ Get user name by ID for display
   */
  getUserName(userId: number): string {
    const user = this.users().find(u => u.id === userId);
    return user ? user.name : `User ${userId}`;
  }

  /**
   * ✅ Format date for user-friendly display
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return 'Invalid Date';
    }
  }

  /**
   * ✅ Format assignment date for timeline display
   */
  formatAssignmentDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return 'Invalid Date';
    }
  }

  /**
   * ✅ Calculate assignment duration
   */
  calculateDuration(assignment: AssetUserAssignment): string {
    try {
      const startDate = new Date(assignment.assignedDate);
      const endDate = assignment.unassignedDate ? new Date(assignment.unassignedDate) : new Date();
      
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Less than a day';
      } else if (diffDays < 30) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        const remainingDays = diffDays % 30;
        return `${months} month${months > 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : ''}`;
      } else {
        const years = Math.floor(diffDays / 365);
        const remainingDays = diffDays % 365;
        const remainingMonths = Math.floor(remainingDays / 30);
        return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
      }
    } catch (error) {
      console.warn('Error calculating duration:', error);
      return 'Unknown';
    }
  }

  /**
   * ✅ Check if assignment is currently active
   */
  isCurrentAssignment(assignment: AssetUserAssignment): boolean {
    return !assignment.unassignedDate;
  }

  /**
   * ✅ Get assignment status badge class
   */
  getAssignmentBadgeClass(assignment: AssetUserAssignment): string {
    if (this.isCurrentAssignment(assignment)) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else {
      return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }

  /**
   * ✅ Get user initials for avatar
   */
  getUserInitials(userId: number): string {
    const user = this.users().find(u => u.id === userId);
    if (user && user.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      } else {
        return names[0].substring(0, 2).toUpperCase();
      }
    }
    return 'U';
  }

  /**
   * ✅ Pagination methods
   */
  nextPage(): void {
    if (this.hasNextPage()) {
      this.loadAssignmentHistory(this.currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.loadAssignmentHistory(this.currentPage() - 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.loadAssignmentHistory(page);
    }
  }

  /**
   * ✅ Export assignment history
   */
  exportHistory(): void {
    const assignments = this.assignmentHistory();
    if (assignments.length === 0) {
      return;
    }

    const csvContent = [
      ['Asset ID', 'Asset Name', 'User ID', 'User Name', 'Assigned Date', 'Unassigned Date', 'Duration', 'Status', 'Remarks'],
      ...assignments.map(assignment => [
        this.assetId.toString(),
        this.assetName,
        assignment.userId.toString(),
        this.getUserName(assignment.userId),
        this.formatDate(assignment.assignedDate),
        assignment.unassignedDate ? this.formatDate(assignment.unassignedDate) : 'Current',
        this.calculateDuration(assignment),
        this.isCurrentAssignment(assignment) ? 'Active' : 'Completed',
        assignment.remarks || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asset-${this.assetId}-assignment-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * ✅ Modal close methods
   */
  close(): void {
    this.closeModal.emit();
    this.modalClosed.emit();
  }

  onCloseModal(): void {
    this.close();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isVisible) {
      this.close();
    }
  }

  /**
   * ✅ Retry loading on error
   */
  retryLoading(): void {
    this.loadAssignmentHistory(this.currentPage());
  }

  /**
   * ✅ Track by function for performance
   */
  trackByAssignmentItem(index: number, item: AssetUserAssignment): string {
    return `${item.id || index}-${item.userId}-${item.assignedDate}`;
  }
} 