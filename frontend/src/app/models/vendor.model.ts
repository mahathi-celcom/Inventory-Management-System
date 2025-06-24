export interface Vendor {
  vendorId: number;
  name: string;
  contactInfo?: string;
  status: string;
}

export interface VendorFilter {
  search?: string;
  status?: string;
}

// Constants for repeated literals
export const VENDOR_STATUS = {
  ACTIVE: 'Active' as const,
  INACTIVE: 'Inactive' as const,
  NOT_FOR_BUYING: 'Not for Buying' as const,
  ALL: 'All' as const
} as const;

export const VENDOR_MESSAGES = {
  SUCCESS: {
    CREATED: 'created successfully!',
    UPDATED: 'updated successfully!',
    DELETED: 'deleted successfully!'
  },
  ERROR: {
    NETWORK: 'Please check your network connection.',
    SERVER: 'Server error occurred.',
    NOT_FOUND: 'not found.',
    VALIDATION: 'Invalid data provided.',
    CONFLICT: 'already exists.',
    PERMISSION: 'You do not have permission',
    DELETE_CONFLICT: 'Cannot delete vendor as it may be referenced by other records.',
    BACKEND_RUNNING: 'Please check your network connection and ensure the backend server is running.'
  },
  FORM: {
    REQUIRED: 'is required.',
    MIN_LENGTH: 'must be at least'
  }
} as const;

export const VENDOR_CONFIG = {
  PAGE_SIZE: 10,
  SUCCESS_MESSAGE_DURATION: 3000,
  ERROR_MESSAGE_DURATION: 5000,
  MIN_NAME_LENGTH: 2
} as const;

export type VendorStatus = typeof VENDOR_STATUS[keyof typeof VENDOR_STATUS];

// Utility function to validate vendor object
export function validateVendor(vendor: any): vendor is Vendor {
  return vendor &&
         typeof vendor.vendorId === 'number' &&
         vendor.vendorId > 0 &&
         typeof vendor.name === 'string' &&
         vendor.name.trim().length > 0 &&
         typeof vendor.status === 'string';
} 