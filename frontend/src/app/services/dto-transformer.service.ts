import { Injectable } from '@angular/core';
import { 
  AssetRequestDTO, 
  AssetPODTO,
  BACKEND_ENUMS,
  AssetStatusEnum,
  OwnerTypeEnum,
  AcquisitionTypeEnum,
  VALIDATION_PATTERNS,
  FIELD_CONSTRAINTS,
  VALIDATION_MESSAGES
} from '../models/backend-dto.model';

/**
 * ✅ DTO Transformer Service
 * Handles all data transformation between frontend forms and backend DTOs
 * Ensures perfect compatibility with Spring Boot validation rules
 */
@Injectable({
  providedIn: 'root'
})
export class DtoTransformerService {

  constructor() {}

  /**
   * ✅ Transform frontend form data to AssetRequestDTO
   * Handles date formatting, type conversion, and field mapping
   */
  transformToAssetRequestDTO(formData: any): AssetRequestDTO {
    console.group('🔄 Asset Form → DTO Transformation');
    console.log('📥 Original form data:', formData);

    const dto: AssetRequestDTO = {
      // ✅ Required fields with validation
      name: this.trimAndValidateString(formData.name, 'name'),
      serialNumber: this.trimAndValidateString(formData.serialNumber, 'serialNumber'),
      status: this.validateEnum(formData.status, BACKEND_ENUMS.STATUS, 'status') as AssetStatusEnum,
      ownerType: this.validateEnum(formData.ownerType, BACKEND_ENUMS.OWNER_TYPE, 'ownerType') as OwnerTypeEnum,
      acquisitionType: this.validateEnum(formData.acquisitionType, BACKEND_ENUMS.ACQUISITION_TYPE, 'acquisitionType') as AcquisitionTypeEnum
    };

    // ✅ Optional identification fields
    if (formData.id) dto.id = this.parseInteger(formData.id);
    if (formData.typeId) dto.typeId = this.parseInteger(formData.typeId);
    if (formData.makeId) dto.makeId = this.parseInteger(formData.makeId);
    if (formData.modelId) dto.modelId = this.parseInteger(formData.modelId);
    if (formData.itAssetCode) dto.itAssetCode = this.trimAndValidateString(formData.itAssetCode);

    // ✅ Network fields with pattern validation
    if (formData.macAddress) {
      dto.macAddress = this.validatePattern(formData.macAddress, VALIDATION_PATTERNS.MAC_ADDRESS, 'macAddress');
    }
    if (formData.ipv4Address) {
      dto.ipv4Address = this.validatePattern(formData.ipv4Address, VALIDATION_PATTERNS.IPV4_ADDRESS, 'ipv4Address');
    }

    // ✅ Location and assignment
    if (formData.currentUserId) dto.currentUserId = this.parseInteger(formData.currentUserId);
    if (formData.inventoryLocation) dto.inventoryLocation = this.trimAndValidateString(formData.inventoryLocation);

    // ✅ OS information
    if (formData.osId) dto.osId = this.parseInteger(formData.osId);
    if (formData.osVersionId) dto.osVersionId = this.parseInteger(formData.osVersionId);

    // ✅ Purchase/lease information with date formatting
    if (formData.poNumber) dto.poNumber = this.trimAndValidateString(formData.poNumber);
    if (formData.invoiceNumber) dto.invoiceNumber = this.trimAndValidateString(formData.invoiceNumber);
    if (formData.acquisitionDate) dto.acquisitionDate = this.formatDateForBackend(formData.acquisitionDate);
    if (formData.warrantyExpiry) dto.warrantyExpiry = this.formatDateForBackend(formData.warrantyExpiry);
    if (formData.extendedWarrantyExpiry) dto.extendedWarrantyExpiry = this.formatDateForBackend(formData.extendedWarrantyExpiry);
    if (formData.leaseEndDate) dto.leaseEndDate = this.formatDateForBackend(formData.leaseEndDate);

    // ✅ Vendor information
    if (formData.vendorId) dto.vendorId = this.parseInteger(formData.vendorId);
    if (formData.extendedWarrantyVendorId) dto.extendedWarrantyVendorId = this.parseInteger(formData.extendedWarrantyVendorId);

    // ✅ Financial fields - BigDecimal compatible
    if (formData.rentalAmount !== null && formData.rentalAmount !== undefined) {
      dto.rentalAmount = this.parseDecimal(formData.rentalAmount, 'rentalAmount');
    }
    if (formData.acquisitionPrice !== null && formData.acquisitionPrice !== undefined) {
      dto.acquisitionPrice = this.parseDecimal(formData.acquisitionPrice, 'acquisitionPrice');
    }
    if (formData.depreciationPct !== null && formData.depreciationPct !== undefined) {
      dto.depreciationPct = this.parsePercentage(formData.depreciationPct);
    }
    if (formData.currentPrice !== null && formData.currentPrice !== undefined) {
      dto.currentPrice = this.parseDecimal(formData.currentPrice, 'currentPrice');
    }
    if (formData.minContractPeriod !== null && formData.minContractPeriod !== undefined) {
      dto.minContractPeriod = this.parseInteger(formData.minContractPeriod);
    }

    // ✅ Additional fields
    if (formData.tags) dto.tags = this.trimAndValidateString(formData.tags);

    console.log('📤 Transformed DTO:', dto);
    console.groupEnd();

    return dto;
  }

