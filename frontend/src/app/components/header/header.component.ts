import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { filter, map } from 'rxjs/operators';
import { TitleService } from '../../services/title.service';

interface NavigationItem {
  label: string;
  route: string;
  icon: string;
}

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  role: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <!-- Fixed Header Band with Vibrant Celcom Branding -->
    <header class="celcom-header">
      <!-- Gradient Background with Glassmorphism -->
      <div class="celcom-header-bg"></div>
      
      <!-- Header Content Container -->
      <div class="celcom-header-container">
        
        <!-- Left Section: Logo -->
        <div class="celcom-header-left">
          <a 
            routerLink="/" 
            class="celcom-logo-container"
            [attr.aria-label]="'Go to Celcom Solutions Dashboard'">
            <img 
              src="https://www.celcomsolutions.com/assets/images/home/header_logo_updated.png"
              alt="Celcom Solutions"
              class="celcom-logo"
              loading="eager">
            <div class="celcom-logo-glow"></div>
          </a>
        </div>

        <!-- Center Section: Dynamic Page Title -->
        <div class="celcom-header-center">
          <div class="celcom-dynamic-title">
            <h1 class="text-2xl font-bold text-white bg-gradient-to-r from-white/90 to-white/70 bg-clip-text text-transparent">
              {{ titleService.currentTitle$ | async }}
            </h1>
          </div>
        </div>

        <!-- Right Section: User Profile Only -->
        <div class="celcom-header-right">
          <!-- User Profile Menu -->
          <div class="celcom-user-profile">
            <button 
              mat-button 
              [matMenuTriggerFor]="userMenu"
              class="celcom-user-btn">
              <div class="celcom-user-avatar">
                <img 
                  [src]="userProfile().avatar" 
                  [alt]="userProfile().name + ' Avatar'"
                  class="celcom-avatar-img">
                <div class="celcom-avatar-status"></div>
              </div>
              <div class="celcom-user-info">
                <span class="celcom-user-name">{{ userProfile().name }}</span>
                <span class="celcom-user-role">{{ userProfile().role }}</span>
              </div>
              <svg class="w-4 h-4 celcom-dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <!-- User Profile Dropdown Menu -->
            <mat-menu #userMenu="matMenu" class="celcom-user-menu">
              <div class="celcom-user-menu-header">
                <div class="celcom-user-menu-avatar">
                  <img 
                    [src]="userProfile().avatar" 
                    [alt]="userProfile().name">
                </div>
                <div class="celcom-user-menu-info">
                  <div class="celcom-user-menu-name">{{ userProfile().name }}</div>
                  <div class="celcom-user-menu-email">{{ userProfile().email }}</div>
                </div>
              </div>
              
              <mat-divider></mat-divider>
              
              <button mat-menu-item class="celcom-menu-item">
                <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <span>My Profile</span>
              </button>
              
              <button mat-menu-item class="celcom-menu-item">
                <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <span>Security Settings</span>
              </button>
              
              <button mat-menu-item class="celcom-menu-item">
                <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"></path>
                </svg>
                <span>Appearance</span>
              </button>
              
              <mat-divider></mat-divider>
              
              <button mat-menu-item class="celcom-menu-item celcom-logout" (click)="logout()">
                <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                <span>Sign Out</span>
              </button>
            </mat-menu>
          </div>
        </div>

        <!-- Mobile Menu Toggle -->
        <div class="celcom-mobile-menu">
          <button 
            mat-icon-button 
            class="celcom-mobile-toggle"
            (click)="toggleMobileMenu()"
            [attr.aria-expanded]="mobileMenuOpen()"
            aria-label="Toggle mobile menu">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path *ngIf="!mobileMenuOpen()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              <path *ngIf="mobileMenuOpen()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu Overlay -->
      @if (mobileMenuOpen()) {
        <div class="celcom-mobile-overlay" (click)="closeMobileMenu()">
          <nav class="celcom-mobile-nav">
            <div class="celcom-mobile-nav-header">
              <img 
                src="https://www.celcomsolutions.com/assets/images/home/header_logo_updated.png"
                alt="Celcom Solutions"
                class="celcom-mobile-logo">
            </div>
            
            <div class="celcom-mobile-nav-items">
              @for (item of navigationItems; track item.route) {
                <a 
                  [routerLink]="item.route"
                  class="celcom-mobile-nav-item"
                  (click)="closeMobileMenu()">
                  <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    @switch (item.icon) {
                      @case ('dashboard') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18M3 12h18M3 17h18"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zM19 19v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zM9 9V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                      }
                      @case ('devices') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                      }
                      @default {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      }
                    }
                  </svg>
                  <span>{{ item.label }}</span>
                </a>
              }
            </div>
            
            <div class="celcom-mobile-nav-footer">
              <button 
                mat-button 
                class="celcom-mobile-logout"
                (click)="logout()">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </div>
      }

      <!-- Animated Background Elements -->
      <div class="celcom-header-animation">
        <div class="celcom-floating-orb celcom-orb-1"></div>
        <div class="celcom-floating-orb celcom-orb-2"></div>
        <div class="celcom-floating-orb celcom-orb-3"></div>
      </div>
    </header>
  `,
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  private router = inject(Router);
  titleService = inject(TitleService);

  // Reactive state signals
  currentPageTitle = signal('Assets');
  breadcrumbs = signal<Array<{ label: string; route?: string }>>([]);
  mobileMenuOpen = signal(false);

  // User profile data
  userProfile = signal<UserProfile>({
    name: 'Admin User',
    email: 'admin@celcomsolutions.com',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=FF6B35&color=fff&size=40',
    role: 'System Administrator'
  });

  // Navigation items for mobile menu
  navigationItems: NavigationItem[] = [
    { label: 'Dashboard', route: '/', icon: 'dashboard' },
    { label: 'Assets', route: '/assets', icon: 'devices' },
    { label: 'Asset Models', route: '/asset-models', icon: 'devices' },
    { label: 'Asset POs', route: '/asset-pos', icon: 'business' },
    { label: 'Vendors', route: '/vendors', icon: 'business' },
    { label: 'OS & Versions', route: '/os-versions', icon: 'devices' },
    { label: 'Employees', route: '/users', icon: 'people' }
  ];

  ngOnInit(): void {
    this.setupRouteTracking();
  }

  private setupRouteTracking(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => event as NavigationEnd)
      )
      .subscribe(event => {
        this.updatePageTitle(event.url);
        this.updateBreadcrumbs(event.url);
      });
  }

  private updatePageTitle(url: string): void {
    const routeMap: Record<string, string> = {
      '/': 'Dashboard',
      '/dashboard': 'Dashboard',
      '/assets': 'Assets',
      '/asset-models': 'Asset Models',
      '/asset-pos': 'Asset POs',
      '/vendors': 'Vendors',
      '/os-versions': 'OS & Versions',
      '/users': 'Users'
    };

    const title = routeMap[url] || 'Celcom Solutions';
    this.currentPageTitle.set(title);
  }

  private updateBreadcrumbs(url: string): void {
    const segments = url.split('/').filter(segment => segment);
    const breadcrumbs: Array<{ label: string; route?: string }> = [];

    let currentRoute = '';
    segments.forEach((segment, index) => {
      currentRoute += `/${segment}`;
      const isLast = index === segments.length - 1;
      
      const label = this.getSegmentLabel(segment);
      breadcrumbs.push({
        label,
        route: isLast ? undefined : currentRoute
      });
    });

    this.breadcrumbs.set(breadcrumbs);
  }

  private getSegmentLabel(segment: string): string {
    const labelMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'assets': 'Assets',
      'asset-models': 'Asset Models',
      'asset-pos': 'Asset POs',
      'vendors': 'Vendors',
      'os-versions': 'OS & Versions',
      'users': 'Users'
    };

    return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(isOpen => !isOpen);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    // Implement logout logic
    console.log('Logging out user...');
    this.router.navigate(['/login']);
  }
} 