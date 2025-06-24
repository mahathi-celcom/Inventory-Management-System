import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User, PageResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of all users with optional filters
   * ✅ Strictly uses real backend data - no mock data
   */
  getAllUsers(page: number = 0, size: number = 10, filters?: any): Observable<PageResponse<User>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.department && filters.department.trim()) params = params.set('department', filters.department);
      if (filters.status && filters.status !== 'All') params = params.set('status', filters.status);
      if (filters.userType && filters.userType !== 'All') params = params.set('userType', filters.userType);
      if (filters.country && filters.country.trim()) params = params.set('country', filters.country);
      if (filters.city && filters.city.trim()) params = params.set('city', filters.city);
      if (filters.employeeCode && filters.employeeCode.trim()) params = params.set('employeeCode', filters.employeeCode);
    }

    return this.http.get<PageResponse<User>>(this.apiUrl, { params })
      .pipe(
        tap(response => console.log('Users loaded from backend:', response)),
        catchError((error) => {
          console.error('Failed to load users from backend:', error);
          throw error; // Re-throw error instead of falling back to mock data
        })
      );
  }

  /**
   * Get a specific user by ID
   */
  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(user => console.log('User loaded from backend:', user)),
        catchError((error) => {
          console.error('Failed to load user from backend:', error);
          throw error;
        })
      );
  }

  /**
   * Create a new user
   */
  createUser(user: Partial<User>): Observable<User> {
    const userData = this.prepareUserData(user);
    return this.http.post<User>(this.apiUrl, userData)
      .pipe(
        tap(createdUser => console.log('User created successfully:', createdUser)),
        catchError((error) => {
          console.error('Failed to create user:', error);
          throw error;
        })
      );
  }

  /**
   * Update an existing user
   */
  updateUser(id: number, user: Partial<User>): Observable<User> {
    const userData = this.prepareUserData(user);
    return this.http.put<User>(`${this.apiUrl}/${id}`, userData)
      .pipe(
        tap(updatedUser => console.log('User updated successfully:', updatedUser)),
        catchError((error) => {
          console.error('Failed to update user:', error);
          throw error;
        })
      );
  }

  /**
   * Delete a user by ID
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete(`${this.apiUrl}/${id}`, { 
      responseType: 'text' as 'json'
    })
      .pipe(
        map(() => void 0),
        tap(() => console.log('User deleted successfully')),
        catchError((error) => {
          console.error('Failed to delete user:', error);
          throw error;
        })
      );
  }

  /**
   * Search users with pagination
   */
  searchUsers(searchTerm: string, page: number = 0, size: number = 10, filters?: any): Observable<PageResponse<User>> {
    const searchFilters = { ...filters, search: searchTerm };
    return this.getAllUsers(page, size, searchFilters);
  }

  /**
   * Get list of departments
   */
  getDepartments(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/departments`)
      .pipe(
        catchError((error) => {
          console.error('Failed to load departments:', error);
          throw error;
        })
      );
  }

  /**
   * Get user statistics
   */
  getUserStats(): Observable<any> {
    return this.getAllUsers(0, 1000).pipe(
      map(response => {
        const users = response.content;
        return {
          total: users.length,
          active: users.filter(u => u.status === 'Active').length,
          inactive: users.filter(u => u.status === 'Inactive').length,
          permanent: users.filter(u => u.userType === 'Permanent').length,
          contractors: users.filter(u => u.userType === 'Contractor').length,
          officeAssets: users.filter(u => u.userType === 'OfficeAsset').length
        };
      })
    );
  }

  /**
   * Get list of unique countries for filter dropdown
   */
  getCountries(): Observable<string[]> {
    return this.getAllUsers(0, 1000).pipe(
      map(response => {
        const countries = response.content
          .map(user => user.country)
          .filter((country): country is string => !!country)
          .filter((country, index, array) => array.indexOf(country) === index)
          .sort();
        return countries;
      })
    );
  }

  /**
   * Get list of unique cities for filter dropdown
   */
  getCities(): Observable<string[]> {
    return this.getAllUsers(0, 1000).pipe(
      map(response => {
        const cities = response.content
          .map(user => user.city)
          .filter((city): city is string => !!city)
          .filter((city, index, array) => array.indexOf(city) === index)
          .sort();
        return cities;
      })
    );
  }

  /**
   * Get list of unique employee codes for filter dropdown
   */
  getEmployeeCodes(): Observable<string[]> {
    return this.getAllUsers(0, 1000).pipe(
      map(response => {
        const codes = response.content
          .map(user => user.employeeCode)
          .filter((code): code is string => !!code)
          .filter((code, index, array) => array.indexOf(code) === index)
          .sort();
        return codes;
        })
      );
  }

  /**
   * Prepare user data for backend submission
   */
  private prepareUserData(user: Partial<User>): any {
    const userData = { ...user };
    
    // Ensure proper date formatting
    if (userData.createdAt && typeof userData.createdAt === 'string') {
      userData.createdAt = new Date(userData.createdAt).toISOString();
    }
    
    // Set isOfficeAsset based on userType
    userData.isOfficeAsset = userData.userType === 'OfficeAsset';
    
    // Remove email if not required
    if (!userData.email || userData.email.trim() === '') {
      delete userData.email;
    }
    
    return userData;
  }
} 