import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'asset-models',
    loadComponent: () => import('./components/asset-model-management/asset-model-management.component').then(m => m.AssetModelManagementComponent)
  },
  {
    path: 'asset-pos',
    loadComponent: () => import('./components/asset-po-management/asset-po-management.component').then(m => m.AssetPoManagementComponent)
  },
  {
    path: 'vendors',
    loadComponent: () => import('./components/vendor-management/vendor-management.component').then(m => m.VendorManagementComponent)
  },
  {
    path: 'os-versions',
    loadComponent: () => import('./components/os-version-management/os-version-management.component').then(m => m.OsVersionManagementComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./components/user-management/user-management.component').then(m => m.UserManagementComponent)
  },
  {
    path: 'assets',
    loadComponent: () => import('./components/asset-management/asset.component').then(m => m.AssetComponent)
  },
  {
    path: 'debug',
    loadComponent: () => import('./components/debug/debug.component').then(m => m.DebugComponent)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