  /**
   * ✅ Transform frontend form data to AssetPODTO
   */
  transformToAssetPODTO(formData: any): AssetPODTO {
    console.group('🔄 PO Form → DTO Transformation');
    console.log('📥 Original form data:', formData);

    const dto: AssetPODTO = {
      // ✅ Required fields
      acquisitionType: this.validateEnum(formData.acquisitionType, BACKEND_ENUMS.ACQUISITION_TYPE, 'acquisitionType') as AcquisitionTypeEnum,
      poNumber: this.trimAndValidateString(formData.poNumber, 'poNumber'),
      ownerType: this.validateEnum(formData.ownerType, BACKEND_ENUMS.OWNER_TYPE, 'ownerType') as OwnerTypeEnum
    };

    // ✅ Optional fields
    if (formData.id) dto.id = this.parseInteger(formData.id);
    if (formData.invoiceNumber) dto.invoiceNumber = this.trimAndValidateString(formData.invoiceNumber);
    if (formData.acquisitionDate) dto.acquisitionDate = this.formatDateForBackend(formData.acquisitionDate);
    if (formData.vendorId) dto.vendorId = this.parseInteger(formData.vendorId);
    if (formData.leaseEndDate) dto.leaseEndDate = this.formatDateForBackend(formData.leaseEndDate);
    
    // ✅ Financial fields
    if (formData.rentalAmount !== null && formData.rentalAmount !== undefined) {
      dto.rentalAmount = this.parseDecimal(formData.rentalAmount, 'rentalAmount');
    }
    if (formData.acquisitionPrice !== null && formData.acquisitionPrice !== undefined) {
      dto.acquisitionPrice = this.parseDecimal(formData.acquisitionPrice, 'acquisitionPrice');
    }
    if (formData.depreciationPct !== null && formData.depreciationPct !== undefined) {
      dto.depreciationPct = this.parsePercentage(formData.depreciationPct);
    }
    if (formData.currentPrice !== null && formData.currentPrice !== undefined) {
      dto.currentPrice = this.parseDecimal(formData.currentPrice, 'currentPrice');
    }
    if (formData.minContractPeriod !== null && formData.minContractPeriod !== undefined) {
      dto.minContractPeriod = this.parseInteger(formData.minContractPeriod);
    }
    if (formData.totalDevices !== null && formData.totalDevices !== undefined) {
      dto.totalDevices = this.parseInteger(formData.totalDevices);
    }

    console.log('📤 Transformed DTO:', dto);
    console.groupEnd();

    return dto;
  }

  /**
   * ✅ Bulk transform multiple assets
   */
  transformBulkAssets(formAssets: any[]): AssetRequestDTO[] {
    console.group('🔄 Bulk Asset Transformation');
    console.log('📊 Processing assets:', formAssets.length);

    const transformedAssets = formAssets.map((asset, index) => {
      console.log(`🔄 Transforming asset ${index + 1}...`);
      return this.transformToAssetRequestDTO(asset);
    });

    console.log('✅ All assets transformed successfully');
    console.groupEnd();

    return transformedAssets;
  }

