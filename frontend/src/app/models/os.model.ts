export interface OS {
  id?: number;
  osType: string;
  status?: string;
}

export interface OSVersion {
  id?: number;
  osId: number;
  versionNumber: string;
  status?: string;
  osType?: string; // For display purposes, mapped from OS
}

export interface OSFilter {
  search: string;
  status: string;
}

export interface OSVersionFilter {
  search: string;
  status: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// Constants
export const OS_STATUS = {
  ALL: 'All',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  NOT_FOR_BUYING: 'Not for Buying'
} as const;

export const OS_MESSAGES = {
  SUCCESS: {
    CREATE: 'OS created successfully!',
    UPDATE: 'OS updated successfully!',
    DELETE: 'OS deleted successfully!'
  },
  ERROR: {
    CREATE: 'Failed to create OS.',
    UPDATE: 'Failed to update OS.',
    DELETE: 'Failed to delete OS.',
    LOAD: 'Failed to load OS list.',
    NETWORK: 'Network connection error.',
    SERVER: 'Server error occurred.',
    BACKEND_RUNNING: 'Please ensure the backend server is running.'
  }
} as const;

export const OS_VERSION_MESSAGES = {
  SUCCESS: {
    CREATE: 'OS Version created successfully!',
    UPDATE: 'OS Version updated successfully!',
    DELETE: 'OS Version deleted successfully!'
  },
  ERROR: {
    CREATE: 'Failed to create OS Version.',
    UPDATE: 'Failed to update OS Version.',
    DELETE: 'Failed to delete OS Version.',
    LOAD: 'Failed to load OS Version list.',
    NETWORK: 'Network connection error.',
    SERVER: 'Server error occurred.',
    BACKEND_RUNNING: 'Please ensure the backend server is running.'
  }
} as const;

export const OS_CONFIG = {
  PAGE_SIZE: 10,
  MIN_TYPE_LENGTH: 2,
  MIN_VERSION_LENGTH: 1
} as const; 