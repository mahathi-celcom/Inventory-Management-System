import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { ApiConfigService } from './api-config.service';
import {
  AssetUserAssignment,
  AssetUserAssignmentRequest,
  AssetUserAssignmentDTO,
  AssetUserAssignmentResponse,
  AssetTag,
  AssetTagAssignment,
  AssetTagAssignmentRequest,
  AssetTagAssignmentDTO,
  AssetTagAssignmentByNameDTO,
  AssetTagAssignmentResponse,
  ActiveUser
} from '../models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private http = inject(HttpClient);
  private apiConfig = inject(ApiConfigService);

  // State management
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor() {}

  // ✅ USER ASSIGNMENT METHODS

  /**
   * Get active users for assignment dropdown
   * GET /api/users/active
   */
  getActiveUsers(): Observable<ActiveUser[]> {
    this.setLoading(true);
    this.clearError();

    // Try /api/users/active first, fallback to /api/users if needed
    const url = '/api/users/active';
    console.log('🔗 Fetching active users:', url);

    return this.http.get<any>(url)
      .pipe(
        map(response => {
          console.log('📥 Active users response:', response);
          console.log('📥 Response type:', typeof response);
          console.log('📥 Is array:', Array.isArray(response));
          
          // Handle paginated response format from backend
          const data = response.content || response.data || response;
          console.log('📥 Extracted data:', data);
          console.log('📥 Data length:', Array.isArray(data) ? data.length : 'Not an array');
          
          const users = Array.isArray(data) ? data : [];
          
          if (users.length > 0) {
            console.log('📥 First user structure:', users[0]);
            console.log('📥 All users raw:', users);
          } else {
            console.warn('⚠️ No users returned from /api/users/active, this might be due to filtering');
          }
          
          // Map backend user format to frontend ActiveUser format
          const mappedUsers = users.map((user: any) => {
            const mappedUser = {
              id: user.id,
              name: user.fullNameOrOfficeName || user.fullName || user.name || `User ${user.id}`,
              email: user.email || '',
              department: user.department || '',
              isActive: user.status === 'Active'
            } as ActiveUser;
            
            console.log('📥 Mapped user:', mappedUser);
            return mappedUser;
          });
          
          console.log('📥 Final mapped users:', mappedUsers);
          
          // If no users found, suggest checking the filtering criteria
          if (mappedUsers.length === 0) {
            console.warn('⚠️ No active users found. Backend might be filtering by isOfficeAsset or other criteria.');
            console.warn('💡 Consider using /api/users endpoint if you need all users regardless of office asset status.');
          }
          
          return mappedUsers;
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('❌ Error fetching active users:', error);
          console.error('💡 If this endpoint is too restrictive, consider using /api/users instead');
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Get all users (alternative to getActiveUsers if filtering is too restrictive)
   * GET /api/users
   */
  getAllUsers(): Observable<ActiveUser[]> {
    this.setLoading(true);
    this.clearError();

    const url = '/api/users';
    console.log('🔗 Fetching all users:', url);

    return this.http.get<any>(url)
      .pipe(
        map(response => {
          console.log('📥 All users response:', response);
          
          // Handle paginated response format from backend
          const data = response.content || response.data || response;
          const users = Array.isArray(data) ? data : [];
          
          console.log('📥 Total users found:', users.length);
          
          // Map and filter for active users only
          const mappedUsers = users
            .filter((user: any) => user.status === 'Active') // Client-side filtering for active users
            .map((user: any) => ({
              id: user.id,
              name: user.fullNameOrOfficeName || user.fullName || user.name || `User ${user.id}`,
              email: user.email || '',
              department: user.department || '',
              isActive: true // Already filtered for active users
            } as ActiveUser));
          
          console.log('📥 Active users after filtering:', mappedUsers);
          return mappedUsers;
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('❌ Error fetching all users:', error);
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Get current user assignment for an asset
   * GET /api/asset-assignment/asset/{assetId}
   */
  getCurrentUserAssignment(assetId: number): Observable<AssetUserAssignment | null> {
    this.setLoading(true);
    this.clearError();

    const url = `/api/asset-assignment/asset/${assetId}`;
    console.log('🔗 Fetching current user assignment:', url);

    return this.http.get<any>(url)
      .pipe(
        map(response => {
          console.log('📥 Current assignment response:', response);
          const data = response.data || response;
          return data || null;
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('❌ Error fetching current assignment:', error);
          this.setLoading(false);
          // Return null if no assignment found (404 is expected)
          if (error.status === 404) {
            return [null];
          }
          return this.handleError(error);
        })
      );
  }

  /**
   * Assign user to asset using new API endpoint
   * POST /api/asset-assignment/assign-user
   */
  assignUserToAsset(assignment: AssetUserAssignmentDTO): Observable<AssetUserAssignmentResponse> {
    this.setLoading(true);
    this.clearError();

    const url = '/api/asset-assignment/assign-user';
    console.log('🔗 Assigning user to asset (new API):', url);
    console.log('🔍 Assignment payload:', JSON.stringify(assignment, null, 2));

    // Validate request payload
    if (!assignment.assetId || !assignment.userId) {
      const error = new Error('Invalid assignment: assetId and userId are required');
      console.error('❌ Validation error:', error.message);
      this.setLoading(false);
      return this.handleError({ message: error.message } as any);
    }

    return this.http.post<any>(url, assignment)
      .pipe(
        map(response => {
          console.log('✅ User assignment response:', response);
          const data = response.data || response;
          return {
            assignment: data.assignment || data,
            message: data.message || 'User assigned successfully'
          } as AssetUserAssignmentResponse;
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('❌ Error assigning user:', error);
          console.error('❌ Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Legacy assign user to asset method (keeping for backward compatibility)
   * POST /api/asset-assignments
   */
  assignUserToAssetLegacy(request: AssetUserAssignmentRequest): Observable<AssetUserAssignmentResponse> {
    this.setLoading(true);
    this.clearError();

    const url = '/api/asset-assignments';
    console.log('🔗 Assigning user to asset (legacy):', url, request);
    console.log('🔍 Request payload:', JSON.stringify(request, null, 2));

    // Validate request payload
    if (!request.assetId || !request.userId) {
      const error = new Error('Invalid request: assetId and userId are required');
      console.error('❌ Validation error:', error.message);
      this.setLoading(false);
      return this.handleError({ message: error.message } as any);
    }

    return this.http.post<any>(url, request)
      .pipe(
        map(response => {
          console.log('✅ User assignment response:', response);
          const data = response.data || response;
          return {
            assignment: data.assignment || data,
            message: data.message || 'User assigned successfully'
          } as AssetUserAssignmentResponse;
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('❌ Error assigning user:', error);
          console.error('❌ Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Unassign user from asset
   * DELETE /api/asset-assignments/{assignmentId}
   */
  unassignUserFromAsset(assignmentId: number): Observable<{ message: string }> {
    this.setLoading(true);
    this.clearError();

    const url = `/api/asset-assignments/${assignmentId}`;
    console.log('🔗 Unassigning user from asset:', url);

    return this.http.delete<any>(url)
      .pipe(
        map(response => {
          console.log('✅ User unassignment response:', response);
          return {
            message: response.message || 'User unassigned successfully'
          };
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('❌ Error unassigning user:', error);
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  // ✅ TAG ASSIGNMENT METHODS

  /**
   * Get all available tags
   * GET /api/asset-tags
   */
  getAvailableTags(): Observable<AssetTag[]> {
    this.setLoading(true);
    this.clearError();

    const url = '/api/asset-tags';
    console.log('🔗 Fetching available tags:', url);

    return this.http.get<any>(url)
      .pipe(
        map(response => {
          console.log('📥 Available tags response:', response);
          // Handle paginated response format from backend
          const data = response.content || response.data || response;
          const tags = Array.isArray(data) ? data : [];
          
          // Map backend tag format to frontend AssetTag format
          return tags.map((tag: any) => ({
            id: tag.id,
            name: tag.name,
            description: tag.description || '',
            color: tag.color || '#3B82F6', // Default blue color
            category: tag.category || 'General',
            isActive: tag.isActive !== false // Default to true if not specified
          } as AssetTag));
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('❌ Error fetching tags:', error);
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Get assigned tags for an asset with enhanced response data
   * GET /api/asset-tag-assignments/asset/{assetId}
   */
  getAssetTagAssignments(assetId: number): Observable<AssetTagAssignment[]> {
    this.setLoading(true);
    this.clearError();

    const url = `/api/asset-tag-assignments/asset/${assetId}`;
    console.log('🔗 Fetching asset tag assignments:', url);

    return this.http.get<any>(url)
      .pipe(
        map(response => {
          console.log('📥 Asset tag assignments response:', response);
          const data = response.content || response.data || response;
          const assignments = Array.isArray(data) ? data : [];
          
          // Map backend response to frontend format with enhanced fields
          return assignments.map((assignment: any) => ({
            id: assignment.id,
            assetId: assignment.assetId,
            tagId: assignment.tagId,
            tagName: assignment.tagName,
            assetName: assignment.assetName,
            assignedDate: assignment.assignedDate || assignment.assignedAt, // Support both field names
            assignedAt: assignment.assignedAt,
            remarks: assignment.remarks,
            assignedById: assignment.assignedById,
            assignedByName: assignment.assignedByName
          } as AssetTagAssignment));
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('❌ Error fetching asset tag assignments:', error);
          this.setLoading(false);
          // Return empty array if no assignments found (404 is expected)
          if (error.status === 404) {
            return of([]);
          }
          return this.handleError(error);
        })
      );
  }

  /**
   * Assign tag to asset using new API endpoint
   * POST /api/asset-assignment/assign-tag
   */
  assignTagToAsset(assignment: AssetTagAssignmentDTO): Observable<AssetTagAssignmentResponse> {
    this.setLoading(true);
    this.clearError();

    const url = '/api/asset-assignment/assign-tag';
    console.log('🔗 Assigning tag to asset (new API):', url);
    console.log('🔍 Tag assignment payload:', JSON.stringify(assignment, null, 2));

    // Validate request payload
    if (!assignment.assetId || !assignment.tagId) {
      const error = new Error('Invalid assignment: assetId and tagId are required');
      console.error('❌ Validation error:', error.message);
      this.setLoading(false);
      return this.handleError({ message: error.message } as any);
    }

    return this.http.post<any>(url, assignment)
      .pipe(
        map(response => {
          console.log('✅ Tag assignment response:', response);
          const data = response.data || response;
          return {
            assignment: data.assignment || data,
            message: data.message || 'Tag assigned successfully'
          } as AssetTagAssignmentResponse;
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('❌ Error assigning tag:', error);
          console.error('❌ Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Assign tag to asset by name using new API endpoint
   * POST /api/asset-tag-assignments/assign-tag-by-name
   */
  assignTagToAssetByName(assignment: AssetTagAssignmentByNameDTO): Observable<AssetTagAssignmentResponse> {
    this.setLoading(true);
    this.clearError();

    const url = '/api/asset-tag-assignments/by-name';
    console.log('🔗 Assigning tag to asset by name (new API):', url);
    console.log('🔍 Tag assignment by name payload:', JSON.stringify(assignment, null, 2));

    // Validate request payload
    if (!assignment.assetId || !assignment.tagName || assignment.tagName.trim().length === 0) {
      const error = new Error('Invalid assignment: assetId and tagName are required');
      console.error('❌ Validation error:', error.message);
      this.setLoading(false);
      return this.handleError({ message: error.message } as any);
    }

    return this.http.post<any>(url, assignment)
      .pipe(
        map(response => {
          console.log('✅ Tag assignment by name response:', response);
          const data = response.data || response;
          return {
            assignment: data.assignment || data,
            message: data.message || 'Tag assigned successfully'
          } as AssetTagAssignmentResponse;
        }),
        tap(() => this.setLoading(false)),
        catchError(error => {
          console.error('❌ Error assigning tag by name:', error);
          console.error('❌ Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Legacy assign tag to asset method (keeping for backward compatibility)
   * Mock implementation using localStorage
   */
  assignTagToAssetLegacy(request: AssetTagAssignmentRequest): Observable<AssetTagAssignmentResponse> {
    this.setLoading(true);
    this.clearError();

    console.log('🔗 Assigning tag to asset (legacy mock):', request);

    return new Observable(observer => {
      try {
        // Get existing assignments
        const storageKey = `asset_tag_assignments_${request.assetId}`;
        const stored = localStorage.getItem(storageKey);
        const assignments: AssetTagAssignment[] = stored ? JSON.parse(stored) : [];
        
        // Check if already assigned
        const existingAssignment = assignments.find(a => a.tagId === request.tagId);
        if (existingAssignment) {
          this.setLoading(false);
          observer.error(new Error('Tag is already assigned to this asset'));
          return;
        }
        
        // Create new assignment
        const newAssignment: AssetTagAssignment = {
          id: Date.now(), // Simple ID generation
          assetId: request.assetId,
          tagId: request.tagId,
          assignedDate: new Date().toISOString(),
          assignedById: 1, // Mock user ID
          assignedByName: 'Current User'
        };
        
        // Add to assignments
        assignments.push(newAssignment);
        localStorage.setItem(storageKey, JSON.stringify(assignments));
        
        console.log('✅ Mock tag assignment created:', newAssignment);
        
        this.setLoading(false);
        observer.next({
          assignment: newAssignment,
          message: 'Tag assigned successfully'
        });
        observer.complete();
      } catch (error) {
        console.error('❌ Error assigning tag (mock):', error);
        this.setLoading(false);
        observer.error(error);
      }
    });
  }

  /**
   * Unassign tag from asset
   * Mock implementation using localStorage (since backend doesn't have tag assignments)
   */
  unassignTagFromAsset(assetId: number, tagId: number): Observable<{ message: string }> {
    this.setLoading(true);
    this.clearError();

    console.log('🔗 Unassigning tag from asset (mock):', { assetId, tagId });

    return new Observable(observer => {
      try {
        // Get existing assignments
        const storageKey = `asset_tag_assignments_${assetId}`;
        const stored = localStorage.getItem(storageKey);
        const assignments: AssetTagAssignment[] = stored ? JSON.parse(stored) : [];
        
        // Find and remove the assignment
        const initialLength = assignments.length;
        const filteredAssignments = assignments.filter(a => a.tagId !== tagId);
        
        if (filteredAssignments.length === initialLength) {
          this.setLoading(false);
          observer.error(new Error('Tag assignment not found'));
          return;
        }
        
        // Save updated assignments
        localStorage.setItem(storageKey, JSON.stringify(filteredAssignments));
        
        console.log('✅ Mock tag assignment removed');
        
        this.setLoading(false);
        observer.next({
          message: 'Tag unassigned successfully'
        });
        observer.complete();
      } catch (error) {
        console.error('❌ Error unassigning tag (mock):', error);
        this.setLoading(false);
        observer.error(error);
      }
    });
  }

  // ✅ UTILITY METHODS

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || 
                   error.error?.error || 
                   `Server returned code ${error.status}: ${error.statusText}`;
    }
    
    this.errorSubject.next(errorMessage);
    console.error('Assignment Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Clear all cached data and reset state
   */
  clearCache(): void {
    this.setLoading(false);
    this.clearError();
  }
} 