  // ✅ Private utility methods

  /**
   * Format date for Spring Boot LocalDate (yyyy-MM-dd)
   */
  private formatDateForBackend(dateValue: any): string {
    if (!dateValue) return '';

    try {
      let date: Date;
      
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else {
        throw new Error('Invalid date format');
      }

      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }

      // ✅ Format as yyyy-MM-dd for Spring Boot LocalDate
      const formatted = date.toISOString().split('T')[0];
      console.log(`📅 Date formatted: ${dateValue} → ${formatted}`);
      return formatted;
    } catch (error) {
      console.error('❌ Date formatting error:', error);
      throw new Error(`${VALIDATION_MESSAGES.INVALID_DATE}: ${dateValue}`);
    }
  }

  /**
   * Parse and validate decimal values for BigDecimal compatibility
   */
  private parseDecimal(value: any, fieldName: string): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) {
      throw new Error(`${fieldName}: ${VALIDATION_MESSAGES.INVALID_PRICE}`);
    }

    // ✅ Round to 2 decimal places for BigDecimal compatibility
    const rounded = Math.round(parsed * 100) / 100;
    console.log(`💰 Price formatted: ${value} → ${rounded}`);
    return rounded;
  }

  /**
   * Parse percentage values (0-100)
   */
  private parsePercentage(value: any): number {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      throw new Error(VALIDATION_MESSAGES.INVALID_PERCENTAGE);
    }
    return parsed;
  }

  /**
   * Parse integer values
   */
  private parseInteger(value: any): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Invalid integer value: ${value}`);
    }
    return parsed;
  }

  /**
   * Trim and validate string fields
   */
  private trimAndValidateString(value: any, fieldName?: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }

    // ✅ Comprehensive string trimming
    const trimmed = value
      .trim()
      .replace(/^\s+|\s+$/g, '')
      .replace(/\t/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // ✅ Length validation if field constraints exist
    if (fieldName && FIELD_CONSTRAINTS[fieldName]) {
      const constraints = FIELD_CONSTRAINTS[fieldName];
      if (constraints.MIN !== undefined && trimmed.length < constraints.MIN) {
        throw new Error(`${fieldName} must be at least ${constraints.MIN} characters`);
      }
      if (constraints.MAX !== undefined && trimmed.length > constraints.MAX) {
        throw new Error(`${fieldName} must be no more than ${constraints.MAX} characters`);
      }
    }

    return trimmed;
  }

  /**
   * Validate enum values
   */
  private validateEnum(value: any, enumObject: any, fieldName: string): string {
    const validValues = Object.values(enumObject);
    if (!validValues.includes(value)) {
      throw new Error(`Invalid ${fieldName}: ${value}. Must be one of: ${validValues.join(', ')}`);
    }
    return value;
  }

  /**
   * Validate pattern fields
   */
  private validatePattern(value: string, pattern: RegExp, fieldName: string): string {
    const trimmed = this.trimAndValidateString(value);
    if (trimmed && !pattern.test(trimmed)) {
      throw new Error(`Invalid ${fieldName} format: ${trimmed}`);
    }
    return trimmed;
  }

  /**
   * ✅ Get all enum options for dropdowns
   */
  getStatusOptions(): AssetStatusEnum[] {
    return Object.values(BACKEND_ENUMS.STATUS);
  }

  getOwnerTypeOptions(): OwnerTypeEnum[] {
    return Object.values(BACKEND_ENUMS.OWNER_TYPE);
  }

  getAcquisitionTypeOptions(): AcquisitionTypeEnum[] {
    return Object.values(BACKEND_ENUMS.ACQUISITION_TYPE);
  }

  /**
   * ✅ Validate form data before transformation
   */
  validateFormData(formData: any, isAsset: boolean = true): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      if (isAsset) {
        this.transformToAssetRequestDTO(formData);
      } else {
        this.transformToAssetPODTO(formData);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Validation error');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 