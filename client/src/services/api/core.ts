import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { store } from '@/store';
import { logout, setTokens } from '@/store/slices/authSlice';

// Enhanced error logging interface
interface ApiErrorContext {
  url: string;
  method: string;
  status?: number;
  message: string;
  timestamp: string;
  userId?: string;
  requestId?: string;
}

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

  private logError(context: ApiErrorContext) {
    console.error('[API ERROR]', {
      timestamp: context.timestamp,
      method: context.method,
      url: context.url,
      status: context.status,
      message: context.message,
      userId: context.userId,
      requestId: context.requestId,
    });
    
    // In production, you might want to send this to an error tracking service
    // like Sentry, LogRocket, or your own logging endpoint
  }

  private createErrorContext(error: AxiosError, additionalInfo?: Partial<ApiErrorContext>): ApiErrorContext {
    const state = store.getState();
    const userId = state.auth.user?._id;
    
    return {
      url: error.config?.url || 'unknown',
      method: (error.config?.method || 'unknown').toUpperCase(),
      status: error.response?.status,
      message: error.message,
      timestamp: new Date().toISOString(),
      userId,
      requestId: error.config?.headers?.['X-Request-ID'] as string,
      ...additionalInfo,
    };
  }

  private isSilentFailEndpoint(url: string): boolean {
    return SILENT_FAIL_ENDPOINTS.some(endpoint => url.includes(endpoint));
  }

  private setupRequestInterceptor() {
    this.api.interceptors.request.use(
      (config) => {
        const state = store.getState();
        const token = state.auth.token;

        // Add request ID for tracking
        if (config.headers) {
          config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`, {
            headers: config.headers,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        this.logError(this.createErrorContext(error, { message: 'Request setup failed' }));
        return Promise.reject(error);
      }
    );
  }

  private setupResponseInterceptor() {
    this.api.interceptors.response.use(
      (response) => {
        // Log successful responses in development
        if (import.meta.env.DEV) {
          console.log(`[API RESPONSE] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; _silentFail?: boolean };
        const requestUrl = originalRequest.url || '';
        
        // Create error context for logging
        const errorContext = this.createErrorContext(error);

        // Handle 401 errors
        if (error.response?.status === 401) {
          console.log('  [API] 401 Error on:', requestUrl);
          
          // For silent fail endpoints, just reject without logout or refresh
          if (this.isSilentFailEndpoint(requestUrl)) {
            console.debug(`[API] Silent 401 for ${requestUrl}`);
            return Promise.reject(error);
          }

          // Don't retry if already retried
          if (originalRequest._retry) {
            console.log('  [API] Already retried, giving up');
            this.logError({ ...errorContext, message: 'Authentication failed after retry' });
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          try {
            console.log('  [API] Attempting token refresh...');
            
            // Prevent multiple simultaneous refresh requests
            if (!this.refreshPromise) {
              const state = store.getState();
              const refreshToken = state.auth.refreshToken;

              if (!refreshToken) {
                console.log('  [API] No refresh token available');
                throw new Error('No refresh token available');
              }

              this.refreshPromise = this.api.post('/auth/refresh-token', { refreshToken });
            }

            const response = await this.refreshPromise;
            this.refreshPromise = null;

            const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
            
            console.log('  [API] Token refresh successful');

            store.dispatch(
              setTokens({
                token: accessToken,
                refreshToken: newRefreshToken,
              })
            );

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return this.api(originalRequest);
          } catch (refreshError: any) {
            this.refreshPromise = null;
            console.log('  [API] Token refresh failed:', refreshError.message);
            
            this.logError({
              ...errorContext,
              message: `Token refresh failed: ${refreshError.message}`,
            });
            
            // Only logout and redirect if not on a public page
            const currentPath = window.location.pathname;
            const isPublicPage = currentPath === '/' || currentPath === '/login' || currentPath === '/register';
            
            if (!isPublicPage) {
              console.log('  [API] Logging out user');
              store.dispatch(logout());
              window.location.href = '/login';
            }
            
            return Promise.reject(refreshError);
          }
        }

        // Handle 429 (Rate Limit) errors
        if (error.response?.status === 429) {
          console.warn('  [API] Rate limit exceeded on:', requestUrl);
          
          // Get retry-after header if available
          const retryAfter = error.response.headers['retry-after'];
          const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : 5000; // Default 5 seconds
          
          console.log(`  [API] Retrying after ${retryAfterMs}ms`);
          
          // Wait and retry once
          if (!originalRequest._retry) {
            originalRequest._retry = true;
            
            await new Promise(resolve => setTimeout(resolve, retryAfterMs));
            return this.api(originalRequest);
          } else {
            this.logError({
              ...errorContext,
              message: 'Rate limit exceeded after retry',
            });
          }
        }

        // Handle network errors
        if (!error.response) {
          this.logError({
            ...errorContext,
            message: `Network error: ${error.message}`,
          });
        } else {
          // Log other HTTP errors
          this.logError(errorContext);
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    console.log('[API] POST request:', url, 'Data:', data);
    const response = await this.api.post<T>(url, data, config);
    console.log('[API] POST response:', response.status, response.data);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  // Get raw axios instance for special cases
  getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}

export const apiCore = new ApiCore();
