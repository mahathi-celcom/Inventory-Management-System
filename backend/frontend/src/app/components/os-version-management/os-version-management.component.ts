import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, combineLatest } from 'rxjs';

// Shared Layout Components
import { LayoutComponent, NavigationItem } from '../shared/layout/layout.component';
import { LayoutService } from '../../services/layout.service';

// OS specific imports
import { 
  OS, 
  OSVersion, 
  OSFilter, 
  OSVersionFilter, 
  OS_STATUS, 
  OS_MESSAGES, 
  OS_VERSION_MESSAGES, 
  OS_CONFIG,
  PageResponse 
} from '../../models/os.model';
import { OSService } from '../../services/os.service';
import { OSVersionService } from '../../services/os-version.service';

@Component({
  selector: 'app-os-version-management',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    LayoutComponent
  ],
  template: `
    <app-layout 
      pageTitle="Manage Operating Systems and their versions used in your IT infrastructure."
      [navigationItems]="navigationItems"
      (navigationClick)="onNavigationClick($event)">
      
      <!-- Header Actions -->
      <div slot="header-actions" class="flex items-center space-x-4">
        
        <!-- Refresh Button -->
        <button
          (click)="refreshData()"
          class="inline-flex items-center justify-center w-8 h-8 text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:text-celcom-primary focus:outline-none focus:ring-2 focus:ring-celcom-primary focus:ring-offset-2 transition-all duration-200 ml-auto mr-2"
          [disabled]="loading || loadingOSVersions"
          title="Refresh List">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
        
        <!-- Show Form Button -->
        <button
          (click)="openFormModal()"
          class="btn-celcom-primary">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
           Create OS/OS Version
        </button>
      </div>

      <!-- Summary and Filters Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Summary Card -->
        <div class="lg:col-span-1">
          <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold mb-2 text-gray-800">Total OS Versions</h3>
                <p class="text-3xl font-bold text-gray-900">{{ getTotalOSCount() }}</p>
              </div>
              <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
            </div>
            <div class="mt-4 flex items-center justify-between text-sm">
          <div class="flex items-center">
                <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span class="text-gray-700">Active: {{ getActiveOSCount() }}</span>
              </div>
              <div class="flex items-center">
                <div class="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                <span class="text-gray-700">Inactive: {{ getInactiveOSCount() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters Card -->
        <div class="lg:col-span-2">
          <div class="bg-white border border-gray-200 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <div class="p-2 rounded-lg bg-gray-100">
                  <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"></path>
            </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 ml-3">Filters</h3>
              </div>
            <button 
              (click)="clearOSVersionFilters()" 
                class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors px-3 py-1 rounded-md hover:bg-blue-100">
              Clear All
            </button>
        </div>
        
          <form [formGroup]="osVersionFilterForm" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="form-group">
                <label class="block text-sm font-medium text-gray-700 mb-2" for="searchOS">Search OS</label>
              <input
                id="searchOS"
                type="text"
                formControlName="searchOS"
                  class="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 bg-white"
                placeholder="Search by OS name...">
            </div>
            <div class="form-group">
                <label class="block text-sm font-medium text-gray-700 mb-2" for="searchVersion">Search Version</label>
              <input
                id="searchVersion"
                type="text"
                formControlName="searchVersion"
                  class="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 bg-white"
                placeholder="Search by version...">
            </div>
            <div class="form-group">
                <label class="block text-sm font-medium text-gray-700 mb-2" for="filterStatus">Status</label>
                <select id="filterStatus" formControlName="status" class="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 bg-white">
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </form>
        </div>
                  </div>
                </div>

      <!-- Main Content -->
      <div class="card-celcom">
              <div class="card-celcom-body p-0">
                <!-- Loading State -->
                <div *ngIf="loadingOSVersions" class="flex items-center justify-center py-12">
                  <div class="text-center space-y-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-celcom-primary mx-auto"></div>
                    <p class="text-celcom-text/70">Loading OS versions...</p>
                  </div>
                </div>

                <!-- Empty State -->
                <div *ngIf="!loadingOSVersions && filteredOSVersions.length === 0" class="text-center py-12">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <h3 class="mt-2 text-sm font-medium text-gray-900">No OS versions found</h3>
                  <p class="mt-1 text-sm text-gray-500">Get started by creating a new OS version.</p>
                  <div class="mt-6">
                    <button
                (click)="openFormModal()"
                      class="btn-celcom-primary">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Create OS Version
                    </button>
                  </div>
                </div>

                <!-- OS Versions Table -->
                <div *ngIf="!loadingOSVersions && filteredOSVersions.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gradient-to-r from-celcom-primary/10 to-celcom-secondary/10">
                      <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-celcom-primary/20 transition-colors"
                      (click)="sortBy('osType')">
                    <div class="flex items-center space-x-1">
                            <span>Operating System</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                            </svg>
                    </div>
                        </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-celcom-primary/20 transition-colors"
                      (click)="sortBy('versionNumber')">
                    <div class="flex items-center space-x-1">
                            <span>Version</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                            </svg>
                    </div>
                        </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-celcom-primary/20 transition-colors"
                      (click)="sortBy('status')">
                    <div class="flex items-center space-x-1">
                            <span>Status</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                            </svg>
                    </div>
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let version of paginatedOSVersions; let i = index; trackBy: trackByVersionId" 
                    class="hover:bg-gradient-to-r hover:from-celcom-primary/5 hover:to-celcom-secondary/5 transition-all duration-200">
                        
                        <!-- Serial Number -->
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {{ i + 1 }}
                        </td>
                        
                        <!-- Operating System -->
                        <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">{{ version.osType || 'Unknown OS' }}</div>
                        </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ version.versionNumber }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span [class]="getStatusBadgeClass(version.status)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                            {{ getStatusIcon(version.status) }} {{ getDisplayStatus(version.status || 'Active') }}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div class="flex items-center justify-end space-x-2">
                            <button
                              (click)="onOSVersionEdit(version)"
                        class="text-celcom-primary hover:text-celcom-secondary transition-colors duration-200"
                        title="Edit OS Version">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                            <button
                              (click)="onOSVersionDelete(version)"
                        class="text-red-600 hover:text-red-800 transition-colors duration-200"
                        title="Delete OS Version">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Pagination -->
          <div *ngIf="!loadingOSVersions && filteredOSVersions.length > 0" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div class="flex-1 flex justify-between sm:hidden">
                      <button
                        (click)="versionPreviousPage()"
                        [disabled]="versionCurrentPage === 0"
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Previous
                      </button>
                      <button
                        (click)="versionNextPage()"
                        [disabled]="versionCurrentPage >= versionTotalPages - 1"
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Next
                      </button>
                    </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Showing
                  <span class="font-medium">{{ versionCurrentPage * versionPageSize + 1 }}</span>
                  to
                  <span class="font-medium">{{ Math.min((versionCurrentPage + 1) * versionPageSize, versionTotalElements) }}</span>
                  of
                  <span class="font-medium">{{ versionTotalElements }}</span>
                  results
                </p>
                  </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    (click)="versionPreviousPage()"
                    [disabled]="versionCurrentPage === 0"
                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span class="sr-only">Previous</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button
                    *ngFor="let page of [].constructor(versionTotalPages); let i = index"
                    (click)="versionGoToPage(i)"
                    [class]="i === versionCurrentPage ? 
                      'z-10 bg-celcom-primary border-celcom-primary text-white relative inline-flex items-center px-4 py-2 border text-sm font-medium' :
                      'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium'">
                    {{ i + 1 }}
                  </button>
                  <button
                    (click)="versionNextPage()"
                    [disabled]="versionCurrentPage >= versionTotalPages - 1"
                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span class="sr-only">Next</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </nav>
                </div>
              </div>
            </div>
          </div>
        </div>

      <!-- Modal for Create/Edit OS Version -->
      <div *ngIf="showFormModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden transform transition-all">
          <!-- Modal Header -->
          <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-celcom-primary/5 to-celcom-secondary/5">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-r from-celcom-primary to-celcom-secondary rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
          </div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900">
                  {{ editingOSVersion ? 'Edit OS Version' : 'Create New OS Version' }}
                </h3>
                <p class="text-sm text-gray-600 mt-1">
                  {{ editingOSVersion ? 'Update the operating system version details' : 'Add a new operating system version to your inventory' }}
                </p>
            </div>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="px-8 py-6">
            <form [formGroup]="osVersionForm" (ngSubmit)="onOSVersionSubmit()">
              <!-- Form Layout -->
              <div class="space-y-6">
                <!-- Operating System Selection Row -->
                <div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <svg class="w-5 h-5 text-celcom-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    Operating System Selection
                  </h4>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- OS Dropdown with Management -->
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2" for="osId">
                        Operating System *
                      </label>
                      <div class="flex items-center space-x-2">
                        <select
                          id="osId"
                          formControlName="osId"
                          class="flex-grow block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-celcom-primary focus:border-celcom-primary text-sm transition-all duration-200"
                          [class.border-red-500]="isOSVersionFieldInvalid('osId')"
                          [class.focus:border-red-500]="isOSVersionFieldInvalid('osId')">
                          <option value="">Select Operating System...</option>
                          <option *ngFor="let os of filteredOsList" [value]="os.id">
                            {{ os.osType || 'Unknown' }} ({{ os.status }})
                          </option>
                        </select>
                        
                        <!-- Add New OS Button -->
              <button
                type="button"
                          (click)="openAddOSModal()"
                          class="inline-flex items-center justify-center w-11 h-11 text-white bg-gradient-to-r from-green-500 to-green-600 border border-green-600 rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
                          title="Add New OS Type">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg>
                        </button>
                        
                        <!-- Delete Selected OS Button -->
                        <button
                          type="button"
                          (click)="deleteSelectedOS()"
                          [disabled]="!osVersionForm.get('osId')?.value"
                          class="inline-flex items-center justify-center w-11 h-11 text-white bg-gradient-to-r from-red-500 to-red-600 border border-red-600 rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-red-500 disabled:hover:to-red-600"
                          title="Delete Selected OS Type">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
              </button>
            </div>
                      
                      <div *ngIf="isOSVersionFieldInvalid('osId')" class="mt-2 text-sm text-red-600 flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Operating System is required
          </div>
                      
                      <p class="mt-2 text-xs text-gray-500">
                        Select an existing OS or add a new one using the + button
                      </p>
                    </div>

                    <!-- Quick OS Stats -->
                    <div class="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 class="text-sm font-medium text-gray-700 mb-3">Available Operating Systems</h5>
                      <div class="space-y-2">
                        <div class="flex justify-between text-xs">
                          <span class="text-gray-600">Total OS Types:</span>
                          <span class="font-medium text-gray-900">{{ filteredOsList.length }}</span>
                        </div>
                                                 <div class="flex justify-between text-xs">
                           <span class="text-gray-600">Active:</span>
                           <span class="font-medium text-green-600">{{ getActiveOSCount() }}</span>
                         </div>
                         <div class="flex justify-between text-xs">
                           <span class="text-gray-600">Inactive:</span>
                           <span class="font-medium text-red-600">{{ getInactiveOSCount() }}</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Version Details Row -->
                <div class="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                    Version Information
                  </h4>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Version Name -->
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2" for="versionNumber">
                        Version Name *
                      </label>
                      <input
                        id="versionNumber"
                        type="text"
                        formControlName="versionNumber"
                        class="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-celcom-primary focus:border-celcom-primary text-sm transition-all duration-200"
                        [class.border-red-500]="isOSVersionFieldInvalid('versionNumber')"
                        placeholder="e.g., Windows 11, macOS Ventura, Ubuntu 22.04">
                      
                      <div *ngIf="isOSVersionFieldInvalid('versionNumber')" class="mt-2 text-sm text-red-600 flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        {{ getOSVersionFieldError('versionNumber') }}
                      </div>
                      
                      <p class="mt-2 text-xs text-gray-500">
                        Enter a descriptive version name or number
                      </p>
                    </div>

                    <!-- Status -->
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-2" for="versionStatus">
                        Status *
                      </label>
                      <select
                        id="versionStatus"
                        formControlName="status"
                        class="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-celcom-primary focus:border-celcom-primary text-sm transition-all duration-200"
                        [class.border-red-500]="isOSVersionFieldInvalid('status')">
                        <option value="Active">Active - Available for use</option>
                        <option value="Inactive">Inactive - Not available</option>
                      </select>
                      
                      <div *ngIf="isOSVersionFieldInvalid('status')" class="mt-2 text-sm text-red-600 flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Status is required
                      </div>
                      
                      <p class="mt-2 text-xs text-gray-500">
                        Set the availability status for this version
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- Modal Footer -->
          <div class="px-8 py-6 border-t border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <button
                  type="button"
                  (click)="closeFormModal()"
                  class="inline-flex items-center px-6 py-3 border-2 border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Cancel
                </button>
                
                <div class="text-xs text-gray-500">
                  Press Esc to cancel
                </div>
              </div>
              
              <div class="flex items-center space-x-3">
                <div *ngIf="osVersionForm.invalid" class="text-xs text-red-600 mr-2">
                  Please fill in all required fields
                </div>
                
                <button
                  type="button"
                  (click)="onOSVersionSubmit()"
                  [disabled]="osVersionForm.invalid || isSubmitting"
                  class="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-lg text-white bg-gradient-to-r from-celcom-primary to-celcom-secondary hover:from-celcom-secondary hover:to-celcom-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-celcom-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-celcom-primary disabled:hover:to-celcom-secondary transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100">
                  <svg *ngIf="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg *ngIf="!isSubmitting" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  {{ isSubmitting ? 'Saving...' : (editingOSVersion ? 'Update OS Version' : 'Create OS Version') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add OS Modal -->
      <div *ngIf="showAddOSModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">
                {{ isOSEditMode ? 'Edit Operating System' : 'Add New Operating System' }}
              </h3>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="px-6 py-4">
            <form [formGroup]="osForm" (ngSubmit)="onOSSubmit()" class="space-y-4">
              <!-- OS Type -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2" for="osType">
                  Operating System Type *
                </label>
                <input
                  id="osType"
                  type="text"
                  formControlName="osType"
                  class="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  [class.border-red-500]="isOSFieldInvalid('osType')"
                  placeholder="e.g., Windows, macOS, Linux, Android">
                
                <div *ngIf="isOSFieldInvalid('osType')" class="mt-2 text-sm text-red-600">
                  {{ getOSFieldError('osType') }}
                </div>
              </div>

              <!-- Status -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2" for="osStatus">
                  Status *
                </label>
                <select
                  id="osStatus"
                  formControlName="status"
                  class="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </form>
          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
            <button
              type="button"
              (click)="closeAddOSModal()"
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="button"
              (click)="onOSSubmit()"
              [disabled]="osForm.invalid || isSubmitting"
              class="inline-flex items-center px-6 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50">
              {{ isSubmitting ? 'Saving...' : (isOSEditMode ? 'Update OS' : 'Add OS') }}
            </button>
          </div>
        </div>
      </div>
    </app-layout>

    <!-- Delete Confirmation Modal -->
    <div *ngIf="showDeleteConfirmation" class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="px-6 py-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-gray-900">Confirm Delete</h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Are you sure you want to delete {{ getItemToDeleteDisplay() }}? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            (click)="closeDeleteConfirmation()"
            class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-celcom-primary">
            Cancel
          </button>
          <button
            type="button"
            (click)="confirmOSVersionDelete()"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            Delete
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./os-version-management.component.css']
})
export class OsVersionManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Services
  private fb = inject(FormBuilder);
  private osService = inject(OSService);
  private osVersionService = inject(OSVersionService);
  private layoutService = inject(LayoutService);
  private cdr = inject(ChangeDetectorRef);

  // Navigation
  navigationItems: NavigationItem[] = [];

  // Form state
  osForm!: FormGroup;
  osVersionForm!: FormGroup;
  osVersionFilterForm!: FormGroup;

  // Edit state
  editingOS: OS | null = null;
  editingOSVersion: OSVersion | null = null;
  isOSEditMode = false;
  isOSVersionEditMode = false;
  showForm = false; // Default to hidden
  showFormModal = false; // New modal state
  showAddOSModal = false;
  showOSManagementModal = false;
  isSubmitting = false;

  // Data
  osList: OS[] = [];
  filteredOsList: OS[] = [];
  osVersions: OSVersion[] = [];
  filteredOSVersions: OSVersion[] = [];

  // Loading states
  loading = false;
  loadingOSVersions = false;

  // Pagination for OS Versions
  versionCurrentPage = 0;
  versionPageSize = OS_CONFIG.PAGE_SIZE;
  versionTotalElements = 0;
  versionTotalPages = 0;

  // Confirmation modal state
  showDeleteConfirmation = false;
  itemToDelete: { type: 'os' | 'version'; item: OS | OSVersion } | null = null;

  // Sorting
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Debug and monitoring
  debugMode = false; // Set to false to disable debugging
  debugLogs: string[] = [];
  lastUpdateTimestamp: number = 0;

  // Status mapping for backend compatibility
  private readonly statusMapping: { [key: string]: string } = {
    'Active': 'Active',
    'Inactive': 'Inactive',
    'Not for Buying': 'NotForBuying'
  };

  // Reverse mapping for displaying data from backend
  private readonly statusDisplayMapping: { [key: string]: string } = {
    'Active': 'Active',
    'Inactive': 'Inactive',
    'NotForBuying': 'Not for Buying'
  };

  ngOnInit(): void {
    this.initializeNavigation();
    this.initializeForms();
    this.loadOSList();
    
    // 🔍 DEBUG: Add debugging initialization
    if (this.debugMode) {
      this.addDebugLog('Component initialized');
      this.enableDebugging();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>`
      },
      {
        label: 'Asset Models',
        route: '/asset-models',
        icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
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

  private initializeForms(): void {
    // OS Form
    this.osForm = this.fb.group({
      osType: ['', [Validators.required, Validators.minLength(OS_CONFIG.MIN_TYPE_LENGTH)]],
      status: [OS_STATUS.ACTIVE, [Validators.required]]
    });

    // OS Version Form - Updated to include osId
    this.osVersionForm = this.fb.group({
      osId: ['', [Validators.required]],
      versionNumber: ['', [Validators.required, Validators.minLength(OS_CONFIG.MIN_VERSION_LENGTH)]],
      status: [OS_STATUS.ACTIVE, [Validators.required]]
    });

    // OS Version Filter Form - Updated with new filter fields
    this.osVersionFilterForm = this.fb.group({
      searchOS: [''],
      searchVersion: [''],
      status: ['']
    });

    // Debounce filter form changes
    this.osVersionFilterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyOSVersionFilters();
      });
  }

  toggleFormVisibility(): void {
    this.showForm = !this.showForm;
    
    if (this.showForm && !this.editingOSVersion) {
      // Reset form for new OS Version
      this.osVersionForm.reset({
        osId: '',
        versionNumber: '',
        status: OS_STATUS.ACTIVE
      });

    }
  }

  closeForm(): void {
    this.showForm = false;
    this.editingOSVersion = null;
    this.isOSVersionEditMode = false;
    this.resetOSVersionForm();
  }

  openFormModal(): void {
    this.showFormModal = true;
    this.resetOSVersionForm();
    this.editingOSVersion = null;
    this.isOSVersionEditMode = false;
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.resetOSVersionForm();
    this.editingOSVersion = null;
    this.isOSVersionEditMode = false;
  }

  onSubmit(formData: any): void {
    this.onOSVersionSubmit();
  }

  onNavigationClick(item: NavigationItem): void {
    // Handle navigation click if needed
    console.log('Navigation clicked:', item);
  }

  trackByVersionId(index: number, version: OSVersion): number {
    return version.id || index;
  }

  private loadOSList(): void {
    this.loading = true;
    
    this.osService.getAllOS(0, 100) // Load all OS for dropdown
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PageResponse<OS>) => {
          this.osList = this.safeExtractArray<OS>(response.content);
          this.filteredOsList = [...this.osList];
          this.loading = false;
          // Load OS versions after OS list is loaded
          this.loadAllOSVersions();
        },
        error: (error) => {
          this.loading = false;
          this.showError(this.getLoadErrorMessage(error, 'OS'));
        }
      });
  }

  // 🔍 DEBUG: Comprehensive debugging methods
  enableDebugging(): void {
    console.log('🔍 DEBUG MODE ENABLED for OS Version Management');
    
    // Debug form changes
    this.osVersionForm?.valueChanges.subscribe(value => {
      this.addDebugLog(`Form value changed: ${JSON.stringify(value)}`);
    });

    // Debug filter changes
    this.osVersionFilterForm?.valueChanges.subscribe(value => {
      this.addDebugLog(`Filter value changed: ${JSON.stringify(value)}`);
    });
  }

  addDebugLog(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.debugLogs.push(logEntry);
    console.log('🔍 DEBUG:', logEntry);
    
    // Keep only last 50 logs
    if (this.debugLogs.length > 50) {
      this.debugLogs = this.debugLogs.slice(-50);
    }
  }

  // 🔍 DEBUG: Enhanced data loading with debugging
  private loadAllOSVersions(): void {
    this.addDebugLog('=== LOAD ALL OS VERSIONS STARTED ===');
    this.loadingOSVersions = true;
    
    // Clear existing data
    const oldCount = this.osVersions.length;
    this.osVersions = [];
    this.filteredOSVersions = [];
    this.addDebugLog(`Cleared existing data (was ${oldCount} versions)`);
    
    this.cdr.detectChanges();
    
    this.osVersionService.getAllOSVersions(0, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PageResponse<OSVersion>) => {
          console.log('🔍 COMPONENT: Service response received:', response);
          const versions = this.safeExtractArray<OSVersion>(response.content);
          console.log('🔍 COMPONENT: Extracted versions:', versions);
          this.addDebugLog(`Raw versions from service: ${versions.length}`);
          
          // DETAILED STATUS LOGGING
          versions.forEach((version, index) => {
            console.log(`🔍 COMPONENT: Raw Version ${index + 1}: ID=${version.id}, Status="${version.status}", OSId=${version.osId}, VersionNumber="${version.versionNumber}"`);
          });
          
          // Map OS names to versions
          this.osVersions = versions.map((version: OSVersion) => {
            const os = this.osList.find(o => o.id === version.osId);
            const mappedVersion = {
              ...version,
              osType: os?.osType || 'Unknown OS'
            };
            console.log(`🔍 COMPONENT: Mapped Version ID=${mappedVersion.id}: Status="${mappedVersion.status}" (unchanged from raw)`);
            return mappedVersion;
          });
          
          this.addDebugLog(`Mapped OS versions: ${this.osVersions.length}`);
          
          // FINAL STATUS VERIFICATION
          console.log('🔍 COMPONENT: Final osVersions array:');
          this.osVersions.forEach((version, index) => {
            console.log(`   ${index + 1}. ID=${version.id}, Status="${version.status}", OSType="${version.osType}", Version="${version.versionNumber}"`);
          });
          
          this.addDebugLog(`Version statuses: ${this.osVersions.map(v => `${v.id}:${v.status}`).join(', ')}`);
          
          // Update pagination
          this.versionTotalElements = this.osVersions.length;
          this.versionTotalPages = Math.ceil(this.versionTotalElements / this.versionPageSize);
          this.versionCurrentPage = 0;
          
          this.applyOSVersionFilters();
          this.loadingOSVersions = false;
          
          // Enhanced change detection
          this.cdr.markForCheck();
          this.cdr.detectChanges();
          
          setTimeout(() => {
            this.cdr.detectChanges();
            this.addDebugLog('=== LOAD ALL OS VERSIONS COMPLETED ===');
          }, 50);
        },
        error: (error) => {
          this.addDebugLog(`Error loading OS versions: ${JSON.stringify(error)}`);
          this.loadingOSVersions = false;
          this.showError(this.getLoadErrorMessage(error, 'OS Version'));
          this.cdr.detectChanges();
        }
      });
  }

  // 🔍 DEBUG: Get debug information for template
  getDebugInfo(): any {
    return {
      debugMode: this.debugMode,
      debugLogs: this.debugLogs,
      lastUpdateTimestamp: this.lastUpdateTimestamp,
      osVersionsCount: this.osVersions.length,
      filteredOSVersionsCount: this.filteredOSVersions.length,
      paginatedCount: this.paginatedOSVersions.length,
      loadingState: this.loadingOSVersions,
      editMode: this.isOSVersionEditMode,
      editingVersion: this.editingOSVersion,
      formValue: this.osVersionForm?.value,
      formValid: this.osVersionForm?.valid
    };
  }

  // 🔍 DEBUG: Clear debug logs
  clearDebugLogs(): void {
    this.debugLogs = [];
    console.clear();
    this.addDebugLog('Debug logs cleared');
  }

  // 🔍 DEBUG: Toggle debug mode
  toggleDebugMode(): void {
    this.debugMode = !this.debugMode;
    this.addDebugLog(`Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
  }

  // 🔍 DEBUG: Force UI refresh manually
  forceManualRefresh(): void {
    this.addDebugLog('=== MANUAL REFRESH TRIGGERED ===');
    this.loadAllOSVersions();
  }

  private getLoadErrorMessage(error: any, type: string): string {
    const baseMessage = `Failed to load ${type} list. `;
    
    switch (error.status) {
      case 0:
        return baseMessage + OS_MESSAGES.ERROR.BACKEND_RUNNING;
      case 404:
        return baseMessage + 'API endpoint not found.';
      case 500:
        return baseMessage + OS_MESSAGES.ERROR.SERVER;
      default:
        return baseMessage + 'Please try again.';
    }
  }

  private applyOSVersionFilters(): void {
    const filterValues = this.osVersionFilterForm.value;
    
    // Create completely new array reference to trigger change detection
    let filtered = [...this.osVersions];

    // Filter by OS name
    if (filterValues.searchOS) {
      filtered = filtered.filter(version => 
        version.osType?.toLowerCase().includes(filterValues.searchOS.toLowerCase())
      );
    }

    // Filter by version name
    if (filterValues.searchVersion) {
      filtered = filtered.filter(version => 
        version.versionNumber?.toLowerCase().includes(filterValues.searchVersion.toLowerCase())
      );
    }

    // Filter by status
    if (filterValues.status) {
      filtered = filtered.filter(version => version.status === filterValues.status);
    }

    // ENHANCED: Force new array reference and trigger change detection
    this.filteredOSVersions = [...filtered];
    this.updateOSVersionPagination();
    
    // Force change detection after filtering
    this.cdr.detectChanges();
    console.log('🔄 Filters applied, change detection triggered');
  }

  private updateOSVersionPagination(): void {
    this.versionTotalElements = this.filteredOSVersions.length;
    this.versionTotalPages = Math.ceil(this.versionTotalElements / this.versionPageSize);
  }

  /**
   * Safe extraction of array from any response format with defensive checks
   */
  private safeExtractArray<T>(data: any): T[] {
    if (!data) {
      console.warn('Data is null or undefined:', data);
      return [];
    }
    
    if (Array.isArray(data)) {
      return data;
    }
    
    if (data.content && Array.isArray(data.content)) {
      return data.content;
    }
    
    console.warn('Unexpected data format, returning empty array:', data);
    return [];
  }

  // OS Version Management Methods
  onOSVersionSubmit(): void {
    this.addDebugLog('=== OS VERSION SUBMIT STARTED ===');
    this.addDebugLog(`Form valid: ${this.osVersionForm.valid}`);
    this.addDebugLog(`Form value: ${JSON.stringify(this.osVersionForm.value)}`);
    this.addDebugLog(`Edit mode: ${this.isOSVersionEditMode}`);
    this.addDebugLog(`Editing version: ${JSON.stringify(this.editingOSVersion)}`);
    this.addDebugLog(`Current osVersions count: ${this.osVersions.length}`);
    this.addDebugLog(`Current filteredOSVersions count: ${this.filteredOSVersions.length}`);
    
    if (this.osVersionForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.lastUpdateTimestamp = Date.now();
      
      const formValue = this.osVersionForm.value;
      
      // Map status to backend-compatible format
      const mappedStatus = this.statusMapping[formValue.status] || formValue.status;
      
      const versionData = {
        ...this.cleanOSVersionData(formValue),
        osId: parseInt(formValue.osId),
        status: mappedStatus
      };
      
      this.addDebugLog(`Cleaned version data: ${JSON.stringify(versionData)}`);
      this.addDebugLog(`📤 Original form status: ${formValue.status} → Mapped status: ${mappedStatus}`);
      
      const operation = this.isOSVersionEditMode
        ? this.osVersionService.updateOSVersion(this.editingOSVersion!.id!, versionData)
        : this.osVersionService.createOSVersion(versionData);

      operation.pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (savedVersion) => {
            this.addDebugLog(`=== BACKEND RESPONSE RECEIVED ===`);
            this.addDebugLog(`Saved version: ${JSON.stringify(savedVersion)}`);
            this.addDebugLog(`Saved status: ${savedVersion.status}`);
            
            const action = this.isOSVersionEditMode ? 'updated' : 'created';
            this.showSuccess(`OS Version "${savedVersion.versionNumber}" ${action} successfully!`);
            this.resetOSVersionForm();
            
            // 🔍 DEBUG: Enhanced UI refresh with detailed logging
            this.debugUIRefresh(savedVersion);
            
            this.isSubmitting = false;
            this.addDebugLog('=== OS VERSION SUBMIT COMPLETED ===');
          },
          error: (error) => {
            this.addDebugLog(`=== ERROR OCCURRED ===`);
            this.addDebugLog(`Error: ${JSON.stringify(error)}`);
            this.isSubmitting = false;
            this.showError(this.getErrorMessage(error, 'OS Version'));
          }
        });
    } else {
      this.addDebugLog('🚫 Form invalid or already submitting');
      this.addDebugLog(`Form errors: ${JSON.stringify(this.osVersionForm.errors)}`);
      this.markOSVersionFormFieldsAsTouched();
    }
  }

  // 🔍 DEBUG: Enhanced UI refresh with detailed logging
  debugUIRefresh(savedVersion: OSVersion): void {
    this.addDebugLog('=== UI REFRESH DEBUG STARTED ===');
    
    // Log current state
    this.addDebugLog(`BEFORE REFRESH - osVersions count: ${this.osVersions.length}`);
    this.addDebugLog(`BEFORE REFRESH - filteredOSVersions count: ${this.filteredOSVersions.length}`);
    
    if (this.isOSVersionEditMode && this.editingOSVersion) {
      const currentVersion = this.osVersions.find(v => v.id === this.editingOSVersion!.id);
      this.addDebugLog(`BEFORE REFRESH - current version status: ${currentVersion?.status}`);
    }
    
    // Strategy 1: Update local data immediately
    if (this.isOSVersionEditMode && this.editingOSVersion) {
      const updatedVersionIndex = this.osVersions.findIndex(v => v.id === this.editingOSVersion!.id);
      if (updatedVersionIndex !== -1) {
        const oldStatus = this.osVersions[updatedVersionIndex].status;
        this.osVersions[updatedVersionIndex] = { 
          ...savedVersion,
          osType: this.osVersions[updatedVersionIndex].osType
        };
        this.addDebugLog(`STRATEGY 1 - Updated local data: ${oldStatus} -> ${savedVersion.status}`);
      }
    }
    
    // Strategy 2: Force complete data reload
    this.addDebugLog('STRATEGY 2 - Triggering complete data reload');
    this.loadAllOSVersions();
    
    // Strategy 3: Multiple change detection triggers
    this.addDebugLog('STRATEGY 3 - Multiple change detection triggers');
    setTimeout(() => {
      this.cdr.detectChanges();
      this.addDebugLog('First change detection completed');
    }, 0);
    
    setTimeout(() => {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.addDebugLog('Second change detection completed');
    }, 100);
    
    // Strategy 4: Force array reference change
    setTimeout(() => {
      const oldOsVersionsLength = this.osVersions.length;
      const oldFilteredLength = this.filteredOSVersions.length;
      
      this.osVersions = [...this.osVersions];
      this.filteredOSVersions = [...this.filteredOSVersions];
      this.cdr.detectChanges();
      
      this.addDebugLog(`STRATEGY 4 - Array references updated (${oldOsVersionsLength} -> ${this.osVersions.length})`);
      this.addDebugLog('=== UI REFRESH DEBUG COMPLETED ===');
    }, 200);
  }

  onOSVersionEdit(version: OSVersion): void {
    console.log('✏️ DEBUG: Starting OS Version edit');
    console.log('✏️ Version to edit:', version);
    console.log('✏️ Version status:', version.status);
    
    this.clearMessages();
    this.editingOSVersion = { ...version };
    this.isOSVersionEditMode = true;
    this.showFormModal = true;
    
    // Map status from backend format to display format
    const displayStatus = this.statusDisplayMapping[version.status || 'Active'] || version.status || 'Active';
    
    console.log('✏️ Before patching - form status value:', this.osVersionForm.get('status')?.value);
    console.log('📥 Backend status:', version.status, '→ Display status:', displayStatus);
    
    this.osVersionForm.patchValue({
      osId: version.osId,
      versionNumber: version.versionNumber,
      status: displayStatus
    });
    
    console.log('✏️ After patching - form status value:', this.osVersionForm.get('status')?.value);
    console.log('✏️ After patching - full form value:', this.osVersionForm.value);
  }

  onOSVersionDelete(version: OSVersion): void {
    this.itemToDelete = { type: 'version', item: version };
    this.showDeleteConfirmation = true;
  }

  confirmOSVersionDelete(): void {
    if (this.itemToDelete && this.itemToDelete.type === 'version') {
      const version = this.itemToDelete.item as OSVersion;
      
      this.osVersionService.deleteOSVersion(version.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccess(`OS Version "${version.versionNumber}" deleted successfully!`);
            this.loadAllOSVersions();
          },
          error: (error) => {
            this.showError(this.getDeleteErrorMessage(version, error));
          }
        });
    }
    this.closeDeleteConfirmation();
  }

  // OS Management Methods
  openAddOSModal(): void {
    this.isOSEditMode = false;
    this.editingOS = null;
    this.showAddOSModal = true;
    this.resetOSForm();
  }

  closeAddOSModal(): void {
    this.showAddOSModal = false;
    this.resetOSForm();
  }

  openOSManagementModal(): void {
    this.showOSManagementModal = true;
  }

  closeOSManagementModal(): void {
    this.showOSManagementModal = false;
    // Don't reset form here if we're going into edit mode
  }

  onOSEdit(os: OS): void {
    this.clearMessages();
    this.editingOS = { ...os };
    this.isOSEditMode = true;
    
    // Map status from backend format to display format
    const displayStatus = this.statusDisplayMapping[os.status || 'Active'] || os.status || 'Active';
    
    console.log('📥 Backend OS status:', os.status, '→ Display status:', displayStatus);
    
    this.osForm.patchValue({
      osType: os.osType,
      status: displayStatus
    });
    
    this.showAddOSModal = true;
  }

  onOSDelete(os: OS): void {
    this.itemToDelete = { type: 'os', item: os };
    this.showDeleteConfirmation = true;
  }

  onOSSubmit(): void {
    if (this.osForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      // Map status to backend-compatible format
      const formValue = this.osForm.value;
      const mappedStatus = this.statusMapping[formValue.status] || formValue.status;
      
      const osData = {
        ...this.cleanOSData(formValue),
        status: mappedStatus
      };

      console.log('🔄 OS Data being sent to API:', osData);
      console.log('📤 Original form status:', formValue.status, '→ Mapped status:', mappedStatus);
      
      const operation = this.isOSEditMode
        ? this.osService.updateOS(this.editingOS!.id!, osData)
        : this.osService.createOS(osData);

      operation.pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (savedOS) => {
            const action = this.isOSEditMode ? 'updated' : 'created';
            const message = this.isOSEditMode 
              ? `✅ Operating System updated successfully!` 
              : `✅ Operating System created successfully!`;
            this.showSuccess(message);
            this.closeAddOSModal();
            this.loadOSList(); // This will reload OS versions automatically
            this.isSubmitting = false;
          },
          error: (error) => {
            this.isSubmitting = false;
            this.showError(this.getErrorMessage(error, 'OS'));
          }
        });
    } else {
      this.markOSFormFieldsAsTouched();
    }
  }

  deleteSelectedOS(): void {
    const osId = this.osVersionForm.get('osId')?.value;
    if (osId) {
      const os = this.osList.find(o => o.id === parseInt(osId));
      if (os) {
        this.itemToDelete = { type: 'os', item: os };
        this.showDeleteConfirmation = true;
      }
    }
  }

  confirmOSDelete(): void {
    if (this.itemToDelete && this.itemToDelete.type === 'os') {
      const os = this.itemToDelete.item as OS;
      
      this.osService.deleteOS(os.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccess(`OS "${os.osType}" deleted successfully!`);
            this.loadOSList();
            this.loadAllOSVersions();
            // Reset form if the deleted OS was selected
            if (this.osVersionForm.get('osId')?.value === os.id?.toString()) {
              this.osVersionForm.patchValue({ osId: '' });
            }
          },
          error: (error) => {
            this.showError(this.getDeleteErrorMessage(os, error));
          }
        });
    }
    this.closeDeleteConfirmation();
  }

  // Utility Methods
  private cleanOSData(formData: any): Omit<OS, 'id'> {
    return {
      osType: formData.osType?.trim(),
      status: formData.status
    };
  }

  private cleanOSVersionData(formData: any): Omit<OSVersion, 'id'> {
    return {
      versionNumber: formData.versionNumber?.trim() || '',
      status: formData.status, 
      osId: parseInt(formData.osId) || 0
    };
  }

  private getErrorMessage(error: any, type: string): string {
    const baseMessage = `Failed to ${this.isOSEditMode || this.isOSVersionEditMode ? 'update' : 'create'} ${type}. `;
    
    switch (error.status) {
      case 0:
        return baseMessage + OS_MESSAGES.ERROR.NETWORK;
      case 400:
        return baseMessage + 'Invalid data provided.';
      case 409:
        return baseMessage + `${type} already exists.`;
      case 500:
        return baseMessage + OS_MESSAGES.ERROR.SERVER;
      default:
        return baseMessage + 'Please try again.';
    }
  }

  private getDeleteErrorMessage(item: OS | OSVersion, error: any): string {
    const itemName = 'osType' in item ? (item.osType || 'Unknown OS') : (item.versionNumber || 'Unknown Version');
    const baseMessage = `Failed to delete "${itemName}". `;
    
    switch (error.status) {
      case 0:
        return baseMessage + OS_MESSAGES.ERROR.NETWORK;
      case 404:
        return baseMessage + 'Item not found.';
      case 409:
        return baseMessage + 'Item is being used and cannot be deleted.';
      case 500:
        return baseMessage + OS_MESSAGES.ERROR.SERVER;
      default:
        return baseMessage + 'Please try again.';
    }
  }

  private resetOSForm(): void {
    this.osForm.reset({
      osType: '',
      status: OS_STATUS.ACTIVE
    });
    this.editingOS = null;
    this.isOSEditMode = false;
    this.osForm.markAsUntouched();
  }

  private resetOSVersionForm(): void {
    this.osVersionForm.reset({
      osId: '',
      versionNumber: '',
      status: OS_STATUS.ACTIVE
    });
    this.editingOSVersion = null;
    this.isOSVersionEditMode = false;
    this.osVersionForm.markAsUntouched();
  }

  onOSVersionCancel(): void {
    this.resetOSVersionForm();
  }

  closeDeleteConfirmation(): void {
    this.showDeleteConfirmation = false;
    this.itemToDelete = null;
  }

  private showSuccess(message: string): void {
    this.layoutService.showSuccessToast(message);
  }

  private showError(message: string): void {
    this.layoutService.showErrorToast(message);
  }

  private clearMessages(): void {
    // No longer needed with toast notifications
  }

  // Form Validation Methods
  isOSFieldInvalid(fieldName: string): boolean {
    const field = this.osForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getOSFieldError(fieldName: string): string {
    const field = this.osForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${this.capitalizeFirstLetter(fieldName)} is required`;
      if (field.errors['minlength']) return `${this.capitalizeFirstLetter(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  isOSVersionFieldInvalid(fieldName: string): boolean {
    const field = this.osVersionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getOSVersionFieldError(fieldName: string): string {
    const field = this.osVersionForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${this.capitalizeFirstLetter(fieldName)} is required`;
      if (field.errors['minlength']) return `${this.capitalizeFirstLetter(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private markOSFormFieldsAsTouched(): void {
    Object.keys(this.osForm.controls).forEach(key => {
      this.osForm.get(key)?.markAsTouched();
    });
  }

  private markOSVersionFormFieldsAsTouched(): void {
    Object.keys(this.osVersionForm.controls).forEach(key => {
      this.osVersionForm.get(key)?.markAsTouched();
    });
  }

  clearOSVersionFilters(): void {
    this.osVersionFilterForm.reset({
      searchOS: '',
      searchVersion: '',
      status: ''
    });
  }

  refreshData(): void {
    console.log('🔄 Manual refresh triggered');
    this.showSuccess('Refreshing data...');
    this.loadOSList();
    // loadOSList() will call loadAllOSVersions() automatically
  }

  toggleOSVersionFormVisibility(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetOSVersionForm();
    }
  }

  // Sorting functionality
  sortBy(field: string): void {
    // Implement sorting logic if needed
    console.log('Sort by:', field);
  }

  get paginatedOSVersions(): OSVersion[] {
    // ENHANCED: Always return fresh array slice to prevent stale data
    const start = this.versionCurrentPage * this.versionPageSize;
    const end = start + this.versionPageSize;
    return [...this.filteredOSVersions.slice(start, end)];
  }

  versionPreviousPage(): void {
    if (this.versionCurrentPage > 0) {
      this.versionCurrentPage--;
      this.updateOSVersionPagination();
    }
  }

  versionNextPage(): void {
    if (this.versionCurrentPage < this.versionTotalPages - 1) {
      this.versionCurrentPage++;
      this.updateOSVersionPagination();
    }
  }

  versionGoToPage(page: number): void {
    if (page >= 0 && page < this.versionTotalPages) {
      this.versionCurrentPage = page;
      this.updateOSVersionPagination();
    }
  }

  getStatusBadgeClass(status?: string): string {
    // Map backend status to display status for comparison
    const displayStatus = this.getDisplayStatus(status || 'Active');
    
    switch (displayStatus) {
      case 'Active':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800';
      case 'Inactive':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800';
      case 'Not for Buying':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800';
      default:
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status?: string): string {
    const displayStatus = this.getDisplayStatus(status || 'Active');
    
    switch (displayStatus) {
      case 'Active':
        return '🟢';
      case 'Inactive':
        return '🔴';
      case 'Not for Buying':
        return '🟡';
      default:
        return '⚪';
    }
  }

  // Get display-friendly status text
  getDisplayStatus(status: string): string {
    return this.statusDisplayMapping[status] || status || 'Active';
  }

  get Math() {
    return Math;
  }

  getItemToDeleteDisplay(): string {
    if (!this.itemToDelete) return '';
    
    if (this.itemToDelete.type === 'os') {
      const os = this.itemToDelete.item as OS;
      return os.osType || 'Unknown OS';
    } else {
      const version = this.itemToDelete.item as OSVersion;
      return `${version.osType || 'Unknown OS'} ${version.versionNumber || 'Unknown Version'}`;
    }
  }

  getTotalOSCount(): number {
    return this.filteredOSVersions.length;
  }

  getActiveOSCount(): number {
    return this.filteredOSVersions.filter(version => version.status === 'Active').length;
  }

  getInactiveOSCount(): number {
    return this.filteredOSVersions.filter(version => version.status === 'Inactive').length;
  }

  getNotForBuyingOSCount(): number {
    return this.filteredOSVersions.filter(version => version.status === 'NotForBuying').length;
  }
} 