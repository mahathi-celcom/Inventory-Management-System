export interface Asset {
  assetId?: number;
  typeId?: number;
  makeId?: number;
  modelId?: number;
  name: string;
  serialNumber: string;
  itAssetCode?: string;
  macAddress?: string;
  ipv4Address?: string;
  status: string;
  ownerType: string;
  acquisitionType: string;
  currentUserId?: number;
  inventoryLocation?: string;
  osId?: number;
  osVersionId?: number;
  poNumber?: string;
  invoiceNumber?: string;
  acquisitionDate?: string;
  warrantyExpiry?: string;
  extendedWarrantyExpiry?: string;
  leaseEndDate?: string;
  vendorId?: number;
  extendedWarrantyVendorId?: number;
  rentalAmount?: number;
  acquisitionPrice?: number;
  depreciationPct?: number;
  currentPrice?: number;
  minContractPeriod?: number;
  tags?: string;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  assetCategory: 'HARDWARE' | 'SOFTWARE';
  licenseName?: string;
  licenseValidityPeriod?: Date | string;
  warrantyStatus?: string;
  licenseStatus?: string;
}

// New DTO interfaces based on backend
export interface AssetModelDTO {
  id?: number;
  makeId: number;
  name: string;
  ram?: string;
  storage?: string;
  processor?: string;
  status?: string;
}

export interface AssetPODTO {
  id?: number;
  acquisitionType: string;
  poNumber: string;
  invoiceNumber?: string;
  acquisitionDate?: string;
  vendorId?: number;
  name?: string;
  ownerType: string;
  leaseEndDate?: string;
  rentalAmount?: number;
  minContractPeriod?: number;
  acquisitionPrice?: number;
  depreciationPct?: number;
  currentPrice?: number;
  totalDevices?: number;
}

export interface OSVersionDTO {
  id?: number;
  osId: number;
  versionNumber: string;
  status?: string;
}

