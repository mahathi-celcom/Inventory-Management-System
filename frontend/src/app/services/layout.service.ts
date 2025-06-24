import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DrawerConfig {
  title: string;
  isOpen: boolean;
  width?: string;
  component?: any;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Sidebar state management
  private _isSidebarCollapsed = signal(false);
  private _isMobileMenuOpen = signal(false);
  
  // Drawer state management
  private _drawerConfig = signal<DrawerConfig>({
    title: '',
    isOpen: false,
    width: '400px'
  });
  
  // Toast/Snackbar state
  private _toastMessage = signal<string>('');
  private _toastType = signal<'success' | 'error' | 'info'>('info');
  private _showToast = signal(false);

  // Public getters
  get isSidebarCollapsed() {
    return this._isSidebarCollapsed;
  }

  get isMobileMenuOpen() {
    return this._isMobileMenuOpen;
  }

  get drawerConfig() {
    return this._drawerConfig;
  }

  get toastMessage() {
    return this._toastMessage;
  }

  get toastType() {
    return this._toastType;
  }

  get showToast() {
    return this._showToast;
  }

  // Sidebar methods
  toggleSidebar(): void {
    this._isSidebarCollapsed.update(collapsed => !collapsed);
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this._isSidebarCollapsed.set(collapsed);
  }

  toggleMobileMenu(): void {
    this._isMobileMenuOpen.update(open => !open);
  }

  setMobileMenuOpen(open: boolean): void {
    this._isMobileMenuOpen.set(open);
  }

  // Drawer methods
  openDrawer(config: Partial<DrawerConfig>): void {
    this._drawerConfig.set({
      title: config.title || '',
      isOpen: true,
      width: config.width || '400px',
      component: config.component,
      data: config.data
    });
  }

  closeDrawer(): void {
    this._drawerConfig.update(config => ({
      ...config,
      isOpen: false
    }));
  }

  // Toast methods
  showSuccessToast(message: string): void {
    this._toastMessage.set(message);
    this._toastType.set('success');
    this._showToast.set(true);
    this.autoHideToast();
  }

  showErrorToast(message: string): void {
    this._toastMessage.set(message);
    this._toastType.set('error');
    this._showToast.set(true);
    this.autoHideToast();
  }

  showInfoToast(message: string): void {
    this._toastMessage.set(message);
    this._toastType.set('info');
    this._showToast.set(true);
    this.autoHideToast();
  }

  hideToast(): void {
    this._showToast.set(false);
  }

  private autoHideToast(): void {
    setTimeout(() => {
      this.hideToast();
    }, 5000);
  }

  // Responsive breakpoint detection
  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  isTablet(): boolean {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  }

  isDesktop(): boolean {
    return window.innerWidth >= 1024;
  }
} 