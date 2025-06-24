import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * ✅ DTO Transformation Interceptor
 * Ensures all outgoing HTTP requests have properly formatted data
 * This is a safety net for any data that wasn't preprocessed
 */
@Injectable()
export class DtoTransformationInterceptor implements HttpInterceptor {

  // ✅ Endpoints that should be transformed
  private readonly ASSET_ENDPOINTS = [
    '/api/assets',
    '/api/assets/bulk',
    '/api/asset-pos'
  ];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // ✅ Only transform requests to asset endpoints
    if (this.shouldTransformRequest(req)) {
      const transformedReq = this.transformRequest(req);
      return next.handle(transformedReq);
    }

    return next.handle(req);
  }

  /**
   * ✅ Check if request should be transformed
   */
  private shouldTransformRequest(req: HttpRequest<any>): boolean {
    // Only transform POST, PUT, PATCH requests with body
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return false;
    }

    // Check if URL matches asset endpoints
    return this.ASSET_ENDPOINTS.some(endpoint => req.url.includes(endpoint));
  }

  /**
   * ✅ Transform request data
   */
  private transformRequest(req: HttpRequest<any>): HttpRequest<any> {
    console.group('🔄 HTTP Interceptor Transformation');
    console.log('🌐 Original request:', {
      url: req.url,
      method: req.method,
      body: req.body
    });

    let transformedBody = req.body;

    try {
      if (Array.isArray(req.body)) {
        // ✅ Handle bulk operations (array of objects)
        transformedBody = req.body.map(item => this.transformItem(item));
      } else if (req.body && typeof req.body === 'object') {
        // ✅ Handle single object
        transformedBody = this.transformItem(req.body);
      }

      const transformedReq = req.clone({
        body: transformedBody,
        setHeaders: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Transformed request:', {
        url: transformedReq.url,
        method: transformedReq.method,
        body: transformedBody
      });
      console.groupEnd();

      return transformedReq;
    } catch (error) {
      console.error('❌ Transformation error:', error);
      console.groupEnd();
      return req; // Return original request if transformation fails
    }
  }

  /**
   * ✅ Transform individual data items
   */
  private transformItem(item: any): any {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const transformed = { ...item };

    // ✅ Date field transformation
    this.transformDateFields(transformed);

    // ✅ Numeric field transformation  
    this.transformNumericFields(transformed);

    // ✅ String field cleaning
    this.transformStringFields(transformed);

    // ✅ Remove null/undefined/empty values
    this.cleanEmptyFields(transformed);

    return transformed;
  }

  /**
   * ✅ Transform date fields to yyyy-MM-dd format
   */
  private transformDateFields(obj: any): void {
    const dateFields = [
      'acquisitionDate',
      'warrantyExpiry', 
      'extendedWarrantyExpiry',
      'leaseEndDate'
    ];

    dateFields.forEach(field => {
      if (obj[field]) {
        try {
          const date = new Date(obj[field]);
          if (!isNaN(date.getTime())) {
            obj[field] = date.toISOString().split('T')[0]; // yyyy-MM-dd
            console.log(`📅 Date transformed: ${field} → ${obj[field]}`);
          }
        } catch (error) {
          console.warn(`⚠️ Date transformation failed for ${field}:`, obj[field]);
        }
      }
    });
  }

  /**
   * ✅ Transform numeric fields for BigDecimal compatibility
   */
  private transformNumericFields(obj: any): void {
    const numericFields = [
      'rentalAmount',
      'acquisitionPrice', 
      'currentPrice',
      'depreciationPct'
    ];

    numericFields.forEach(field => {
      if (obj[field] !== null && obj[field] !== undefined) {
        const parsed = parseFloat(obj[field]);
        if (!isNaN(parsed)) {
          // ✅ Round to 2 decimal places for BigDecimal
          obj[field] = Math.round(parsed * 100) / 100;
          console.log(`💰 Numeric field transformed: ${field} → ${obj[field]}`);
        }
      }
    });

    // ✅ Integer fields
    const integerFields = [
      'id',
      'typeId',
      'makeId', 
      'modelId',
      'currentUserId',
      'osId',
      'osVersionId',
      'vendorId',
      'extendedWarrantyVendorId',
      'minContractPeriod',
      'totalDevices'
    ];

    integerFields.forEach(field => {
      if (obj[field] !== null && obj[field] !== undefined) {
        const parsed = parseInt(obj[field], 10);
        if (!isNaN(parsed)) {
          obj[field] = parsed;
        }
      }
    });
  }

  /**
   * ✅ Clean and trim string fields
   */
  private transformStringFields(obj: any): void {
    const stringFields = [
      'name',
      'serialNumber',
      'itAssetCode',
      'macAddress',
      'ipv4Address', 
      'inventoryLocation',
      'poNumber',
      'invoiceNumber',
      'tags'
    ];

    stringFields.forEach(field => {
      if (obj[field] && typeof obj[field] === 'string') {
        obj[field] = this.trimString(obj[field]);
      }
    });
  }

  /**
   * ✅ Remove null, undefined, and empty string values
   */
  private cleanEmptyFields(obj: any): void {
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value === null || value === undefined || value === '') {
        delete obj[key];
      }
    });
  }

  /**
   * ✅ String trimming utility
   */
  private trimString(value: string): string {
    return value
      .trim()
      .replace(/^\s+|\s+$/g, '')
      .replace(/\t/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
} 