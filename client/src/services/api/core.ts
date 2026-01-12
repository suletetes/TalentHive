import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { store } from '@/store';
import { logout, setTokens } from '@/store/slices/authSlice';

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

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private setupResponseInterceptor() {
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; _silentFail?: boolean };
        const requestUrl = originalRequest.url || '';

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
          }
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