export interface AssetSummary {
  totalAssets: number;
  activeAssets: number;
  brokenAssets: number;
  assignedAssets: number;
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

export interface AssetFilterOptions {
  search?: string;
  status?: string;
  ownership?: string;
  typeId?: string;
  vendorId?: string;
  model?: string;
  osVersion?: string;
  assignmentStatus?: string;
  showBrokenAssets?: boolean;
  modelId?: number;
  osVersionId?: number;
  makeId?: number;
  currentUserId?: number;
  page?: number;
  size?: number;
  sort?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface AssetFilter {
  search: string;
  status: string;
  ownerType: string;
  acquisitionType: string;
  vendorId: string;
  makeId: string;
  typeId: string;
}

// Asset Status Constants - API-safe values that match backend
export const ASSET_STATUS = {
  IN_STOCK: 'IN_STOCK',
  ACTIVE: 'ACTIVE', 
  IN_REPAIR: 'IN_REPAIR',
  BROKEN: 'BROKEN',
  CEASED: 'CEASED'
} as const;

// Display mapping for UI (maps API values to user-friendly display)
export const ASSET_STATUS_DISPLAY = {
  IN_STOCK: 'In Stock',
  ACTIVE: 'Active',
  IN_REPAIR: 'In Repair', 
  BROKEN: 'Broken',
  CEASED: 'Ceased'
} as const;

// Asset Status for filtering (includes All option)
export const ASSET_STATUS_FILTER = {
  ALL: 'All',
  IN_STOCK: 'IN_STOCK',
  ACTIVE: 'ACTIVE',
  IN_REPAIR: 'IN_REPAIR',
  BROKEN: 'BROKEN',
  CEASED: 'CEASED'
} as const;

// Filter display mapping
export const ASSET_STATUS_FILTER_DISPLAY = {
  ALL: 'All',
  IN_STOCK: 'In Stock',
  ACTIVE: 'Active',
  IN_REPAIR: 'In Repair',
  BROKEN: 'Broken',
  CEASED: 'Ceased'
} as const;

// Updated Owner Type Constants - Only Celcom and Vendor
export const OWNER_TYPE = {
  ALL: 'All',
  CELCOM: 'Celcom',
  VENDOR: 'Vendor'
} as const;

// Updated Acquisition Type Constants - Only Bought, Leased, Rented
export const ACQUISITION_TYPE = {
  ALL: 'All',
  BOUGHT: 'Bought',
  LEASED: 'Leased',
  RENTED: 'Rented'
} as const;

// Asset Category Constants
export const ASSET_CATEGORY = {
  ALL: 'All',
  HARDWARE: 'HARDWARE',
  SOFTWARE: 'SOFTWARE'
} as const;

// Asset Category Display Mapping
export const ASSET_CATEGORY_DISPLAY = {
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software'
} as const;

// Warranty Status Constants
export const WARRANTY_STATUS = {
  VALID: 'VALID',
  EXPIRED: 'EXPIRED',
  EXPIRING_SOON: 'EXPIRING_SOON'
} as const;

// License Status Constants
export const LICENSE_STATUS = {
  VALID: 'VALID',
  EXPIRED: 'EXPIRED',
  EXPIRING_SOON: 'EXPIRING_SOON'
} as const;

// Configuration Constants
export const ASSET_CONFIG = {
  PAGE_SIZE: 10,
  MIN_NAME_LENGTH: 2,
  MIN_SERIAL_LENGTH: 2
} as const;

// Asset Messages
export const ASSET_MESSAGES = {
  SUCCESS: {
    CREATE: 'Asset created successfully!',
    UPDATE: 'Asset updated successfully!',
    DELETE: 'Asset deleted successfully!',
    PO_LOADED: 'PO details loaded successfully!'
  },
  ERROR: {
    NETWORK: 'Network error. Please check your connection.',
    SERVER: 'Server error. Please try again later.',
    VALIDATION: 'Please check your input and try again.',
    NOT_FOUND: 'Asset not found.',
    PO_NOT_FOUND: 'PO not found or invalid.',
    BACKEND_RUNNING: 'Backend service is not running. Using mock data for development.'
  }
} as const;

// Dropdown Option Interface
export interface DropdownOption {
  id: number;
  name: string;
}

// Extended interfaces for dropdowns
export interface AssetType extends DropdownOption {}

export interface AssetMake extends DropdownOption {
  typeId: number; // Asset Make belongs to Asset Type
}

export interface AssetModelWithDetails extends DropdownOption {
  makeId: number;
  makeName: string;
  typeId: number;
  typeName: string;
  ram?: string;
  storage?: string;
  processor?: string;
}

export interface AssetModel extends DropdownOption {
  makeId: number;
  ram?: string;
  storage?: string;
  processor?: string;
  typeId: number;
}

export interface Vendor extends DropdownOption {}

export interface User extends DropdownOption {
  email: string;
}

export interface OperatingSystem extends DropdownOption {}

export interface OSVersion extends DropdownOption {
  osId: number;
  versionNumber: string;
}

export interface PurchaseOrder extends DropdownOption {
  poNumber: string;
  acquisitionType?: string;
  vendorId?: number;
  ownerType?: string;
} 

// New interfaces for real-time dependent dropdowns
export interface AssetModelDetails {
  id: number;
  name: string;
  typeId: number;
  assetTypeName: string;
  makeId: number;
  makeName: string;
  ram?: string;
  storage?: string;
  processor?: string;
}

export interface VendorWarrantyDetails {
  vendorId: number;
  name: string;
  extendedWarrantyVendor: string;
  extendedWarrantyVendorId: number;
  defaultWarrantyMonths: number;
  extendedWarrantyMonths: number;
}

export interface PODetails {
  poNumber: string;
  acquisitionType: string;
  acquisitionDate: string;
  invoiceNumber: string;
  acquisitionPrice: number;
  vendorId: number;
  ownerType: string;
  leaseEndDate?: string;
  minContractPeriod?: number;
  rentalAmount?: number;
  currentPrice?: number;
  totalDevices?: number;
}

// ✅ NEW: Asset Status History for Audit Trail
export interface AssetStatusHistory {
  id?: number;
  assetId: number;
  status: string;
  changedById: number;
  changedByName?: string; // For display purposes
  changeDate: string;
  remarks?: string;
}

// ✅ NEW: Asset Status History DTO from Backend
export interface AssetStatusHistoryDTO {
  assetId: number;
  status: string;
  changedById: number;
  changeDate: string;
  remarks?: string | null;
}

// ✅ NEW: Status History Request for creating new records
export interface AssetStatusHistoryRequest {
  assetId: number;
  status: string;
  changedBy?: number; // Optional, can be system-generated
  changeDate?: string; // Optional, defaults to current timestamp
  remarks?: string;
}

// ✅ NEW: Status History Response with pagination
export interface AssetStatusHistoryResponse {
  content: AssetStatusHistory[]; // Paginated content array
  history?: AssetStatusHistory[]; // Legacy support
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageNumber?: number; // Alternative page field
  page?: number; // Alternative page field
  size?: number; // Page size
  message: string;
}

// ✅ NEW: Request DTO for status change with proper null handling
export interface AssetStatusChangeRequest {
  assetId: number;
  newStatus: string;
  changedById: number | null; // Can be null if no user context available
  remarks?: string | null; // Use null instead of undefined for backend consistency
  currentUserId?: number; // For assignment/unassignment
}

// ✅ NEW: Response DTO for status change
export interface AssetStatusChangeResponse {
  asset: Asset;
  statusHistory: AssetStatusHistory[];
  message: string;
}

// ✅ NEW: Status validation rules
export const STATUS_RULES = {
  REQUIRES_USER: ['Active'],
  REMOVES_USER: ['Broken', 'Ceased'],
  AUTO_ASSIGN_ACTIVE: true,
  AUTO_UNASSIGN_ON_USER_REMOVAL: 'In Stock'
} as const;

// ✅ NEW: AssetDTO for bulk creation - matches backend expectations
export interface AssetDTO {
  name: string;
  serialNumber: string;
  typeId?: number;
  makeId?: number;
  modelId?: number;
  itAssetCode?: string;
  macAddress?: string;
  ipv4Address?: string;
  status: string;
  ownerType: string;
  acquisitionType: string;
  currentUserId?: number;
  inventoryLocation?: string;
  osId?: number;
  osVersionId?: number;
  poNumber?: string;
  invoiceNumber?: string;
  acquisitionDate?: string;
  warrantyExpiry?: string;
  extendedWarrantyExpiry?: string;
  leaseEndDate?: string;
  vendorId?: number;
  extendedWarrantyVendorId?: number;
  rentalAmount?: number;
  acquisitionPrice?: number;
  depreciationPct?: number;
  currentPrice?: number;
  minContractPeriod?: number;
  tags?: string;
  // New fields
  assetCategory: 'HARDWARE' | 'SOFTWARE';
  licenseName?: string;
  licenseValidityPeriod?: string;
  warrantyStatus?: string;
  licenseStatus?: string;
  deleted?: boolean;
}

// ✅ NEW: Bulk creation request/response interfaces
export interface BulkAssetCreationRequest {
  assets: AssetDTO[];
}

export interface BulkAssetCreationResponse {
  failedCount: number;
  successCount: number;
  failedAssets: {
    asset: AssetDTO;
    error: string;
  }[];
  createdAssets: AssetDTO[];
  message: string;
}

// ✅ UPDATED: Bulk asset update request DTO for /api/assets/bulk-update
export interface BulkAssetUpdateRequest {
  assets: Partial<Asset>[];
}

export interface BulkAssetUpdateResponse {
  updatedCount: number;
  failedAssets: {
    asset: Asset;
    error: string;
  }[];
  updatedAssets: Asset[];
  message: string;
}

// ✅ NEW: Form validation interface for bulk creation
export interface AssetFormValidation {
  isValid: boolean;
  errors: {
    [key: string]: string;
  };
}

// ✅ NEW: User Assignment interfaces
export interface AssetUserAssignment {
  id?: number;
  assetId: number;
  userId: number;
  userName?: string; // For display purposes
  assignedDate: string;
  unassignedDate?: string; // NEW: For tracking unassignment
  remarks?: string;
  assignedById?: number;
  assignedByName?: string;
  unassignedById?: number; // NEW: Who unassigned
  unassignedByName?: string; // NEW: Who unassigned (display)
  isActive?: boolean; // NEW: Current assignment status
}

// ✅ NEW: Assignment History DTO for API calls
export interface AssetAssignmentHistoryDTO {
  assetId: number;
  userId: number;
  assignedDate: string;
  unassignedDate?: string;
  remarks?: string;
  assignedById?: number;
  unassignedById?: number;
}

// ✅ NEW: Assignment History Request for creating new records
export interface AssetAssignmentHistoryRequest {
  assetId: number;
  userId: number;
  assignedDate?: string; // Optional, defaults to current timestamp
  remarks?: string;
}

// ✅ NEW: Assignment History Response with pagination
export interface AssetAssignmentHistoryResponse {
  content: AssetUserAssignment[]; // Paginated content array
  history?: AssetUserAssignment[]; // Legacy support
  totalElements: number;
  totalPages?: number;
  currentPage?: number;
  pageNumber?: number; // Alternative page field
  page?: number; // Alternative page field
  size?: number; // Page size
  message: string;
}

// ✅ NEW: Unassignment Request
export interface AssetUnassignmentRequest {
  assetId: number;
  userId: number;
  unassignedDate?: string; // Optional, defaults to current timestamp
  remarks?: string;
}

export interface AssetUserAssignmentRequest {
  assetId: number;
  userId: number;
  remarks?: string;
}

// ✅ NEW: DTO for the new assignment API endpoint
export interface AssetUserAssignmentDTO {
  assetId: number;
  userId: number;
  remarks?: string;
}

export interface AssetUserAssignmentResponse {
  assignment: AssetUserAssignment;
  message: string;
}

// ✅ NEW: Tag Assignment interfaces
export interface AssetTag {
  id: number;
  name: string;
  description?: string;
  color?: string;
  category?: string;
  isActive: boolean;
}

export interface AssetTagAssignment {
  id?: number;
  assetId: number;
  tagId: number;
  tagName?: string; // For display purposes
  assetName?: string; // For display purposes
  assignedDate: string; // Legacy field name
  assignedAt?: string; // New field name from API
  remarks?: string; // New field for assignment remarks
  assignedById?: number;
  assignedByName?: string;
}

export interface AssetTagAssignmentRequest {
  assetId: number;
  tagId: number;
}

// ✅ NEW: DTO for the new tag assignment API endpoint
export interface AssetTagAssignmentDTO {
  assetId: number;
  tagId: number;
  remarks?: string;
}

// ✅ NEW: DTO for assign tag by name API endpoint
export interface AssetTagAssignmentByNameDTO {
  assetId: number;
  tagName: string;
  remarks?: string;
}

export interface AssetTagAssignmentResponse {
  assignment: AssetTagAssignment;
  message: string;
}

// ✅ NEW: Active User interface (for assignment dropdown)
export interface ActiveUser {
  id: number;
  name: string;
  email: string;
  department?: string;
  isActive: boolean;
}

// NEW: Comprehensive filter request interface for backend
export interface AssetFilterRequest {
  // Search filters
  search?: string;
  name?: string;
  serialNumber?: string;
  itAssetCode?: string;
  
