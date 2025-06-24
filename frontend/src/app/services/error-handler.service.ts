import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor() { }

  handleError(error: HttpErrorResponse, operation: string): string {
    let errorMessage = '';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to server. Please check if the backend is running.';
          break;
        case 400:
          errorMessage = `Bad Request: ${error.error?.message || 'Invalid data sent to server'}`;
          break;
        case 401:
          errorMessage = 'Unauthorized: Please check your credentials';
          break;
        case 403:
          errorMessage = 'Forbidden: You do not have permission for this action';
          break;
        case 404:
          errorMessage = 'Not Found: The requested resource was not found';
          break;
        case 500:
          errorMessage = `Server Error: ${error.error?.message || 'Internal server error occurred'}`;
          break;
        default:
          errorMessage = `Unexpected Error (${error.status}): ${error.error?.message || error.message}`;
      }
    }

    console.error(`${operation} failed:`, {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error,
      message: errorMessage
    });

    return errorMessage;
  }

  logSuccess(operation: string, data?: any): void {
    console.log(`✅ ${operation} successful`, data ? { data } : '');
  }
} 