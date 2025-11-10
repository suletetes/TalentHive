// Re-export the new API core and services
export { apiCore } from './api/core';
export { authService } from './api/auth.service';

// For backward compatibility, export apiCore as apiService
import { apiCore } from './api/core';
export const apiService = apiCore;
export default apiCore;