  // Status filters
  status?: string;
  statusList?: string[];
  
  // Assignment filters
  assignmentStatus?: 'assigned' | 'unassigned' | 'all';
  currentUserId?: number;
  
  // Asset type/model filters
  typeId?: number;
  makeId?: number;
  modelId?: number;
  
  // OS filters
  osId?: number;
  osVersionId?: number;
  
  // Vendor filters
  vendorId?: number;
  extendedWarrantyVendorId?: number;
  
  // Ownership filters
  ownerType?: string;
  acquisitionType?: string;
  
  // Date range filters
  acquisitionDateFrom?: string;
  acquisitionDateTo?: string;
  warrantyExpiryFrom?: string;
  warrantyExpiryTo?: string;
  
  // Location filters
  inventoryLocation?: string;
  
  // PO filters
  poNumber?: string;
  
  // Advanced filters
  showBrokenAssets?: boolean;
  minAcquisitionPrice?: number;
  maxAcquisitionPrice?: number;
  
  // Pagination
  page?: number;
  size?: number;
  
  // Sorting
  sort?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// NEW: Filter response metadata
export interface FilterMetadata {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
  appliedFilters: AssetFilterRequest;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// NEW: Client-side filtering interfaces
export interface ClientSideFilterOptions {
  // Asset filters
  search?: string;
  status?: string;
  modelName?: string;
  currentUserName?: string;
  osName?: string;
  osVersionName?: string;
  name?: string;
  ownerType?: string;
  acquisitionType?: string;
  
