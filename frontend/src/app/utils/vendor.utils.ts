import { Vendor, VENDOR_STATUS } from '../models/vendor.model';

export class VendorUtils {
  
  /**
   * Get CSS class for status badge
   */
  static getStatusBadgeClass(status: string): string {
    switch (status) {
      case VENDOR_STATUS.ACTIVE: 
        return 'badge-celcom-success';
      case VENDOR_STATUS.INACTIVE: 
        return 'badge-celcom-secondary';
      default: 
        return 'badge-celcom-primary';
    }
  }

  /**
   * Filter vendors by search term and status
   */
  static filterVendors(vendors: Vendor[], searchTerm: string, status: string): Vendor[] {
    let filtered = [...vendors];

    // Apply search filter
    if (searchTerm?.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(search) ||
        (vendor.contactInfo && vendor.contactInfo.toLowerCase().includes(search))
      );
    }

    // Apply status filter
    if (status && status !== VENDOR_STATUS.ALL) {
      filtered = filtered.filter(vendor => vendor.status === status);
    }

    return filtered;
  }

  /**
   * Count vendors by status
   */
  static countVendorsByStatus(vendors: Vendor[], status: string): number {
    return vendors.filter(v => v.status === status).length;
  }

  /**
   * Clean and validate vendor form data
   */
  static cleanVendorData(formValue: any): { name: string; contactInfo: string; status: 'Active' | 'Inactive' } {
    return {
      name: formValue.name?.trim() || '',
      contactInfo: formValue.contactInfo?.trim() || '',
      status: formValue.status || VENDOR_STATUS.ACTIVE
    };
  }

  /**
   * Check if form data is valid for vendor
   */
  static isValidVendorData(data: { name: string; contactInfo: string; status: string }): boolean {
    return !!data.name && data.name.length >= 2;
  }

  /**
   * Create vendor confirmation message
   */
  static createConfirmationMessage(name: string, action: string): string {
    return `Are you sure you want to ${action} vendor "${name}"? This action cannot be undone.`;
  }
} 