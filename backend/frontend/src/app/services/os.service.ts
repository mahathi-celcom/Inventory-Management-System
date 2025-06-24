import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { OS, PageResponse } from '../models/os.model';

@Injectable({
  providedIn: 'root'
})
export class OSService {
  private readonly apiUrl = 'http://localhost:8080/api/os';

  // Mock data for testing
  private mockOSList: OS[] = [
    { id: 1, osType: 'Windows', status: 'Active' },
    { id: 2, osType: 'Linux', status: 'Active' },
    { id: 3, osType: 'macOS', status: 'Active' },
    { id: 4, osType: 'Android', status: 'Active' },
    { id: 5, osType: 'iOS', status: 'Active' },
    { id: 6, osType: 'Unix', status: 'Inactive' }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of all OSs with optional status filter
   */
  getAllOS(page: number = 0, size: number = 10, status?: string): Observable<PageResponse<OS>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (status && status !== 'All') {
      params = params.set('status', status);
    }

    return this.http.get<PageResponse<OS>>(this.apiUrl, { params })
      .pipe(
        catchError((error) => {
          console.warn('Failed to load OS list from backend, using mock data. Please ensure your backend is running:', error);
          // Return mock data in paginated format
          return this.getMockPageResponse(page, size, status);
        })
      );
  }

  /**
   * Helper method to create mock paginated response
   */
  private getMockPageResponse(page: number, size: number, status?: string): Observable<PageResponse<OS>> {
    let filteredData = [...this.mockOSList];
    
    // Filter by status if provided
    if (status && status !== 'All') {
      filteredData = filteredData.filter(os => os.status === status);
    }
    
    const startIndex = page * size;
    const endIndex = startIndex + size;
    const content = filteredData.slice(startIndex, endIndex);
    
    const response: PageResponse<OS> = {
      content,
      page,
      size,
      totalElements: filteredData.length,
      totalPages: Math.ceil(filteredData.length / size),
      first: page === 0,
      last: page >= Math.ceil(filteredData.length / size) - 1
    };
    
    return of(response);
  }

  /**
   * Get a specific OS by ID
   */
  getOS(id: number): Observable<OS> {
    return this.http.get<OS>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(() => {
          const os = this.mockOSList.find(item => item.id === id);
          return of(os!);
        })
      );
  }

  /**
   * Create a new OS
   */
  createOS(os: Omit<OS, 'id'>): Observable<OS> {
    const osData = { ...os, status: os.status ?? 'Active' };
    
    return this.http.post<OS>(this.apiUrl, osData)
      .pipe(
        catchError((error) => {
          console.warn('Failed to create OS via API, creating locally for development:', error);
          const newOS = { ...osData, id: Date.now() } as OS;
          this.mockOSList.push(newOS);
          return of(newOS);
        })
      );
  }

  /**
   * Update an existing OS
   */
  updateOS(id: number, os: Partial<OS>): Observable<OS> {
    return this.http.put<OS>(`${this.apiUrl}/${id}`, os)
      .pipe(
        catchError(() => {
          const index = this.mockOSList.findIndex(item => item.id === id);
          if (index !== -1) {
            this.mockOSList[index] = { ...this.mockOSList[index], ...os };
            return of(this.mockOSList[index]);
          }
          throw new Error('OS not found');
        })
      );
  }

  /**
   * Delete an OS by ID
   */
  deleteOS(id: number): Observable<void> {
    return this.http.delete(`${this.apiUrl}/${id}`, { 
      responseType: 'text' as 'json' // Handle 204 No Content properly
    })
      .pipe(
        map(() => void 0), // Convert any response to void
        tap(() => console.log('OS deleted successfully')),
        catchError((error) => {
          console.error('Failed to delete OS via API:', error);
          // Remove from mock data for development
          const index = this.mockOSList.findIndex(item => item.id === id);
          if (index !== -1) {
            this.mockOSList.splice(index, 1);
            return of(void 0);
          }
          throw error;
        })
      );
  }

  /**
   * Search OSs by type (for filtering) with pagination
   */
  searchOS(searchTerm: string, page: number = 0, size: number = 10, status?: string): Observable<PageResponse<OS>> {
    let filteredData = [...this.mockOSList];
    
    if (searchTerm) {
      filteredData = filteredData.filter(os => 
        os.osType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (status && status !== 'All') {
      filteredData = filteredData.filter(os => os.status === status);
    }
    
    // Create paginated response
    const startIndex = page * size;
    const endIndex = startIndex + size;
    const content = filteredData.slice(startIndex, endIndex);
    
    const response: PageResponse<OS> = {
      content,
      page,
      size,
      totalElements: filteredData.length,
      totalPages: Math.ceil(filteredData.length / size),
      first: page === 0,
      last: page >= Math.ceil(filteredData.length / size) - 1
    };
    
    return of(response);
  }

  /**
   * Safe extraction of OS array from any response format
   */
  private extractOSArray(response: any): OS[] {
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
    
    console.warn('Unexpected OS response format:', response);
    return [];
  }
} 