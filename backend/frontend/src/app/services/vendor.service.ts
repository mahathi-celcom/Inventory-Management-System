import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Vendor, VendorFilter, VENDOR_STATUS, VENDOR_MESSAGES } from '../models/vendor.model';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root'
})
export class VendorService {

  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {
    // Verify proxy configuration in development
    this.apiConfig.checkProxyConfiguration();
  }

  getAllVendors(): Observable<Vendor[]> {
    const url = this.apiConfig.getEndpointUrl('vendors', 'getAll');
    
    return this.http.get<any>(url)
      .pipe(
        tap(response => {
          this.apiConfig.logResponse('vendors/getAll', response);
          console.log('🔍 Raw API Response (All Vendors):', response);
        }),
        map(response => {
          // Handle paginated response: { content: [...], ... }
          const extractedData = this.apiConfig.extractData<any>(response);
          console.log('📦 Extracted vendor data (All):', extractedData);
          
          // Map API response to our Vendor interface
          const mappedVendors = extractedData.map((item: any) => {
            const vendor = {
              vendorId: item.id || item.vendorId, // Backend uses 'id' as primary key
              name: item.name, // Backend returns 'name' field
              contactInfo: item.contactInfo,
              status: item.status || VENDOR_STATUS.ACTIVE
            } as Vendor;
            return vendor;
          });
          
          console.log('🏷️ Final mapped vendors:', mappedVendors);
          return mappedVendors;
        }),
        catchError((error) => {
          console.error('Failed to load vendors:', error);
          throw error;
        })
      );
  }

  getActiveVendors(): Observable<Vendor[]> {
    // For PO creation forms, fetch only active vendors with paginated response support
    const url = this.apiConfig.getEndpointUrl('vendors', 'getAll') + '?status=Active';
    
    return this.http.get<any>(url)
      .pipe(
        tap(response => {
          this.apiConfig.logResponse('vendors/getActive', response);
          console.log('🔍 Raw API Response:', response);
        }),
        map(response => {
          // Handle paginated response: { content: [...], ... }
          const extractedData = this.apiConfig.extractData<any>(response);
          console.log('📦 Extracted vendor data:', extractedData);
          
          // Map API response to our Vendor interface
          const mappedVendors = extractedData.map((item: any) => {
            const vendor = {
              vendorId: item.id || item.vendorId, // Backend uses 'id' as primary key
              name: item.name, // Backend returns 'name' field
              contactInfo: item.contactInfo,
              status: item.status || VENDOR_STATUS.ACTIVE
            } as Vendor;
            console.log('🏷️ Mapped vendor:', vendor);
            return vendor;
          });
          
          return mappedVendors;
        }),
        catchError((error) => {
          console.error('Failed to load active vendors:', error);
          // Fallback to getting all vendors and filtering client-side
          return this.getAllVendors().pipe(
            map(vendors => vendors.filter(v => v.status === VENDOR_STATUS.ACTIVE))
          );
        })
      );
  }

  getVendor(id: number): Observable<Vendor> {
    const url = this.apiConfig.buildUrlWithId('vendors', 'getById', id);
    
    return this.http.get<any>(url)
      .pipe(
        tap(response => this.apiConfig.logResponse('vendors/get', response)),
        map(response => this.apiConfig.extractItem<Vendor>(response)),
        catchError((error) => {
          console.error('Failed to get vendor from backend:', error);
          throw error;
        })
      );
  }

  createVendor(vendor: Omit<Vendor, 'vendorId'>): Observable<Vendor> {
    const cleanname = vendor.name?.trim();
    const cleanContactInfo = vendor.contactInfo?.trim();
    const cleanStatus = vendor.status || VENDOR_STATUS.ACTIVE;
    
    if (!cleanname) {
      throw new Error('Vendor name is required and cannot be empty');
    }
    
    // Map to backend DTO field names
    const vendorData = {
      name: cleanname,        // Backend expects 'name', not 'name'
      contactInfo: cleanContactInfo || null,  // Send null if empty
      status: cleanStatus
    };
    
    const url = this.apiConfig.getEndpointUrl('vendors', 'create');
    
    return this.http.post<any>(url, vendorData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
      .pipe(
        tap(response => {
          this.apiConfig.logResponse('vendors/create', response);
        }),
        map(response => {
          const responseData = this.apiConfig.extractItem<any>(response);
          
          const mappedVendor = {
            vendorId: responseData.vendorId || responseData.id,
            name: responseData.name || responseData.name, // Backend returns 'name'
            contactInfo: responseData.contactInfo,
            status: responseData.status || VENDOR_STATUS.ACTIVE
          } as Vendor;
          
          return mappedVendor;
        }),
        catchError((error) => {
          console.error('Failed to create vendor:', error);
          throw error;
        })
      );
  }

  updateVendor(id: number, vendor: Partial<Vendor>): Observable<Vendor> {
    const cleanname = vendor.name?.trim();
    const cleanContactInfo = vendor.contactInfo?.trim();
    const cleanStatus = vendor.status || VENDOR_STATUS.ACTIVE;
    
    // Validate ID before proceeding
    if (id === undefined || id === null || !Number.isInteger(id) || id <= 0) {
      const errorMsg = `Invalid vendor ID for UPDATE: ${id} (type: ${typeof id})`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!cleanname) {
      throw new Error('Vendor name is required and cannot be empty');
    }
    
    // Map to backend DTO field names
    const vendorData = {
      name: cleanname,        // Backend expects 'name', not 'name'
      contactInfo: cleanContactInfo || null,  // Send null if empty
      status: cleanStatus
    };
    
    const url = this.apiConfig.buildUrlWithId('vendors', 'update', id);
    
    return this.http.put<any>(url, vendorData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
      .pipe(
        tap(response => {
          this.apiConfig.logResponse('vendors/update', response);
        }),
        map(response => {
          const responseData = this.apiConfig.extractItem<any>(response);
          
          const mappedVendor = {
            vendorId: responseData.vendorId || responseData.id,
            name: responseData.name || responseData.name, // Backend returns 'name'
            contactInfo: responseData.contactInfo,
            status: responseData.status || VENDOR_STATUS.ACTIVE
          } as Vendor;
          
          return mappedVendor;
        }),
        catchError((error) => {
          console.error('Failed to update vendor:', error);
          throw error;
        })
      );
  }

  searchVendors(filter: VendorFilter): Observable<Vendor[]> {
    return this.getAllVendors().pipe(
      map(vendors => {
        let filtered = vendors;
        
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          filtered = filtered.filter(vendor =>
            vendor.name.toLowerCase().includes(searchLower) ||
            (vendor.contactInfo && vendor.contactInfo.toLowerCase().includes(searchLower))
          );
        }
        
        if (filter.status && filter.status !== VENDOR_STATUS.ALL) {
          filtered = filtered.filter(vendor => vendor.status === filter.status);
        }
        
        return filtered;
      })
    );
  }

  deleteVendor(id: number): Observable<void> {
    // Validate ID before proceeding
    if (id === undefined || id === null || !Number.isInteger(id) || id <= 0) {
      const errorMsg = `Invalid vendor ID for DELETE: ${id} (type: ${typeof id})`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    const url = this.apiConfig.buildUrlWithId('vendors', 'delete', id);
    
    return this.http.delete(url, { 
      responseType: 'text' as 'json' // Handle 204 No Content properly
    })
      .pipe(
        tap(response => {
          this.apiConfig.logResponse('vendors/delete', response);
        }),
        map(() => void 0), // Convert any response to void
        catchError((error) => {
          console.error('Failed to delete vendor:', error);
          throw error;
        })
      );
  }
} 