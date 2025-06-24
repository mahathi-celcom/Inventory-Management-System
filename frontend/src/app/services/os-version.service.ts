import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { OSVersion, PageResponse } from '../models/os.model';

@Injectable({
  providedIn: 'root'
})
export class OSVersionService {
  private readonly apiUrl = 'http://localhost:8080/api/os-versions';

  // Mock data for testing
  private mockOSVersions: OSVersion[] = [
    { id: 1, osId: 1, versionNumber: '11', status: 'Active' }, // Windows 11
    { id: 2, osId: 1, versionNumber: '10', status: 'Active' }, // Windows 10
    { id: 3, osId: 1, versionNumber: '8.1', status: 'Inactive' }, // Windows 8.1
    { id: 4, osId: 2, versionNumber: '22.04 LTS', status: 'Active' }, // Ubuntu 22.04
    { id: 5, osId: 2, versionNumber: '20.04 LTS', status: 'Active' }, // Ubuntu 20.04
    { id: 6, osId: 2, versionNumber: '18.04 LTS', status: 'Inactive' }, // Ubuntu 18.04
    { id: 7, osId: 3, versionNumber: '14 Sonoma', status: 'Active' }, // macOS Sonoma
    { id: 8, osId: 3, versionNumber: '13 Ventura', status: 'Active' }, // macOS Ventura
    { id: 9, osId: 4, versionNumber: '14', status: 'Active' }, // Android 14
    { id: 10, osId: 4, versionNumber: '13', status: 'Active' }, // Android 13
    { id: 11, osId: 5, versionNumber: '17', status: 'Active' }, // iOS 17
    { id: 12, osId: 5, versionNumber: '16', status: 'Active' } // iOS 16
  ];

  constructor(private http: HttpClient) {}

  /**
   * Get all OS Versions (paginated, optional status)
   */
  getAllOSVersions(page: number = 0, size: number = 10, status?: string): Observable<PageResponse<OSVersion>> {
    console.log('🔍 SERVICE: getAllOSVersions called with page:', page, 'size:', size, 'status:', status);
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (status && status !== 'All') {
      params = params.set('status', status);
    }

    return this.http.get<PageResponse<OSVersion>>(this.apiUrl, { params })
      .pipe(
        tap((response) => {
          console.log('🌐 BACKEND RESPONSE RECEIVED:', response);
          if (response && response.content) {
            console.log('📋 BACKEND CONTENT:', response.content);
            response.content.forEach((item, index) => {
              console.log(`📝 Item ${index + 1}: ID=${item.id}, Status="${item.status}", Version="${item.versionNumber}"`);
            });
          }
        }),
        catchError((error) => {
          console.warn('Failed to load OS versions from backend, using mock data. Please ensure your backend is running:', error);
          const mockResponse = this.getMockVersionPageResponse(page, size, status);
          console.log('🔍 SERVICE: Returning mock response');
          return mockResponse;
        })
      );
  }

