import { Injectable } from '@angular/core';
// import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DebugService {
  private readonly isDebugEnabled = true; // Set to false in production

  log(message: string, data?: any): void {
    if (this.isDebugEnabled) {
      console.log(message, data);
    }
  }

  info(message: string, data?: any): void {
    if (this.isDebugEnabled) {
      console.info(message, data);
    }
  }

  warn(message: string, data?: any): void {
    if (this.isDebugEnabled) {
      console.warn(message, data);
    }
  }

  error(message: string, data?: any): void {
    if (this.isDebugEnabled) {
      console.error(message, data);
    }
  }

  group(label: string): void {
    if (this.isDebugEnabled) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.isDebugEnabled) {
      console.groupEnd();
    }
  }

  // Vendor-specific debug methods
  logVendorOperation(operation: string, data: any): void {
    this.log(`🔄 ${operation} operation:`, data);
  }

  logVendorSuccess(operation: string, data: any): void {
    this.log(`✅ ${operation} successful:`, data);
  }

  logVendorError(operation: string, error: any): void {
    this.error(`❌ ${operation} failed:`, error);
  }

  logVendorState(state: any): void {
    this.log('🔍 Current Vendor Management State:', state);
  }
} 