  // Date range filters
  acquisitionDateFrom?: string;
  acquisitionDateTo?: string;
  warrantyExpiryFrom?: string;
  warrantyExpiryTo?: string;
  
  // PO filters
  poNumber?: string;
  invoiceNumber?: string;
  leaseEndDateFrom?: string;
  leaseEndDateTo?: string;
}

// NEW: Complete dataset storage interface
export interface AssetDataStore {
  assets: Asset[];
  users: User[];
  vendors: Vendor[];
  assetTypes: AssetType[];
  assetMakes: AssetMake[];
  assetModels: AssetModelWithDetails[];
  operatingSystems: OperatingSystem[];
  osVersions: OSVersion[];
  purchaseOrders: PurchaseOrder[];
  availablePONumbers: string[];
  lastUpdated: Date;
  isLoaded: boolean;
}

// NEW: Filter state management
export interface FilterState {
  activeFilters: ClientSideFilterOptions;
  filteredAssets: Asset[];
  filteredPOs: PurchaseOrder[];
  totalFilteredCount: number;
  hasActiveFilters: boolean;
}

// NEW: Dropdown options for filters
export interface FilterDropdownOptions {
  statuses: { value: string; label: string; }[];
  models: { value: string; label: string; }[];
  users: { value: string; label: string; }[];
  osOptions: { value: string; label: string; }[];
}

// NEW: Enhanced Asset interface with computed properties for filtering
export interface AssetWithFilterData extends Asset {
  // Computed filter-friendly properties
  modelName?: string;
  makeName?: string;
  typeName?: string;
  currentUserName?: string;
  vendorName?: string;
  osName?: string;
  osVersionName?: string;
  combinedSearchText?: string; // For quick search
}

// Helper functions for Asset
export class AssetHelper {
  static isLicenseFieldsRequired(asset: Asset): boolean {
    return asset.assetCategory === 'SOFTWARE';
  }

