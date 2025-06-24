import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { AssetService } from '../../../services/asset.service';
import { AssetStatusHistoryDTO, User } from '../../../models/asset.model';

@Component({
  selector: 'app-status-history-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-history-modal.component.html',
  styleUrls: ['./status-history-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusHistoryModalComponent implements OnInit, OnDestroy {
  // ✅ Input properties for asset details
  @Input({ required: true }) assetId!: number;
  @Input({ required: true }) assetName!: string;
  @Input({ required: true }) assetSerial!: string;
  @Input() isVisible = false;

  // ✅ Output events for parent communication
  @Output() closeModal = new EventEmitter<void>();
  @Output() modalClosed = new EventEmitter<void>();

  // ✅ Reactive state using signals
  loading = signal(false);
  error = signal<string | null>(null);
  statusHistory = signal<AssetStatusHistoryDTO[]>([]);
  users = signal<User[]>([]);

  // ✅ Computed properties
  totalChanges = computed(() => this.statusHistory().length);
  hasHistory = computed(() => this.statusHistory().length > 0);
  hasError = computed(() => !!this.error());

  // ✅ Private subjects for cleanup
  private destroy$ = new Subject<void>();
  private retrySubject = new BehaviorSubject<boolean>(false);

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    if (this.assetId && this.isVisible) {
      this.loadStatusHistory();
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
   * ✅ Load asset status history from backend
   */
  loadStatusHistory(): void {
    if (!this.assetId) {
      this.error.set('Invalid asset ID');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    console.log(`📋 Loading status history for asset ID: ${this.assetId}`);
    console.log(`🔗 API URL will be: /api/asset-status-histories/asset/${this.assetId}/all`);

    this.assetService.getAssetStatusHistory(this.assetId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false)),
        catchError((error) => {
          console.error('❌ Error loading status history:', error);
          console.error('❌ Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url
          });
          
          let errorMessage = 'Failed to load status history';
          if (error.status === 404) {
            errorMessage = 'Asset not found or no history available';
          } else if (error.status === 403) {
            errorMessage = 'Unauthorized to view asset history';
          } else if (error.status === 0) {
            errorMessage = 'Network error. Please check your connection.';
          }
          
          this.error.set(errorMessage);
          return of([]); // Return empty array to prevent further errors
        })
      )
      .subscribe({
        next: (history) => {
          console.log('✅ Status history loaded:', history);
          console.log('📊 History details:', {
            length: history.length,
            assetId: this.assetId,
            firstItem: history.length > 0 ? history[0] : null,
            allItems: history
          });
          
          // ✅ Sort by date descending (newest first)
          const sortedHistory = history.sort((a, b) => 
            new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime()
          );
          
          this.statusHistory.set(sortedHistory);
          
          if (history.length === 0) {
            console.warn('⚠️ No status history found for asset ID:', this.assetId);
            console.log('💡 This could mean:');
            console.log('   1. No status changes have been recorded for this asset');
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
   * ✅ Format status date for timeline display
   */
  formatStatusDate(dateString: string): string {
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
   * ✅ Calculate duration between status changes
   */
  calculateDuration(entry: AssetStatusHistoryDTO, index: number): string {
    const history = this.statusHistory();
    if (index === history.length - 1) {
      // First status change - calculate from now
      const startDate = new Date(entry.changeDate);
      const endDate = new Date();
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 1) {
        return 'Today';
      } else if (diffDays === 1) {
        return '1 day';
      } else {
        return `${diffDays} days`;
      }
    } else {
      // Calculate duration between this and next status
      const currentDate = new Date(entry.changeDate);
      const nextDate = new Date(history[index + 1].changeDate);
      const diffTime = Math.abs(currentDate.getTime() - nextDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 1) {
        return 'Same day';
      } else if (diffDays === 1) {
        return '1 day';
      } else {
        return `${diffDays} days`;
      }
    }
  }

  /**
   * ✅ Get status history user name
   */
  getStatusHistoryUserName(userId: number): string {
    const user = this.users().find(u => u.id === userId);
    return user ? user.name : `User ${userId}`;
  }

  /**
   * ✅ Get user role for display
   */
  getUserRole(userId: number): string {
    // Mock role since User model doesn't have role property
    return 'Admin';
  }

  /**
   * ✅ Get current user ID (mock implementation)
   */
  getCurrentUserId(): number {
    // This should come from your auth service
    return 1; // Mock current user ID
  }

  /**
   * ✅ Get user initials for avatar
   */
  getStatusUserInitials(userId: number): string {
    const user = this.users().find(u => u.id === userId);
    if (user && user.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      } else {
        return names[0].substring(0, 2).toUpperCase();
      }
    }
    return 'U' + userId.toString().substring(0, 1);
  }

  /**
   * ✅ Calculate total duration across all status changes
   */
  calculateTotalDuration(): string {
    const history = this.statusHistory();
    if (history.length === 0) return '0 days';
    
    const firstDate = new Date(history[history.length - 1].changeDate);
    const lastDate = new Date(history[0].changeDate);
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return 'Same day';
    } else if (diffDays === 1) {
      return '1 day';
    } else if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.ceil(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.ceil(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    }
  }

  /**
   * ✅ Get unique users involved in status changes
   */
  getUniqueUsers(): User[] {
    const history = this.statusHistory();
    const userIds = [...new Set(history.map(entry => entry.changedById))];
    return this.users().filter(user => userIds.includes(user.id));
  }

  /**
   * ✅ Export status history (mock implementation)
   */
  exportHistory(): void {
    const history = this.statusHistory();
    const exportData = {
      assetId: this.assetId,
      assetName: this.assetName,
      assetSerial: this.assetSerial,
      exportDate: new Date().toISOString(),
      statusHistory: history.map(entry => ({
        status: entry.status,
        changeDate: entry.changeDate,
        changedBy: this.getStatusHistoryUserName(entry.changedById),
        remarks: entry.remarks
      }))
    };
    
    console.log('📄 Exporting status history:', exportData);
    
    // Mock file download
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `asset-${this.assetId}-status-history.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  /**
   * ✅ Close modal method called from template
   */
  close(): void {
    this.onCloseModal();
  }

  /**
   * ✅ Get status badge class for styling
   */
  getStatusBadgeClass(status: string): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status.toLowerCase()) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      case 'in repair':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
      case 'broken':
        return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
      case 'ceased':
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
      case 'in stock':
        return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  }

  /**
   * ✅ Handle retry loading
   */
  retryLoading(): void {
    this.loadStatusHistory();
  }

  /**
   * ✅ Handle modal close
   */
  onCloseModal(): void {
    this.closeModal.emit();
    this.modalClosed.emit();
  }

  /**
   * ✅ Handle backdrop click
   */
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCloseModal();
    }
  }

  /**
   * ✅ Handle keyboard events (ESC to close)
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isVisible) {
      this.onCloseModal();
    }
  }

  /**
   * ✅ Track by function for ngFor performance
   */
  trackByHistoryItem(index: number, item: AssetStatusHistoryDTO): string {
    return `${item.changeDate}-${item.status}-${item.changedById}`;
  }
} 