  /**
   * Get a specific OS Version by ID
   */
  getOSVersion(id: number): Observable<OSVersion> {
    return this.http.get<OSVersion>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(() => {
          const version = this.mockOSVersions.find(item => item.id === id);
          return of(version!);
        })
      );
  }

  /**
   * Get OS Versions by osId (paginated, optional status)
   */
  getOSVersionsByOSId(osId: number, page: number = 0, size: number = 10, status?: string): Observable<PageResponse<OSVersion>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (status && status !== 'All') {
      params = params.set('status', status);
    }

    return this.http.get<PageResponse<OSVersion>>(`${this.apiUrl}/os/${osId}`, { params })
      .pipe(
        catchError((error) => {
          console.warn('Failed to load OS versions by OS ID from backend, using mock data:', error);
          // Filter mock data
          let filteredData = this.mockOSVersions.filter(version => version.osId === osId);
          return this.getMockVersionPageResponse(page, size, status, filteredData);
        })
      );
  }

  /**
   * Helper method to create mock paginated response for OS versions
   */
  private getMockVersionPageResponse(page: number, size: number, status?: string, data?: OSVersion[]): Observable<PageResponse<OSVersion>> {
    console.log('📊 MOCK: Creating mock page response - page:', page, 'size:', size, 'status:', status);
    let filteredData = data ? [...data] : [...this.mockOSVersions];
    console.log('📊 MOCK: Initial data count:', filteredData.length);
    
    // Filter by status if provided and data wasn't pre-filtered
    if (status && status !== 'All' && !data) {
      filteredData = filteredData.filter(version => version.status === status);
      console.log('📊 MOCK: After status filter count:', filteredData.length);
    }
    
    const startIndex = page * size;
    const endIndex = startIndex + size;
    const content = filteredData.slice(startIndex, endIndex);
    console.log('📊 MOCK: Page content:', content);
    console.log('📊 MOCK: Content statuses:', content.map(v => ({ id: v.id, status: v.status })));
    
    const response: PageResponse<OSVersion> = {
      content,
      page,
      size,
      totalElements: filteredData.length,
      totalPages: Math.ceil(filteredData.length / size),
      first: page === 0,
      last: page >= Math.ceil(filteredData.length / size) - 1
    };
    
    console.log('📊 MOCK: Final response:', response);
    return of(response);
  }

  /**
   * Search OS Versions by searchTerm (paginated, optional status)
   */
  searchOSVersions(searchTerm: string, page: number = 0, size: number = 10, status?: string): Observable<PageResponse<OSVersion>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (searchTerm) params = params.set('searchTerm', searchTerm);
    if (status && status !== 'All') params = params.set('status', status);

    return this.http.get<PageResponse<OSVersion>>(`${this.apiUrl}/search`, { params })
      .pipe(
        catchError((error) => {
          console.warn('Failed to search OS versions from backend, using mock data:', error);
          // Filter mock data by search term and status
          let filteredData = [...this.mockOSVersions];
          
          if (searchTerm) {
            filteredData = filteredData.filter(version => 
              version.versionNumber.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          
          if (status && status !== 'All') {
            filteredData = filteredData.filter(version => version.status === status);
          }
          
          return this.getMockVersionPageResponse(page, size, undefined, filteredData);
        })
      );
  }

  /**
   * Safe extraction of OS Version array from any response format
   */
  private extractOSVersionArray(response: any): OSVersion[] {
    // Handle different response formats
    if (Array.isArray(response)) {
      return response;
    }
    
    // Paginated response
    if (response && response.content && Array.isArray(response.content)) {
      return response.content;
    }
    
    // Spring Boot page response
    if (response && response._embedded && response._embedded.content) {
      return response._embedded.content;
    }
    
    console.warn('Unexpected OS Version response format:', response);
    return [];
  }

  /**
   * Create a new OS Version
   */
  createOSVersion(osVersion: Omit<OSVersion, 'id'>): Observable<OSVersion> {
    const versionData = { ...osVersion, status: osVersion.status ?? 'Active' };
    
    return this.http.post<OSVersion>(this.apiUrl, versionData)
      .pipe(
        catchError((error) => {
          console.warn('Failed to create OS version via API, creating locally for development:', error);
          const newVersion = { ...versionData, id: Date.now() } as OSVersion;
          this.mockOSVersions.push(newVersion);
          return of(newVersion);
        })
      );
  }

  /**
   * Update an existing OS Version
   */
  updateOSVersion(id: number, osVersion: Partial<OSVersion>): Observable<OSVersion> {
    console.log('🔧 SERVICE: updateOSVersion called');
    console.log('🔧 ID:', id);
    console.log('🔧 OS Version data:', osVersion);
    console.log('🔧 Status in data:', osVersion.status);
    
    return this.http.put<OSVersion>(`${this.apiUrl}/${id}`, osVersion)
      .pipe(
        catchError((error) => {
          console.warn('Failed to update OS version via API, updating locally for development:', error);
          console.log('🔧 Mock update - finding index for ID:', id);
          const index = this.mockOSVersions.findIndex(item => item.id === id);
          console.log('🔧 Found index:', index);
          if (index !== -1) {
            console.log('🔧 Before update:', this.mockOSVersions[index]);
            this.mockOSVersions[index] = { ...this.mockOSVersions[index], ...osVersion };
            console.log('🔧 After update:', this.mockOSVersions[index]);
            console.log('🔧 Updated status:', this.mockOSVersions[index].status);
            return of(this.mockOSVersions[index]);
          }
          throw new Error('OS Version not found');
        })
      );
  }

  /**
   * Delete an OS Version by ID
   */
  deleteOSVersion(id: number): Observable<void> {
    return this.http.delete(`${this.apiUrl}/${id}`, { 
      responseType: 'text' as 'json' // Handle 204 No Content properly
    })
      .pipe(
        map(() => void 0), // Convert any response to void
        tap(() => console.log('OS Version deleted successfully')),
        catchError((error) => {
          console.error('Failed to delete OS version via API:', error);
          // Remove from mock data for development
          const index = this.mockOSVersions.findIndex(item => item.id === id);
          if (index !== -1) {
            this.mockOSVersions.splice(index, 1);
            return of(void 0);
          }
          throw error;
        })
      );
  }
} 