import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { store } from '@/store';
import { logout, setTokens } from '@/store/slices/authSlice';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const state = store.getState();
        const token = state.auth.token;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          const state = store.getState();
          const refreshToken = state.auth.refreshToken;
          
          if (refreshToken) {
            try {
              const response = await this.refreshToken(refreshToken);
              const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
              
              store.dispatch(setTokens({ 
                token: accessToken, 
                refreshToken: newRefreshToken 
              }));
              
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.api(originalRequest);
            } catch (refreshError) {
              store.dispatch(logout());
              window.location.href = '/login';
            }
          } else {
            store.dispatch(logout());
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(userData: any) {
    return this.api.post('/auth/register', userData);
  }

  async login(credentials: { email: string; password: string }) {
    return this.api.post('/auth/login', credentials);
  }

  async logout() {
    return this.api.post('/auth/logout');
  }

  async refreshToken(refreshToken: string) {
    return this.api.post('/auth/refresh-token', { refreshToken });
  }

  async verifyEmail(token: string) {
    return this.api.get(`/auth/verify-email/${token}`);
  }

  // Generic methods
  async get(url: string, config?: AxiosRequestConfig) {
    return this.api.get(url, config);
  }

  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.api.post(url, data, config);
  }

  async put(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.api.put(url, data, config);
  }

  async patch(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.api.patch(url, data, config);
  }

  async delete(url: string, config?: AxiosRequestConfig) {
    return this.api.delete(url, config);
  }
}

export const apiService = new ApiService();
export default apiService;