  static getWarrantyStatus(warrantyExpiry?: string): string {
    if (!warrantyExpiry) return '';
    
    const today = new Date();
    const expiry = new Date(warrantyExpiry);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return WARRANTY_STATUS.EXPIRED;
    if (daysUntilExpiry <= 30) return WARRANTY_STATUS.EXPIRING_SOON;
    return WARRANTY_STATUS.VALID;
  }

  static getLicenseStatus(licenseValidityPeriod?: string): string {
    if (!licenseValidityPeriod) return '';
    
    const today = new Date();
    const expiry = new Date(licenseValidityPeriod);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return LICENSE_STATUS.EXPIRED;
    if (daysUntilExpiry <= 30) return LICENSE_STATUS.EXPIRING_SOON;
    return LICENSE_STATUS.VALID;
  }

  static getWarrantyBadgeClass(status: string): string {
    switch (status) {
      case WARRANTY_STATUS.VALID:
        return 'bg-green-100 text-green-800 border-green-200';
      case WARRANTY_STATUS.EXPIRING_SOON:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case WARRANTY_STATUS.EXPIRED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  static getLicenseBadgeClass(status: string): string {
    switch (status) {
      case LICENSE_STATUS.VALID:
        return 'bg-green-100 text-green-800 border-green-200';
      case LICENSE_STATUS.EXPIRING_SOON:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case LICENSE_STATUS.EXPIRED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
} 