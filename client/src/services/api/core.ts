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
  '/notifications',
  '/conversations',
  '/messages/unread',
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
          // For silent fail endpoints, just reject without logout or refresh
          if (this.isSilentFailEndpoint(requestUrl)) {
            console.debug(`[API] Silent 401 for ${requestUrl}`);
            return Promise.reject(error);
          }

          // Don't retry if already retried
          if (originalRequest._retry) {
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          try {
            // Prevent multiple simultaneous refresh requests
            if (!this.refreshPromise) {
              const state = store.getState();
              const refreshToken = state.auth.refreshToken;

              if (!refreshToken) {
                throw new Error('No refresh token available');
              }

              this.refreshPromise = this.api.post('/auth/refresh-token', { refreshToken });
            }

            const response = await this.refreshPromise;
            this.refreshPromise = null;

            const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

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
          } catch (refreshError) {
            this.refreshPromise = null;
            
            // Only logout and redirect if not on a public page
            const currentPath = window.location.pathname;
            const isPublicPage = currentPath === '/' || currentPath === '/login' || currentPath === '/register';
            
            if (!isPublicPage) {
              store.dispatch(logout());
              window.location.href = '/login';
            }
            
            return Promise.reject(refreshError);
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
    const response = await this.api.post<T>(url, data, config);
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
