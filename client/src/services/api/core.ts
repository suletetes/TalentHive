import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { store } from '@/store';
import { logout, setTokens } from '@/store/slices/authSlice';
import { ApiResponseHandler } from '@/utils/apiResponseHandler';
import { RequestTimeoutHandler } from '@/utils/requestTimeout';
import { ApiResponse } from '@/types/common';
import { createSecurityMiddleware, SecurityLogger, SecurityEventType, RATE_LIMITS } from '@/config/security';
import { ContentSanitizer } from '@/utils/contentSanitization';

// List of endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/projects', // Public project listing
  '/freelancers', // Public freelancer listing
];

// Endpoints that should silently fail on 401 (non-critical background requests)
const SILENT_FAIL_ENDPOINTS = [
  '/notifications/unread-count',
  '/notifications',
  '/messages/conversations',
  '/messages/unread',
  '/conversations',
];

export class ApiCore {
  private api: AxiosInstance;
  private refreshPromise: Promise<any> | null = null;
  private requestQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    config: AxiosRequestConfig;
  }> = [];
  private isRefreshing = false;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private securityMiddleware = createSecurityMiddleware();

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  private isPublicEndpoint(url: string): boolean {
    return PUBLIC_ENDPOINTS.some(endpoint => url.startsWith(endpoint));
  }

  private isSilentFailEndpoint(url: string): boolean {
    return SILENT_FAIL_ENDPOINTS.some(endpoint => url.includes(endpoint));
  }

  private setupRequestInterceptor() {
    this.api.interceptors.request.use(
      (config) => {
        const state = store.getState();
        const token = state.auth.token;

        // Add authentication token
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Apply security middleware
        const requestUrl = config.url || '';
        
        // Check rate limits for different endpoint types
        if (requestUrl.includes('/auth/login')) {
          if (!this.securityMiddleware.checkRateLimit('login', RATE_LIMITS.LOGIN_ATTEMPTS)) {
            SecurityLogger.logEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, { endpoint: 'login' });
            throw new Error('Too many login attempts. Please try again later.');
          }
        } else if (requestUrl.includes('/auth/forgot-password')) {
          if (!this.securityMiddleware.checkRateLimit('password-reset', RATE_LIMITS.PASSWORD_RESET)) {
            SecurityLogger.logEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, { endpoint: 'password-reset' });
            throw new Error('Too many password reset requests. Please try again later.');
          }
        } else if (requestUrl.includes('/upload')) {
          if (!this.securityMiddleware.checkRateLimit('file-upload', RATE_LIMITS.FILE_UPLOADS)) {
            SecurityLogger.logEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, { endpoint: 'file-upload' });
            throw new Error('Too many file uploads. Please try again later.');
          }
        } else if (requestUrl.includes('/search')) {
          if (!this.securityMiddleware.checkRateLimit('search', RATE_LIMITS.SEARCH_REQUESTS)) {
            SecurityLogger.logEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, { endpoint: 'search' });
            throw new Error('Too many search requests. Please slow down.');
          }
        } else {
          // General API rate limit
          if (!this.securityMiddleware.checkRateLimit('api', RATE_LIMITS.API_REQUESTS)) {
            SecurityLogger.logEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, { endpoint: 'general' });
            throw new Error('Too many API requests. Please slow down.');
          }
        }

        // Sanitize request data for POST/PUT/PATCH requests
        if (config.data && ['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
          try {
            config.data = this.sanitizeRequestData(config.data, requestUrl);
          } catch (error) {
            SecurityLogger.logEvent(SecurityEventType.SUSPICIOUS_CONTENT, { 
              endpoint: requestUrl,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private sanitizeRequestData(data: any, url: string): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Determine data type based on URL and sanitize accordingly
    if (url.includes('/profile') || url.includes('/users')) {
      return ContentSanitizer.sanitizeProfile(data);
    } else if (url.includes('/projects')) {
      return ContentSanitizer.sanitizeProject(data);
    } else if (url.includes('/messages')) {
      return ContentSanitizer.sanitizeMessage(data);
    } else if (url.includes('/proposals')) {
      return ContentSanitizer.sanitizeProposal(data);
    }

    // Generic sanitization for other endpoints
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        // Check for suspicious content
        ContentSanitizer.logSuspiciousContent(sanitized[key], `${url}.${key}`);
        
        // Apply basic text sanitization
        sanitized[key] = ContentSanitizer.sanitizeText(sanitized[key]);
      }
    });

    return sanitized;
  }
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        const requestUrl = originalRequest.url || '';

  private setupResponseInterceptor() {
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        const requestUrl = originalRequest.url || '';

        // Log security-relevant errors
        if (error.response?.status === 401) {
          SecurityLogger.logEvent(SecurityEventType.INVALID_TOKEN, { 
            endpoint: requestUrl,
            status: error.response.status 
          });
        } else if (error.response?.status === 403) {
          SecurityLogger.logEvent(SecurityEventType.PERMISSION_DENIED, { 
            endpoint: requestUrl,
            status: error.response.status 
          });
        }

        // Handle 401 errors with improved token refresh logic
        if (error.response?.status === 401) {
          console.log('🔐 [API] 401 Error on:', requestUrl);
          
          // For silent fail endpoints, just reject without logout or refresh
          if (this.isSilentFailEndpoint(requestUrl)) {
            console.debug(`[API] Silent 401 for ${requestUrl}`);
            return Promise.reject(error);
          }

          // Don't retry if already retried
          if (originalRequest._retry) {
            console.log('🔐 [API] Already retried, giving up');
            return Promise.reject(error);
          }

          // If already refreshing, queue the request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.requestQueue.push({ resolve, reject, config: originalRequest });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            console.log('🔐 [API] Attempting token refresh...');
            
            const state = store.getState();
            const refreshToken = state.auth.refreshToken;

            if (!refreshToken) {
              console.log('🔐 [API] No refresh token available');
              throw new Error('No refresh token available');
            }

            // Set timeout for refresh request (10 seconds)
            this.refreshTimeout = setTimeout(() => {
              console.log('🔐 [API] Token refresh timeout');
              throw new Error('Token refresh timeout');
            }, 10000);

            const response = await this.api.post('/auth/refresh-token', { refreshToken });
            
            // Clear timeout
            if (this.refreshTimeout) {
              clearTimeout(this.refreshTimeout);
              this.refreshTimeout = null;
            }
            
            // Use standardized response handler
            const responseData = ApiResponseHandler.extractData(response.data);
            const { accessToken, refreshToken: newRefreshToken } = responseData.tokens;
            
            console.log('🔐 [API] Token refresh successful');

            store.dispatch(
              setTokens({
                token: accessToken,
                refreshToken: newRefreshToken,
              })
            );

            // Process queued requests
            this.requestQueue.forEach(({ resolve, reject, config }) => {
              if (config.headers) {
                config.headers.Authorization = `Bearer ${accessToken}`;
              }
              this.api(config).then(resolve).catch(reject);
            });
            this.requestQueue = [];

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return this.api(originalRequest);
          } catch (refreshError: any) {
            console.log('🔐 [API] Token refresh failed:', refreshError.message);
            
            // Clear timeout
            if (this.refreshTimeout) {
              clearTimeout(this.refreshTimeout);
              this.refreshTimeout = null;
            }
            
            // Reject all queued requests
            this.requestQueue.forEach(({ reject }) => reject(refreshError));
            this.requestQueue = [];
            
            // Only logout and redirect if not on a public page
            const currentPath = window.location.pathname;
            const isPublicPage = currentPath === '/' || currentPath === '/login' || currentPath === '/register';
            
            if (!isPublicPage) {
              console.log('🔐 [API] Logging out user');
              store.dispatch(logout());
              window.location.href = '/login';
            }
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle timeout errors
        if (RequestTimeoutHandler.isTimeoutError(error)) {
          console.warn('⏰ [API] Request Timeout:', requestUrl);
          // You could show a user-friendly timeout message here
        }

        // Handle other HTTP errors
        if (error.response?.status >= 500) {
          console.error('🔥 [API] Server Error:', error.response.status, requestUrl);
        } else if (error.response?.status === 404) {
          console.warn('🔍 [API] Not Found:', requestUrl);
        } else if (error.response?.status === 403) {
          console.warn('🚫 [API] Forbidden:', requestUrl);
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic HTTP methods with standardized response handling and timeout
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await RequestTimeoutHandler.withTimeout(
        this.api.get(url, config),
        config?.timeout || 30000,
        RequestTimeoutHandler.getTimeoutMessage(config?.timeout || 30000)
      );
      return ApiResponseHandler.extractData<T>(response.data);
    } catch (error) {
      console.error(`[API] GET ${url} failed:`, error);
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log('[API] POST request:', url, 'Data:', data);
      const response = await RequestTimeoutHandler.withTimeout(
        this.api.post(url, data, config),
        config?.timeout || 30000,
        RequestTimeoutHandler.getTimeoutMessage(config?.timeout || 30000)
      );
      console.log('[API] POST response:', response.status, response.data);
      return ApiResponseHandler.extractData<T>(response.data);
    } catch (error) {
      console.error(`[API] POST ${url} failed:`, error);
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await RequestTimeoutHandler.withTimeout(
        this.api.put(url, data, config),
        config?.timeout || 30000,
        RequestTimeoutHandler.getTimeoutMessage(config?.timeout || 30000)
      );
      return ApiResponseHandler.extractData<T>(response.data);
    } catch (error) {
      console.error(`[API] PUT ${url} failed:`, error);
      throw error;
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await RequestTimeoutHandler.withTimeout(
        this.api.patch(url, data, config),
        config?.timeout || 30000,
        RequestTimeoutHandler.getTimeoutMessage(config?.timeout || 30000)
      );
      return ApiResponseHandler.extractData<T>(response.data);
    } catch (error) {
      console.error(`[API] PATCH ${url} failed:`, error);
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await RequestTimeoutHandler.withTimeout(
        this.api.delete(url, config),
        config?.timeout || 30000,
        RequestTimeoutHandler.getTimeoutMessage(config?.timeout || 30000)
      );
      return ApiResponseHandler.extractData<T>(response.data);
    } catch (error) {
      console.error(`[API] DELETE ${url} failed:`, error);
      throw error;
    }
  }

  // Raw response methods (for cases where you need the full response)
  async getRaw<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.get(url, config);
    return ApiResponseHandler.normalize<T>(response.data);
  }

  async postRaw<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.post(url, data, config);
    return ApiResponseHandler.normalize<T>(response.data);
  }

  // Get raw axios instance for special cases
  getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}

export const apiCore = new ApiCore();
