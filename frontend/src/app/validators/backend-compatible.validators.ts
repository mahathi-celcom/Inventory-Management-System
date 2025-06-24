import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { 
  BACKEND_ENUMS, 
  VALIDATION_PATTERNS, 
  FIELD_CONSTRAINTS,
  AssetStatusEnum,
  OwnerTypeEnum,
  AcquisitionTypeEnum
} from '../models/backend-dto.model';

/**
 * ✅ Backend-Compatible Validators
 * Custom validators that exactly match Spring Boot validation rules
 */
export class BackendCompatibleValidators {

  /**
   * ✅ Validate enum values against backend constants
   */
  static enumValidator(enumObject: any): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Let required validator handle empty values
      }

      const validValues = Object.values(enumObject);
      if (!validValues.includes(control.value)) {
        return {
          invalidEnum: {
            value: control.value,
            validValues: validValues
          }
        };
      }

      return null;
    };
  }

  /**
   * ✅ Asset status validator
   */
  static assetStatus(): ValidatorFn {
    return BackendCompatibleValidators.enumValidator(BACKEND_ENUMS.STATUS);
  }

  /**
   * ✅ Owner type validator  
   */
  static ownerType(): ValidatorFn {
    return BackendCompatibleValidators.enumValidator(BACKEND_ENUMS.OWNER_TYPE);
  }

  /**
   * ✅ Acquisition type validator
   */
  static acquisitionType(): ValidatorFn {
    return BackendCompatibleValidators.enumValidator(BACKEND_ENUMS.ACQUISITION_TYPE);
  }

  /**
   * ✅ Date validator for Spring Boot LocalDate format (yyyy-MM-dd)
   */
  static localDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      try {
        const date = new Date(control.value);
        if (isNaN(date.getTime())) {
          return { invalidDate: { value: control.value } };
        }

        // ✅ Check if it's a valid ISO date format
        const isoFormat = /^\d{4}-\d{2}-\d{2}$/;
        const dateString = typeof control.value === 'string' ? control.value : date.toISOString().split('T')[0];
        
        if (!isoFormat.test(dateString)) {
          return { invalidDateFormat: { value: control.value, expectedFormat: 'yyyy-MM-dd' } };
        }

        return null;
      } catch (error) {
        return { invalidDate: { value: control.value } };
      }
    };
  }

  /**
   * ✅ BigDecimal compatible price validator
   */
  static bigDecimalPrice(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value && control.value !== 0) {
        return null;
      }

      const value = parseFloat(control.value);
      
      if (isNaN(value)) {
        return { invalidPrice: { value: control.value } };
      }

      if (value < 0) {
        return { negativePrice: { value: control.value } };
      }

      // ✅ Check decimal places (BigDecimal typically uses 2)
      const decimalPlaces = (control.value.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        return { tooManyDecimals: { value: control.value, maxDecimals: 2 } };
      }

      return null;
    };
  }

  /**
   * ✅ Percentage validator (0-100)
   */
  static percentage(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value && control.value !== 0) {
        return null;
      }

      const value = parseFloat(control.value);
      
      if (isNaN(value)) {
        return { invalidPercentage: { value: control.value } };
      }

      if (value < 0 || value > 100) {
        return { percentageOutOfRange: { value: control.value, min: 0, max: 100 } };
      }

      return null;
    };
  }

  /**
   * ✅ MAC address validator
   */
  static macAddress(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      if (!VALIDATION_PATTERNS.MAC_ADDRESS.test(control.value)) {
        return { invalidMacAddress: { value: control.value, pattern: 'XX:XX:XX:XX:XX:XX' } };
      }

      return null;
    };
  }

  /**
   * ✅ IPv4 address validator
   */
  static ipv4Address(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      if (!VALIDATION_PATTERNS.IPV4_ADDRESS.test(control.value)) {
        return { invalidIpAddress: { value: control.value, pattern: 'XXX.XXX.XXX.XXX' } };
      }

      return null;
    };
  }

  /**
   * ✅ Serial number validator
   */
  static serialNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const constraints = FIELD_CONSTRAINTS['SERIAL_NUMBER'];
      
      if (constraints?.MIN !== undefined && control.value.length < constraints.MIN) {
        return { 
          minLength: { 
            actualLength: control.value.length, 
            requiredLength: constraints.MIN 
          } 
        };
      }

      if (constraints?.MAX !== undefined && control.value.length > constraints.MAX) {
        return { 
          maxLength: { 
            actualLength: control.value.length, 
            requiredLength: constraints.MAX 
          } 
        };
      }

      if (!VALIDATION_PATTERNS.SERIAL_NUMBER.test(control.value)) {
        return { invalidSerialNumber: { value: control.value } };
      }

      return null;
    };
  }

  /**
   * ✅ PO number validator
   */
  static poNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const constraints = FIELD_CONSTRAINTS['PO_NUMBER'];
      
      if (constraints?.MIN !== undefined && control.value.length < constraints.MIN) {
        return { 
          minLength: { 
            actualLength: control.value.length, 
            requiredLength: constraints.MIN 
          } 
        };
      }

      if (constraints?.MAX !== undefined && control.value.length > constraints.MAX) {
        return { 
          maxLength: { 
            actualLength: control.value.length, 
            requiredLength: constraints.MAX 
          } 
        };
      }

      if (!VALIDATION_PATTERNS.PO_NUMBER.test(control.value)) {
        return { invalidPoNumber: { value: control.value } };
      }

      return null;
    };
  }

  /**
   * ✅ Generic string length validator based on field constraints
   */
  static fieldLength(fieldName: keyof typeof FIELD_CONSTRAINTS): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const constraints = FIELD_CONSTRAINTS[fieldName];
      if (!constraints) {
        return null;
      }

      if (constraints.MIN !== undefined && control.value.length < constraints.MIN) {
        return { 
          minLength: { 
            actualLength: control.value.length, 
            requiredLength: constraints.MIN 
          } 
        };
      }

      if (constraints.MAX !== undefined && control.value.length > constraints.MAX) {
        return { 
          maxLength: { 
            actualLength: control.value.length, 
            requiredLength: constraints.MAX 
          } 
        };
      }

      return null;
    };
  }

  /**
   * ✅ Positive integer validator
   */
  static positiveInteger(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value && control.value !== 0) {
        return null;
      }

      const value = parseInt(control.value, 10);
      
      if (isNaN(value)) {
        return { invalidInteger: { value: control.value } };
      }

      if (value < 1) {
        return { notPositive: { value: control.value } };
      }

      return null;
    };
  }

  /**
   * ✅ Non-negative integer validator (allows 0)
   */
  static nonNegativeInteger(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value && control.value !== 0) {
        return null;
      }

      const value = parseInt(control.value, 10);
      
      if (isNaN(value)) {
        return { invalidInteger: { value: control.value } };
      }

      if (value < 0) {
        return { negative: { value: control.value } };
      }

      return null;
    };
  }

  /**
   * ✅ Get error message for validation errors
   */
  static getErrorMessage(errors: ValidationErrors): string {
    if (errors['required']) {
      return 'This field is required';
    }

    if (errors['invalidEnum']) {
      return `Invalid value. Must be one of: ${errors['invalidEnum'].validValues.join(', ')}`;
    }

    if (errors['invalidDate']) {
      return 'Invalid date format';
    }

    if (errors['invalidDateFormat']) {
      return `Date must be in ${errors['invalidDateFormat'].expectedFormat} format`;
    }

    if (errors['invalidPrice']) {
      return 'Invalid price format';
    }

    if (errors['negativePrice']) {
      return 'Price cannot be negative';
    }

    if (errors['tooManyDecimals']) {
      return `Maximum ${errors['tooManyDecimals'].maxDecimals} decimal places allowed`;
    }

    if (errors['invalidPercentage']) {
      return 'Invalid percentage format';
    }

    if (errors['percentageOutOfRange']) {
      return `Percentage must be between ${errors['percentageOutOfRange'].min} and ${errors['percentageOutOfRange'].max}`;
    }

    if (errors['invalidMacAddress']) {
      return `MAC address must be in format: ${errors['invalidMacAddress'].pattern}`;
    }

    if (errors['invalidIpAddress']) {
      return `IP address must be in format: ${errors['invalidIpAddress'].pattern}`;
    }

    if (errors['minLength']) {
      return `Minimum length is ${errors['minLength'].requiredLength} characters`;
    }

    if (errors['maxLength']) {
      return `Maximum length is ${errors['maxLength'].requiredLength} characters`;
    }

    if (errors['invalidSerialNumber']) {
      return 'Serial number contains invalid characters';
    }

    if (errors['invalidPoNumber']) {
      return 'PO number contains invalid characters';
    }

    if (errors['invalidInteger']) {
      return 'Must be a valid integer';
    }

    if (errors['notPositive']) {
      return 'Must be a positive number';
    }

    if (errors['negative']) {
      return 'Cannot be negative';
    }

    return 'Invalid value';
  }
} 