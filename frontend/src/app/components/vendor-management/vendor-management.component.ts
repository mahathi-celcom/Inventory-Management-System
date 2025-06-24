import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// Shared Layout Components
import { LayoutComponent, NavigationItem } from '../shared/layout/layout.component';
import { LayoutService } from '../../services/layout.service';

// Vendor-specific imports
import { VendorService } from '../../services/vendor.service';
import { Vendor, VendorFilter, VENDOR_STATUS, VENDOR_MESSAGES } from '../../models/vendor.model';
import { VendorUtils } from '../../utils/vendor.utils';

@Component({
  selector: 'app-vendor-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LayoutComponent
  ],
  template: `
    <app-layout 
      pageTitle="Manage vendors and their details used for IT asset procurement and warranty support."
      [navigationItems]="navigationItems"
      (navigationClick)="onNavigationClick($event)">
      
      <!-- Header Actions -->
      <div slot="header-actions" class="flex items-center space-x-4">
        <!-- Refresh Button -->
        <button
          (click)="refreshData()"
          class="inline-flex items-center justify-center w-8 h-8 text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:text-celcom-primary focus:outline-none focus:ring-2 focus:ring-celcom-primary focus:ring-offset-2 transition-all duration-200"
          title="Refresh List">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
        
        <!-- Show Form Button -->
        <button
          (click)="openFormModal()"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-celcom-primary to-celcom-secondary hover:from-celcom-secondary hover:to-celcom-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-celcom-primary transition-all duration-200">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
           Create Vendor
        </button>
      </div>

      <!-- Summary Card with Integrated Filters -->
      <div class="card-celcom mb-6">
        <div class="card-celcom-body">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <!-- Total Vendors Card -->
            <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
          <div class="flex items-center">
                <div class="p-3 rounded-full bg-gray-100">
                  <svg class="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Total Vendors</p>
                  <p class="text-3xl font-bold text-gray-900">{{ vendors.length }}</p>
                  <div class="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                    <span class="flex items-center">
                      <div class="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      Active: {{ getActiveCount() }}
                    </span>
                    <span class="flex items-center">
                      <div class="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                      Inactive: {{ getInactiveCount() }}
                    </span>
            </div>
          </div>
        </div>
      </div>

            <!-- Filters Section -->
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
              (click)="clearFilters()" 
                    class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors px-3 py-1 rounded-md hover:bg-blue-100">
              Clear All
            </button>
        </div>
        
                <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Search -->
            <div>
                    <label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search Vendors</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input 
                  type="text" 
                  id="search"
                  formControlName="search"
                  placeholder="Search by vendor name or contact info..."
                        class="block w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 bg-white">
              </div>
            </div>

            <!-- Status Filter -->
            <div>
                    <label for="status" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                id="status"
                formControlName="status"
                      class="block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 bg-white">
                <option value="">All Statuses</option>
                <option *ngFor="let status of statusOptions" [value]="status">{{status}}</option>
              </select>
            </div>
          </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal for Create/Edit Vendor -->
      <div *ngIf="showFormModal" class="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden transform transition-all border border-purple-200">
          <!-- Modal Header -->
          <div class="px-8 py-6 border-b border-purple-200 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-2 ring-white/30">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-white">
                  {{ editingVendor ? 'Edit Vendor' : 'Create New Vendor' }}
                </h3>
                <p class="text-sm text-white/90 mt-1 font-medium">
                  {{ editingVendor ? 'Update vendor information and contact details' : 'Add a new vendor for IT asset procurement and warranty support' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="px-8 py-8 bg-gradient-to-br from-gray-50 to-blue-50">
            <form [formGroup]="vendorForm" (ngSubmit)="onSubmit(vendorForm.value)">
              <!-- Form Layout -->
              <div class="grid grid-cols-3 gap-8">
                <!-- Vendor Name -->
                <div class="space-y-3">
                  <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-celcom-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                      <svg class="w-4 h-4 text-celcom-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                    </div>
                    <label class="block text-sm font-bold text-gray-800" for="name">
                      Vendor Name *
                    </label>
                  </div>
                  <input 
                    id="name"
                    type="text"
                    formControlName="name"
                    class="block w-full px-4 py-4 border-2 border-purple-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 text-sm transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-md"
                    [class.border-red-400]="isFieldInvalid('name')"
                    [class.bg-red-50]="isFieldInvalid('name')"
                    placeholder="e.g., Dell Technologies, HP Inc.">
                  
                  <div *ngIf="isFieldInvalid('name')" class="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg">
                    <svg class="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {{ getFieldError('name') }}
                  </div>
                  
                  <p class="text-xs text-gray-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
                    💡 Enter the official vendor or company name
                  </p>
                </div>

                <!-- Contact Info -->
                <div class="space-y-3">
                  <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                    </div>
                    <label class="block text-sm font-bold text-gray-800" for="contactInfo">
                      Contact Information
                    </label>
                  </div>
                  <textarea 
                    id="contactInfo"
                    formControlName="contactInfo"
                    rows="4"
                    class="block w-full px-4 py-4 border-2 border-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 text-sm transition-all duration-300 resize-none bg-white/80 backdrop-blur-sm hover:shadow-md"
                    placeholder="Phone: +1-234-567-8900&#10;Email: contact@vendor.com&#10;Address: 123 Business St, City, State&#10;Website: www.vendor.com">
                  </textarea>
                  
                  <p class="text-xs text-gray-600 bg-green-50 p-2 rounded-lg border border-green-200">
                    📞 Optional: Phone, email, address, or website details
                  </p>
                </div>

                <!-- Status -->
                <div class="space-y-3">
                  <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <label class="block text-sm font-bold text-gray-800" for="status">
                      Status *
                    </label>
                  </div>
                  <select 
                    id="status"
                    formControlName="status"
                    class="block w-full px-4 py-4 border-2 border-orange-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-md"
                    [class.border-red-400]="isFieldInvalid('status')"
                    [class.bg-red-50]="isFieldInvalid('status')">
                    <option value="">Select Status</option>
                    <option *ngFor="let status of statusOptions" [value]="status">{{ status }}</option>
                  </select>
                  
                  <div *ngIf="isFieldInvalid('status')" class="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg">
                    <svg class="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {{ getFieldError('status') }}
                  </div>
                  
                  <p class="text-xs text-gray-600 bg-orange-50 p-2 rounded-lg border border-orange-200">
                    ⚡ Set the vendor's availability status
                  </p>
                </div>
              </div>
            </form>
          </div>

          <!-- Modal Footer -->
          <div class="px-8 py-6 border-t border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <button
                  type="button"
                  (click)="closeFormModal()"
                  class="inline-flex items-center px-6 py-3 border-2 border-gray-300 shadow-lg text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-300 transform hover:scale-105">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Cancel
                </button>
                
                <div class="text-xs text-gray-500 bg-white/60 px-3 py-2 rounded-lg backdrop-blur-sm">
                  Press Esc to cancel
                </div>
              </div>
              
              <div class="flex items-center space-x-4">
                <div *ngIf="vendorForm.invalid" class="text-sm text-red-600 mr-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                  ⚠️ Please fill in all required fields
                </div>

                  <button
                  type="button"
                  (click)="onSubmit(vendorForm.value)"
                    [disabled]="vendorForm.invalid || isSubmitting"
                  class="inline-flex items-center px-8 py-3 border border-transparent text-sm font-bold rounded-xl shadow-xl text-white bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 focus:outline-none focus:ring-4 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:via-pink-600 disabled:hover:to-orange-500 transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100">
                  <svg *ngIf="isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  <svg *ngIf="!isSubmitting" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                    {{ isSubmitting ? 'Saving...' : (editingVendor ? 'Update Vendor' : 'Create Vendor') }}
                  </button>
                </div>
            </div>
          </div>
                </div>
              </div>
              
      <!-- Vendor List -->
      <div class="card-celcom">
              <div class="card-celcom-body p-0">
                <!-- Loading State -->
                <div *ngIf="loading" class="flex items-center justify-center py-12">
                  <div class="text-center space-y-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-celcom-primary mx-auto"></div>
                    <p class="text-celcom-text/70">Loading vendors...</p>
                  </div>
                </div>

                <!-- Empty State -->
                <div *ngIf="!loading && vendors.length === 0" class="text-center py-12">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  <h3 class="mt-2 text-sm font-medium text-gray-900">No vendors</h3>
                  <p class="mt-1 text-sm text-gray-500">Get started by creating a new vendor.</p>
                  <div class="mt-6">
                    <button
                (click)="openFormModal()"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-celcom-primary hover:bg-celcom-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-celcom-primary">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                Add Vendor
                    </button>
                  </div>
                </div>

          <!-- Vendor Table -->
                <div *ngIf="!loading && filteredVendors.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gradient-to-r from-celcom-primary/10 to-celcom-secondary/10">
                      <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.No
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-celcom-primary/20 transition-colors">
                    Vendor
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-celcom-primary/20 transition-colors">
                    Contact Info
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-celcom-primary/20 transition-colors">
                    Status
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-celcom-primary/20 transition-colors">
                    Actions
                  </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let vendor of filteredVendors; let i = index; trackBy: trackByVendorId" class="hover:bg-gradient-to-r hover:from-celcom-primary/5 hover:to-celcom-secondary/5 transition-all duration-200">
                        
                        <!-- Serial Number -->
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {{ i + 1 }}
                        </td>
                        
                        <!-- Vendor Name -->
                        <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm font-medium text-gray-900">{{ vendor.name }}</div>
                        </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900" [innerHTML]="vendor.contactInfo || 'No contact info'"></div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span [class]="getStatusBadgeClass(vendor.status)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                            {{ getStatusIcon(vendor.status) }} {{ getDisplayStatus(vendor.status) }}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div class="flex items-center justify-end space-x-2">
                            <button
                              (click)="editVendor(vendor)"
                        class="text-celcom-primary hover:text-celcom-secondary transition-colors duration-200"
                        title="Edit vendor">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                            <button
                              (click)="deleteVendor(vendor)"
                        class="text-red-600 hover:text-red-800 transition-colors duration-200"
                        title="Delete vendor">
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

          <!-- No Results State -->
          <div *ngIf="!loading && vendors.length > 0 && filteredVendors.length === 0" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No vendors found</h3>
            <p class="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
            <div class="mt-6">
              <button
                (click)="clearFilters()"
                class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-celcom-primary">
                Clear Filters
              </button>
            </div>
            </div>
          </div>
        </div>
    </app-layout>
  `,
  styleUrls: ['./vendor-management.component.css']
})
export class VendorManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Services
  private fb = inject(FormBuilder);
  private vendorService = inject(VendorService);
  private layoutService = inject(LayoutService);

  // Navigation
  navigationItems: NavigationItem[] = [];

  // Data
  vendors: Vendor[] = [];
  filteredVendors: Vendor[] = [];
  editingVendor: Vendor | null = null;

  // Forms
  vendorForm!: FormGroup;
  filterForm!: FormGroup;

  // UI State
  loading = false;
  isSubmitting = false;
  showForm = false; // Default to hidden
  showFormModal = false; // Modal state

  // Configuration
  statusOptions = Object.values(VENDOR_STATUS);

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
    this.setupFormSubscriptions();
    this.loadVendors();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    // Vendor form
    this.vendorForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      contactInfo: [''],
      status: [VENDOR_STATUS.ACTIVE, [Validators.required]]
    });

    // Filter form
    this.filterForm = this.fb.group({
      search: [''],
      status: ['']
    });
  }

  private setupFormSubscriptions(): void {
    // Filter form changes with debouncing to prevent double-click issues
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private loadVendors(): void {
    this.loading = true;
    this.vendorService.getAllVendors()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vendors) => {
          this.vendors = vendors;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading vendors:', error);
          this.layoutService.showErrorToast('Failed to load vendors');
          this.loading = false;
        }
      });
  }

  private applyFilters(): void {
    const filters = this.filterForm.value;
    this.filteredVendors = VendorUtils.filterVendors(
      this.vendors, 
      filters.search || '', 
      filters.status || ''
    );
  }

  toggleFormVisibility(): void {
    this.showForm = !this.showForm;
    
    if (this.showForm && !this.editingVendor) {
      // Reset form for new vendor
      this.vendorForm.reset({
        name: '',
        contactInfo: '',
        status: VENDOR_STATUS.ACTIVE
      });

    }
  }

  openCreateDrawer(): void {
    this.editingVendor = null;
    this.vendorForm.reset({
      name: '',
      contactInfo: '',
      status: VENDOR_STATUS.ACTIVE
    });

    this.showForm = true;
  }

  editVendor(vendor: Vendor): void {
    this.editingVendor = vendor;
    
    // Map status from backend format to display format
    const displayStatus = this.statusDisplayMapping[vendor.status] || vendor.status;
    
    console.log('📥 Backend status:', vendor.status, '→ Display status:', displayStatus);
    
    this.vendorForm.patchValue({
      ...vendor,
      status: displayStatus
    });
    this.showFormModal = true;
  }

  openEditDrawer(vendor: Vendor): void {
    this.editVendor(vendor);
  }

  closeFormDrawer(): void {
    this.showForm = false;
    this.editingVendor = null;
    this.vendorForm.reset();
  }

  openFormModal(): void {
    this.showFormModal = true;
    this.editingVendor = null;
    this.vendorForm.reset({
      name: '',
      contactInfo: '',
      status: VENDOR_STATUS.ACTIVE
    });
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.editingVendor = null;
    this.vendorForm.reset();
  }

  refreshData(): void {
    this.loadVendors();
  }

  onSubmit(formData: any): void {
    if (this.vendorForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      // Map status to backend-compatible format
      const mappedStatus = this.statusMapping[formData.status] || formData.status;
      const vendorData = {
        ...formData,
        status: mappedStatus
      };

      console.log('🔄 Vendor Data being sent to API:', vendorData);
      console.log('📤 Original form status:', formData.status, '→ Mapped status:', mappedStatus);

      const operation = this.editingVendor
        ? this.vendorService.updateVendor(this.editingVendor.vendorId!, vendorData)
        : this.vendorService.createVendor(vendorData);

      operation
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (vendor) => {
            const message = this.editingVendor 
              ? `Vendor ${VENDOR_MESSAGES.SUCCESS.UPDATED}` 
              : `Vendor ${VENDOR_MESSAGES.SUCCESS.CREATED}`;
            
            this.layoutService.showSuccessToast(message);
            this.closeFormModal();
            this.loadVendors();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error saving vendor:', error);
            this.layoutService.showErrorToast('Failed to save vendor');
            this.isSubmitting = false;

          }
        });
    }
  }

  deleteVendor(vendor: Vendor): void {
    if (!vendor?.vendorId) {
      this.layoutService.showErrorToast('Cannot delete vendor: Missing vendor ID');
      return;
    }
    
    if (confirm(`Are you sure you want to delete "${vendor.name}"?`)) {
      this.vendorService.deleteVendor(vendor.vendorId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.layoutService.showSuccessToast(`Vendor ${VENDOR_MESSAGES.SUCCESS.DELETED}`);
            this.loadVendors();
          },
          error: (error) => {
            console.error('Error deleting vendor:', error);
            this.layoutService.showErrorToast('Failed to delete vendor');
          }
        });
    }
  }

  onDelete(vendor: Vendor): void {
    this.deleteVendor(vendor);
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: ''
    });
  }

  onNavigationClick(item: NavigationItem): void {
    // Handle navigation if needed
    console.log('Navigation clicked:', item);
  }

  // Helper methods
  getActiveCount(): number {
    return this.vendors.filter(v => v.status === 'Active').length;
  }

  getInactiveCount(): number {
    return this.vendors.filter(v => v.status === 'Inactive').length;
  }

  getNotForBuyingCount(): number {
    return this.vendors.filter(v => v.status === 'NotForBuying').length;
  }

  getStatusBadgeClass(status: string): string {
    // Map backend status to display status for comparison
    const displayStatus = this.getDisplayStatus(status);
    
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

  getStatusIcon(status: string): string {
    const displayStatus = this.getDisplayStatus(status);
    
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

  isFieldInvalid(fieldName: string): boolean {
    const field = this.vendorForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.vendorForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  trackByVendorId(index: number, vendor: Vendor): number {
    return vendor.vendorId || index;
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
} 