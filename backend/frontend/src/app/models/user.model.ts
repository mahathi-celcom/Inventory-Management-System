export interface User {
  id?: number;
  fullNameOrOfficeName: string;
  employeeCode: string;
  userType: 'Permanent' | 'Contractor' | 'OfficeAsset';
  email?: string; // Optional - required only for Permanent users
  isOfficeAsset: boolean;
  department?: string; // Optional - shown only when isOfficeAsset is true
  designation?: string;
  country?: string;
  city?: string;
  location?: string;
  status: string;
  createdAt?: string;
}

// Helper functions for User
export class UserHelper {
  static getUsername(user: User): string {
    return user.fullNameOrOfficeName;
  }

  static isEmailRequired(user: User): boolean {
    return user.userType === 'Permanent';
  }

  static isDepartmentVisible(user: User): boolean {
    return user.isOfficeAsset === true;
  }
}

export interface UserFilter {
  search: string;
  department: string;
  status: string;
  userType: string;
  country?: string;
  city?: string;
  employeeCode?: string;
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

// User Status Constants
export const USER_STATUS = {
  ALL: 'All',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
} as const;

// User Type Constants - Updated to match backend schema
export const USER_TYPE = {
  ALL: 'All',
  PERMANENT: 'Permanent',
  CONTRACTOR: 'Contractor',
  OFFICE_ASSET: 'OfficeAsset'
} as const;

// User Type Display Labels
export const USER_TYPE_LABELS = {
  'Permanent': 'Permanent Employee',
  'Contractor': 'Contractor',
  'OfficeAsset': 'Office Asset'
} as const;

// Configuration Constants
export const USER_CONFIG = {
  PAGE_SIZE: 10,
  MIN_NAME_LENGTH: 2,
  MIN_DEPARTMENT_LENGTH: 2,
  MIN_DESIGNATION_LENGTH: 2,
  MIN_LOCATION_LENGTH: 2
} as const;

// User Messages
export const USER_MESSAGES = {
  SUCCESS: {
    CREATE: 'User created successfully!',
    UPDATE: 'User updated successfully!',
    DELETE: 'User deleted successfully!'
  },
  ERROR: {
    NETWORK: 'Network error. Please check your connection.',
    SERVER: 'Server error. Please try again later.',
    VALIDATION: 'Please check your input and try again.',
    NOT_FOUND: 'User not found.',
    BACKEND_RUNNING: 'Backend service is not running. Using mock data for development.'
  }
} as const; 