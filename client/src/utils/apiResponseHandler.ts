// API Response Handler Utility
import { ApiResponse, PaginatedResponse } from '@/types/common';

/**
 * Standardized API response handler
 * Handles different response formats from the backend
 */
export class ApiResponseHandler {
  /**
   * Extract data from API response
   * Handles various response formats:
   * - { status, message, data }
   * - { data }
   * - direct data
   */
  static extractData<T>(response: any): T {
    // Standard API response format
    if (response && typeof response === 'object' && 'data' in response) {
      // Handle nested data structure: { data: { data: actualData } }
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        return response.data.data;
      }
      // Handle direct data: { data: actualData }
      return response.data;
    }
    
    // Direct data response
    return response;
  }

  /**
   * Extract paginated data from API response
   */
  static extractPaginatedData<T>(response: any): PaginatedResponse<T> {
    const data = this.extractData(response);
    
    // Handle different paginated response formats
    if (data && typeof data === 'object') {
      // Format 1: { items: [], pagination: {} }
      if ('items' in data && 'pagination' in data) {
        return {
          data: data.items,
          pagination: data.pagination,
        };
      }
      
      // Format 2: { [entityName]: [], pagination: {} }
      // e.g., { projects: [], pagination: {} }
      const keys = Object.keys(data);
      const arrayKey = keys.find(key => Array.isArray(data[key]));
      if (arrayKey && 'pagination' in data) {
        return {
          data: data[arrayKey],
          pagination: data.pagination,
        };
      }
      
      // Format 3: Direct array with pagination
      if (Array.isArray(data)) {
        return {
          data: data,
          pagination: {
            page: 1,
            limit: data.length,
            total: data.length,
            pages: 1,
          },
        };
      }
    }
    
    // Fallback: treat as direct array
    return {
      data: Array.isArray(data) ? data : [],
      pagination: {
        page: 1,
        limit: 0,
        total: 0,
        pages: 1,
      },
    };
  }

  /**
   * Check if response indicates success
   */
  static isSuccessResponse(response: any): boolean {
    if (response && typeof response === 'object') {
      // Check status field
      if ('status' in response) {
        return response.status === 'success' || response.status === 200;
      }
      
      // If no status field, assume success if we have data
      return true;
    }
    
    return false;
  }

  /**
   * Extract error message from response
   */
  static extractErrorMessage(response: any): string {
    if (response && typeof response === 'object') {
      if ('message' in response) {
        return response.message;
      }
      if ('error' in response) {
        return response.error;
      }
    }
    
    return 'An unexpected error occurred';
  }

  /**
   * Normalize API response to standard format
   */
  static normalize<T>(response: any): ApiResponse<T> {
    const data = this.extractData<T>(response);
    const isSuccess = this.isSuccessResponse(response);
    const message = response?.message || (isSuccess ? 'Success' : 'Error');
    
    return {
      status: isSuccess ? 'success' : 'error',
      message,
      data,
    };
  }
}