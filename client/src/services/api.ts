// Re-export everything from the api directory
export * from './api/index';

// For backward compatibility, export apiCore as apiService
import { apiCore } from './api/core';
export const apiService = apiCore;
export default apiCore;