/**
 * Robust data extraction utilities for handling various API response formats
 */

export interface DataExtractor {
  extractArray<T>(response: any, fallbackPaths: string[]): T[];
  extractObject<T>(response: any, fallbackPaths: string[]): T | null;
  handleApiResponse<T>(response: any): T;
}

/**
 * Safely get nested property from object using dot notation
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Check if a value is a non-empty array
 */
function isNonEmptyArray(value: any): boolean {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Check if a value is a valid object (not null, not array)
 */
function isValidObject(value: any): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export class ApiDataExtractor implements DataExtractor {
  /**
   * Extract array data from API response with multiple fallback paths
   * @param response - The API response object
   * @param fallbackPaths - Array of paths to try in order (e.g., ['data', 'data.contracts', 'contracts'])
   * @returns Extracted array or empty array if not found
   */
  extractArray<T>(response: any, fallbackPaths: string[] = ['data']): T[] {
    console.log('[DATA_EXTRACTOR] Extracting array from response:', {
      responseType: typeof response,
      isArray: Array.isArray(response),
      hasData: !!response?.data,
      fallbackPaths,
    });

    // If response itself is an array, return it
    if (isNonEmptyArray(response)) {
      console.log('[DATA_EXTRACTOR] Response is array, returning directly');
      return response as T[];
    }

    // Try each fallback path in order
    for (const path of fallbackPaths) {
      const extracted = getNestedProperty(response, path);
      console.log(`[DATA_EXTRACTOR] Trying path '${path}':`, {
        found: extracted !== undefined,
        isArray: Array.isArray(extracted),
        length: Array.isArray(extracted) ? extracted.length : 'N/A',
      });

      if (isNonEmptyArray(extracted)) {
        console.log(`[DATA_EXTRACTOR] Successfully extracted array from '${path}'`);
        return extracted as T[];
      }
    }

    console.log('[DATA_EXTRACTOR] No array found in any path, returning empty array');
    return [];
  }

  /**
   * Extract object data from API response with multiple fallback paths
   * @param response - The API response object
   * @param fallbackPaths - Array of paths to try in order
   * @returns Extracted object or null if not found
   */
  extractObject<T>(response: any, fallbackPaths: string[] = ['data']): T | null {
    console.log('[DATA_EXTRACTOR] Extracting object from response:', {
      responseType: typeof response,
      fallbackPaths,
    });

    // Try each fallback path in order
    for (const path of fallbackPaths) {
      const extracted = getNestedProperty(response, path);
      console.log(`[DATA_EXTRACTOR] Trying path '${path}':`, {
        found: extracted !== undefined,
        isObject: isValidObject(extracted),
      });

      if (isValidObject(extracted)) {
        console.log(`[DATA_EXTRACTOR] Successfully extracted object from '${path}'`);
        return extracted as T;
      }
    }

    console.log('[DATA_EXTRACTOR] No object found in any path, returning null');
    return null;
  }

  /**
   * Handle standard API response format
   * @param response - The API response
   * @returns The data portion of the response
   */
  handleApiResponse<T>(response: any): T {
    console.log('[DATA_EXTRACTOR] Handling API response:', {
      status: response?.status,
      hasData: !!response?.data,
      hasError: !!response?.error,
    });

    // Handle error responses
    if (response?.status === 'error' || response?.error) {
      const errorMessage = response?.message || response?.error || 'Unknown API error';
      console.error('[DATA_EXTRACTOR] API error response:', errorMessage);
      throw new Error(errorMessage);
    }

    // Handle success responses
    if (response?.status === 'success' && response?.data !== undefined) {
      console.log('[DATA_EXTRACTOR] Success response, returning data');
      return response.data as T;
    }

    // Handle direct data responses (no wrapper)
    if (response?.data !== undefined) {
      console.log('[DATA_EXTRACTOR] Direct data response, returning data');
      return response.data as T;
    }

    // Return response as-is if no standard format detected
    console.log('[DATA_EXTRACTOR] Non-standard response format, returning as-is');
    return response as T;
  }
}

// Export singleton instance
export const dataExtractor = new ApiDataExtractor();

// Common fallback paths for different data types
export const COMMON_PATHS = {
  // For arrays
  CONTRACTS: ['data', 'data.contracts', 'contracts', 'data.data', 'data.data.contracts'],
  PROPOSALS: ['data', 'data.proposals', 'proposals', 'data.data', 'data.data.proposals'],
  PROJECTS: ['data', 'data.projects', 'projects', 'data.data', 'data.data.projects'],
  USERS: ['data', 'data.users', 'users', 'data.data', 'data.data.users'],
  TRANSACTIONS: ['data', 'data.transactions', 'transactions', 'data.data', 'data.data.transactions'],
  
  // For objects
  CONTRACT: ['data', 'data.contract', 'contract'],
  PROPOSAL: ['data', 'data.proposal', 'proposal'],
  PROJECT: ['data', 'data.project', 'project'],
  USER: ['data', 'data.user', 'user'],
  TRANSACTION: ['data', 'data.transaction', 'transaction'],
};

/**
 * Convenience functions for common data extraction patterns
 */
export const extractContracts = <T>(response: any): T[] => 
  dataExtractor.extractArray<T>(response, COMMON_PATHS.CONTRACTS);

export const extractProposals = <T>(response: any): T[] => 
  dataExtractor.extractArray<T>(response, COMMON_PATHS.PROPOSALS);

export const extractProjects = <T>(response: any): T[] => 
  dataExtractor.extractArray<T>(response, COMMON_PATHS.PROJECTS);

export const extractContract = <T>(response: any): T | null => 
  dataExtractor.extractObject<T>(response, COMMON_PATHS.CONTRACT);

export const extractProposal = <T>(response: any): T | null => 
  dataExtractor.extractObject<T>(response, COMMON_PATHS.PROPOSAL);

export const extractProject = <T>(response: any): T | null => 
  dataExtractor.extractObject<T>(response, COMMON_PATHS.PROJECT);