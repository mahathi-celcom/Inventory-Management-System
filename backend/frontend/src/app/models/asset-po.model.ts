export interface AssetPo {
  poId?: number;
  acquisitionType: 'BOUGHT' | 'RENTED';
  poNumber: string;
  invoiceNumber: string;
  acquisitionDate: string; // YYYY-MM-DD
  vendorId: number;
  ownerType: 'Celcom' | 'Vendor';
  leaseEndDate?: string;
  rentalAmount?: number;
  minContractPeriod?: number;
  acquisitionPrice: number;
  depreciationPct: number;
  currentPrice: number;
  totalDevices: number;
  warrantyExpiryDate?: string; // YYYY-MM-DD
}

export interface AssetPoWithDetails extends AssetPo {
  id: number;
  name?: string;
  createdAssetsCount?: number;
  remainingAssetsCount?: number;
  isExpanded?: boolean;
}

export interface AssetPoFilter {
  search?: string;
  acquisitionType?: string;
  ownerType?: string;
  vendorId?: number;
  isLeaseExpiring?: boolean;
}

// Constants for Asset PO dropdown options
export const ACQUISITION_TYPE_OPTIONS = [
  { value: 'BOUGHT', label: 'Bought' },
  { value: 'RENTED', label: 'Rented' }
] as const;

export const OWNER_TYPE_OPTIONS = [
  { value: 'Celcom', label: 'Celcom' },
  { value: 'Vendor', label: 'Vendor' }
] as const;

// ✅ NEW: Response interface for cascade update operations
export interface AssetPoCascadeUpdateResponse {
  assetPO: AssetPo;
  linkedAssetsUpdated: number;
  message: string;
}

// ✅ NEW: Response interface for simple cascade update operations
export interface AssetPoSimpleCascadeResponse {
  assetPo: AssetPo;
  affectedAssets: number;
}

// ✅ NEW: Response interface for PO migration operations
export interface AssetPoMigrationResponse {
  oldPoNumber: string;
  newPoNumber: string;
  newAssetPO: AssetPo;
  assetsUpdated: number;
  status: 'SUCCESS' | 'FAILED';
  message: string;
}

// Legacy interface for backward compatibility
export interface LegacyVendor {
  id: number;
  name: string;
  status?: string;
}

// Constants for Asset PO
export const ASSET_PO_CONFIG = {
  PAGE_SIZE: 10,
  SUCCESS_MESSAGE_DURATION: 3000,
  ERROR_MESSAGE_DURATION: 5000
} as const;

export const ASSET_PO_MESSAGES = {
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
    MISSING_ID: 'Missing ID information',
    INVALID_ID: 'Invalid ID provided'
  }
} as const;

// Utility function to validate Asset PO object
export function validateAssetPo(po: any): po is AssetPo {
  return po &&
         typeof po.poNumber === 'string' &&
         po.poNumber.trim().length > 0 &&
         typeof po.acquisitionType === 'string' &&
         ['BOUGHT', 'RENTED'].includes(po.acquisitionType) &&
         typeof po.vendorId === 'number' &&
         po.vendorId > 0;
}

// Utility function to extract ID from Asset PO with fallback
export function extractAssetPoId(po: any): number | null {
  if (!po) return null;
  
  // Try different possible ID field names
  const id = po.poId || po.id || po.assetPoId;
  
  if (id !== undefined && id !== null && Number.isInteger(Number(id)) && Number(id) > 0) {
    return Number(id);
  }
  
  return null;
}

// Utility function to validate Asset PO ID
export function isValidAssetPoId(id: any): id is number {
  return id !== undefined && 
         id !== null && 
         Number.isInteger(Number(id)) && 
         Number(id) > 0;
}

// New interfaces for expandable PO view
export interface AssetFormData {
  typeId?: number;
  makeId?: number;
  modelId?: number;
  name: string;
  serialNumber: string;
  status: string;
  ownerType: string;
  acquisitionType: string;
  osId?: number;
  osVersionId?: number;
  poNumber: string;
  acquisitionPrice?: number;
  rentalAmount?: number;
  currentPrice?: number;
  vendorId?: number;
  acquisitionDate?: string;
  warrantyExpiry?: string;
  leaseEndDate?: string;
  tags?: string;
  // Additional fields for form tracking
  formIndex?: number;
  isValid?: boolean;
  errors?: { [key: string]: string };
}

export interface AssetBulkCreationRequest {
  poNumber: string;
  assets: AssetFormData[];
}

export interface AssetBulkCreationResponse {
  successCount: number;
  failedAssets: {
    asset: AssetFormData;
    error: string;
  }[];
  createdAssets: any[];
  message: string;
}

export interface PODetails {
  poNumber: string;
  invoiceNumber: string;
  acquisitionDate: string;
  ownerType: string;
  acquisitionType: string;
  vendorId: number;
  rentalAmount?: number;
  acquisitionPrice: number;
  depreciationPct?: number;
  currentPrice: number;
  minContractPeriod?: number;
  leaseEndDate?: string;
  totalDevices?: number;
} 