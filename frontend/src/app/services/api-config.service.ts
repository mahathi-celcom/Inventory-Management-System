import { Injectable } from '@angular/core';

export interface ApiEndpoints {
  vendors: {
    getAll: string;
    getById: string;
    create: string;
    update: string;
    delete: string;
    search: string;
  };
  assetTypes: {
    getAll: string;
    create: string;
    update: string;
    delete: string;
  };
  assetMakes: {
    getAll: string;
    getByType: string;
    create: string;
    update: string;
    delete: string;
  };
  assetModels: {
    getAll: string;
    getByMake: string;
    create: string;
    update: string;
    delete: string;
  };
  assetPos: {
    getAll: string;
    getById: string;
    create: string;
    update: string;
    delete: string;
  };
  assets: {
    getAll: string;
    getById: string;
    create: string;
    update: string;
    delete: string;
    search: string;
    stats: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiConfigService {
  private readonly baseUrl = 'http://localhost:8080';

  // Default configuration - can be easily changed to match your backend
  public readonly endpoints: ApiEndpoints = {
    vendors: {
      getAll: '/api/vendors',
      getById: '/api/vendors',
      create: '/api/vendors',
      update: '/api/vendors',
      delete: '/api/vendors',
      search: '/api/vendors/search'
    },
    assetTypes: {
      getAll: '/api/asset-types/all',
      create: '/api/asset-types',
      update: '/api/asset-types',
      delete: '/api/asset-types'
    },
    assetMakes: {
      getAll: '/api/asset-makes',
      getByType: '/api/asset-makes/by-type',
      create: '/api/asset-makes',
      update: '/api/asset-makes',
      delete: '/api/asset-makes'
    },
    assetModels: {
      getAll: '/api/asset-models',
      getByMake: '/api/asset-models/make',
      create: '/api/asset-models',
      update: '/api/asset-models',
      delete: '/api/asset-models'
    },
    assetPos: {
      getAll: '/api/asset-pos',
      getById: '/api/asset-pos',
      create: '/api/asset-pos',
      update: '/api/asset-pos',
      delete: '/api/asset-pos'
    },
    assets: {
      getAll: '/api/assets',
      getById: '/api/assets',
      create: '/api/assets',
      update: '/api/assets',
      delete: '/api/assets',
      search: '/api/assets/search',
      stats: '/api/assets/stats'
    }
  };

  // Method to extract data from different response formats
  extractData<T>(response: any): T[] {
    // Handle different response formats
    if (Array.isArray(response)) {
      return response;
    }
    
    // Wrapped in data property
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    // Paginated response
    if (response.content && Array.isArray(response.content)) {
      return response.content;
    }
    
    // Spring Boot page response
    if (response._embedded && response._embedded.content) {
      return response._embedded.content;
    }
    
    console.warn('Unexpected response format:', response);
    return [];
  }

  // Method to extract single item from response
  extractItem<T>(response: any): T {
    if (response.data) {
      return response.data;
    }
    return response;
  }

  // Log response for debugging
  logResponse(endpoint: string, response: any): void {
    console.log(`API Response from ${endpoint}:`, response);
  }

  // Proxy helper methods
  getEndpointUrl(service: keyof ApiEndpoints, operation: string): string {
    const serviceEndpoints = this.endpoints[service] as any;
    if (!serviceEndpoints || !serviceEndpoints[operation]) {
      throw new Error(`Endpoint not found: ${service}.${operation}`);
    }
    return serviceEndpoints[operation];
  }

  // Build URL with ID for operations that need it
  buildUrlWithId(service: keyof ApiEndpoints, operation: string, id: number | string): string {
    const baseUrl = this.getEndpointUrl(service, operation);
    
    // Validate ID before building URL
    if (id === undefined || id === null || id === '') {
      const errorMsg = `Invalid ID for ${service}.${operation}: ${id} (type: ${typeof id})`;
      console.error('❌ URL Construction Error:', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Convert to string and validate
    const idStr = String(id);
    if (idStr === 'undefined' || idStr === 'null' || idStr === '') {
      const errorMsg = `Invalid ID string for ${service}.${operation}: "${idStr}"`;
      console.error('❌ URL Construction Error:', errorMsg);
      throw new Error(errorMsg);
    }
    
    const finalUrl = `${baseUrl}/${idStr}`;
    console.log(`🔗 Built URL: ${service}.${operation} → ${finalUrl}`);
    return finalUrl;
  }

  // Check if proxy is properly configured (development only)
  checkProxyConfiguration(): void {
    if (!this.isProduction()) {
      console.log('🔗 Proxy Configuration Check:');
      console.log('- Frontend URL: http://localhost:4200');
      console.log('- Backend URL: http://localhost:8080');
      console.log('- Proxy Pattern: /api/* → http://localhost:8080/api/*');
      console.log('- All /api requests will be automatically proxied to backend');
    }
  }

  private isProduction(): boolean {
    // Handle SSR - window is not available on server
    if (typeof window === 'undefined') {
      return false; // Assume development during SSR
    }
    // Simple production check - in real app, use environment
    return window.location.hostname !== 'localhost';
  }
} 