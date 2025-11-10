import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { store } from '@/store';
import { logout, setTokens } from '@/store/slices/authSlice';

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
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
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
            store.dispatch(logout());
            window.location.href = '/login';
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
