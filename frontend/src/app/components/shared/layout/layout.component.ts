import { Component, OnInit, OnDestroy, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LayoutService } from '../../../services/layout.service';
import { Subject, takeUntil } from 'rxjs';

export interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Main Layout Container -->
    <div class="min-h-screen bg-celcom-background flex">
      <!-- Sidebar -->
      <aside 
        class="sidebar"
        [class.sidebar-collapsed]="layoutService.isSidebarCollapsed()"
        [class.sidebar-mobile-open]="layoutService.isMobileMenuOpen()">
        
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <div class="flex items-center space-x-3" *ngIf="!layoutService.isSidebarCollapsed()">
            <div class="w-8 h-8 bg-celcom-gradient-light rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-celcom-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-white">Asset Manager</h2>
              <p class="text-xs text-white/70">Celcom Solutions</p>
            </div>
          </div>
          
          <!-- Collapsed Logo -->
          <div class="flex justify-center" *ngIf="layoutService.isSidebarCollapsed()">
            <div class="w-8 h-8 bg-celcom-gradient-light rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-celcom-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="sidebar-nav">
          <div class="space-y-1">
            <a 
              *ngFor="let item of navigationItems" 
              [routerLink]="item.route"
              routerLinkActive="sidebar-link-active"
              class="sidebar-link"
              (click)="onNavigationClick(item)">
              
              <div class="sidebar-link-icon" [innerHTML]="item.icon"></div>
              
              <span class="sidebar-link-text" *ngIf="!layoutService.isSidebarCollapsed()">
                {{ item.label }}
              </span>
              
              <span 
                *ngIf="item.badge && !layoutService.isSidebarCollapsed()" 
                class="sidebar-badge">
                {{ item.badge }}
              </span>
            </a>
          </div>
        </nav>

        <!-- Sidebar Toggle Button -->
        <div class="sidebar-footer">
          <button 
            (click)="toggleSidebar()"
            class="sidebar-toggle-btn"
            [title]="layoutService.isSidebarCollapsed() ? 'Expand Sidebar' : 'Collapse Sidebar'">
            <svg 
              class="w-5 h-5 transition-transform duration-200"
              [class.rotate-180]="layoutService.isSidebarCollapsed()"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
        </div>
      </aside>

      <!-- Mobile Overlay -->
      <div 
        *ngIf="layoutService.isMobileMenuOpen()" 
        class="sidebar-overlay"
        (click)="closeMobileMenu()">
      </div>

      <!-- Main Content Area -->
      <main class="main-content" [class.main-content-shifted]="!layoutService.isSidebarCollapsed()">
        <!-- Top Header -->
        <header class="main-header">
          <div class="flex items-center justify-between">
            <!-- Mobile Menu Button -->
            <button 
              class="mobile-menu-btn lg:hidden"
              (click)="toggleMobileMenu()">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>

            <!-- Page Title -->
            <div class="flex items-center space-x-4">
              <h1 class="text-2xl font-bold text-celcom-text bg-gradient-to-r from-celcom-primary to-celcom-secondary bg-clip-text text-transparent">
                {{ pageTitle }}
              </h1>
            </div>

            <!-- Header Actions -->
            <div class="flex items-center space-x-4">
              <ng-content select="[slot=header-actions]"></ng-content>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <div class="main-content-body">
          <ng-content></ng-content>
        </div>
      </main>

      <!-- Left Drawer -->
      <div 
        class="drawer"
        [class.drawer-open]="layoutService.drawerConfig().isOpen"
        [style.width]="layoutService.drawerConfig().width">
        
        <!-- Drawer Header -->
        <div class="drawer-header">
          <h3 class="drawer-title">{{ layoutService.drawerConfig().title }}</h3>
          <button 
            (click)="closeDrawer()"
            class="drawer-close-btn">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Drawer Content -->
        <div class="drawer-content">
          <ng-content select="[slot=drawer-content]"></ng-content>
        </div>
      </div>

      <!-- Drawer Overlay -->
      <div 
        *ngIf="layoutService.drawerConfig().isOpen" 
        class="drawer-overlay"
        (click)="closeDrawer()">
      </div>
    </div>

    <!-- Toast Notifications -->
    <div 
      *ngIf="layoutService.showToast()" 
      class="toast"
      [class.toast-success]="layoutService.toastType() === 'success'"
      [class.toast-error]="layoutService.toastType() === 'error'"
      [class.toast-info]="layoutService.toastType() === 'info'">
      
      <div class="toast-icon">
        <svg *ngIf="layoutService.toastType() === 'success'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <svg *ngIf="layoutService.toastType() === 'error'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <svg *ngIf="layoutService.toastType() === 'info'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      
      <span class="toast-message">{{ layoutService.toastMessage() }}</span>
      
      <button 
        (click)="hideToast()"
        class="toast-close-btn">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `,
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, OnDestroy {
  @Input() pageTitle: string = '';
  @Input() navigationItems: NavigationItem[] = [];
  @Output() navigationClick = new EventEmitter<NavigationItem>();

  private destroy$ = new Subject<void>();
  
  layoutService = inject(LayoutService);
  private router = inject(Router);

  ngOnInit(): void {
    // Set default navigation items if none provided
    if (this.navigationItems.length === 0) {
      this.navigationItems = this.getDefaultNavigationItems();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }

  toggleMobileMenu(): void {
    this.layoutService.toggleMobileMenu();
  }

  closeMobileMenu(): void {
    this.layoutService.setMobileMenuOpen(false);
  }

  closeDrawer(): void {
    this.layoutService.closeDrawer();
  }

  hideToast(): void {
    this.layoutService.hideToast();
  }

  onNavigationClick(item: NavigationItem): void {
    this.navigationClick.emit(item);
    // Close mobile menu on navigation
    if (this.layoutService.isMobile()) {
      this.closeMobileMenu();
    }
  }

  private getDefaultNavigationItems(): NavigationItem[] {
    return [
      {
        label: 'Dashboard',
        route: '/dashboard',
        icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"></path></svg>'
      },
      {
        label: 'Assets',
        route: '/assets',
        icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>'
      },
      {
        label: 'Asset Models',
        route: '/asset-models',
        icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>'
      },
      {
        label: 'Asset POs',
        route: '/asset-pos',
        icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>'
      },
      {
        label: 'Vendors',
        route: '/vendors',
        icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>'
      },
      {
        label: 'OS & Versions',
        route: '/os-versions',
        icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>'
      },
      {
        label: 'Users',
        route: '/users',
        icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path></svg>'
      }
    ];
  }
} 