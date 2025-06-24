/**
 * ✅ Backend-Compatible DTOs - Strict Spring Boot DTO Mapping
 * These interfaces exactly match the backend DTOs to prevent validation errors
 */

// ✅ Enum Constants - Must match backend @Pattern validation exactly
export const BACKEND_ENUMS = {
  STATUS: {
    IN_STOCK: 'In Stock',
    ACTIVE: 'Active', 
    IN_REPAIR: 'In Repair',
    BROKEN: 'Broken',
    CEASED: 'Ceased'
  },
  OWNER_TYPE: {
    CELCOM: 'Celcom',
    VENDOR: 'Vendor'
  },
  ACQUISITION_TYPE: {
    BOUGHT: 'Bought',
    LEASED: 'Leased', 
    RENTED: 'Rented'
  }
} as const;

// ✅ Type unions for strict enum validation
export type AssetStatusEnum = typeof BACKEND_ENUMS.STATUS[keyof typeof BACKEND_ENUMS.STATUS];
export type OwnerTypeEnum = typeof BACKEND_ENUMS.OWNER_TYPE[keyof typeof BACKEND_ENUMS.OWNER_TYPE];
export type AcquisitionTypeEnum = typeof BACKEND_ENUMS.ACQUISITION_TYPE[keyof typeof BACKEND_ENUMS.ACQUISITION_TYPE];

// ✅ AssetRequestDTO - Matches Spring Boot exactly
export interface AssetRequestDTO {
  // Required fields
  name: string;
  serialNumber: string;
  status: AssetStatusEnum;
  ownerType: OwnerTypeEnum;
  acquisitionType: AcquisitionTypeEnum;
  
  // Optional identification fields
  id?: number;                    // ✅ Use 'id' not 'assetId'
  typeId?: number;
  makeId?: number;
  modelId?: number;
  itAssetCode?: string;
  
  // Network fields
  macAddress?: string;
  ipv4Address?: string;
  
  // Location and assignment
  currentUserId?: number;
  inventoryLocation?: string;
  
  // OS information
  osId?: number;
  osVersionId?: number;
  
  // Purchase/lease information
  poNumber?: string;
  invoiceNumber?: string;
  acquisitionDate?: string;      // ✅ ISO yyyy-MM-dd format for LocalDate
  warrantyExpiry?: string;       // ✅ ISO yyyy-MM-dd format
  extendedWarrantyExpiry?: string;
  leaseEndDate?: string;         // ✅ ISO yyyy-MM-dd format
  
  // Vendor information
  vendorId?: number;
  extendedWarrantyVendorId?: number;
  
  // Financial fields - BigDecimal compatible
  rentalAmount?: number;         // ✅ Will be converted to BigDecimal
  acquisitionPrice?: number;     // ✅ Will be converted to BigDecimal
  depreciationPct?: number;      // ✅ Percentage as number
  currentPrice?: number;         // ✅ Will be converted to BigDecimal
  minContractPeriod?: number;    // ✅ Integer months
  
  // Additional fields
  tags?: string;
}

// ✅ AssetPODTO - Matches Spring Boot exactly
export interface AssetPODTO {
  id?: number;                   // ✅ Use 'id' not 'poId'
  acquisitionType: AcquisitionTypeEnum;
  poNumber: string;
  invoiceNumber?: string;
  acquisitionDate?: string;      // ✅ ISO yyyy-MM-dd format
  vendorId?: number;
  name?: string;           // Read-only from backend
  ownerType: OwnerTypeEnum;
  leaseEndDate?: string;         // ✅ ISO yyyy-MM-dd format
  rentalAmount?: number;         // ✅ BigDecimal compatible
  minContractPeriod?: number;
  acquisitionPrice?: number;     // ✅ BigDecimal compatible
  depreciationPct?: number;
  currentPrice?: number;         // ✅ BigDecimal compatible
  totalDevices?: number;
}

// ✅ Response DTOs
export interface AssetResponseDTO extends AssetRequestDTO {
  id: number;                    // Always present in responses
  createdAt?: string;            // ISO datetime
  updatedAt?: string;            // ISO datetime
  deleted?: boolean;
}

export interface BulkAssetResponseDTO {
  successCount: number;
  failedAssets: {
    asset: AssetRequestDTO;
    error: string;
  }[];
  createdAssets: AssetResponseDTO[];
  message: string;
}

// ✅ Validation constants for frontend validation
export const VALIDATION_PATTERNS = {
  MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  IPV4_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  SERIAL_NUMBER: /^[A-Za-z0-9-_]+$/, // Adjust based on your backend validation
  PO_NUMBER: /^[A-Za-z0-9-_]+$/      // Adjust based on your backend validation
} as const;

// ✅ Field length constraints (match backend @Size validation)
export interface FieldConstraint {
  MIN?: number;
  MAX?: number;
}

export const FIELD_CONSTRAINTS: Record<string, FieldConstraint> = {
  NAME: { MIN: 2, MAX: 100 },
  SERIAL_NUMBER: { MIN: 2, MAX: 50 },
  IT_ASSET_CODE: { MAX: 50 },
  PO_NUMBER: { MIN: 3, MAX: 30 },
  INVOICE_NUMBER: { MIN: 3, MAX: 30 },
  INVENTORY_LOCATION: { MAX: 100 },
  TAGS: { MAX: 500 }
} as const;

// ✅ Error messages matching backend validation
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_STATUS: `Status must be one of: ${Object.values(BACKEND_ENUMS.STATUS).join(', ')}`,
  INVALID_OWNER_TYPE: `Owner type must be one of: ${Object.values(BACKEND_ENUMS.OWNER_TYPE).join(', ')}`,
  INVALID_ACQUISITION_TYPE: `Acquisition type must be one of: ${Object.values(BACKEND_ENUMS.ACQUISITION_TYPE).join(', ')}`,
  INVALID_MAC_ADDRESS: 'MAC address must be in format XX:XX:XX:XX:XX:XX',
  INVALID_IP_ADDRESS: 'IP address must be in format XXX.XXX.XXX.XXX',
  INVALID_DATE: 'Date must be in YYYY-MM-DD format',
  INVALID_PRICE: 'Price must be a positive number',
  INVALID_PERCENTAGE: 'Percentage must be between 0 and 100'
} as const; 