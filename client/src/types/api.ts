// API-related types

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

export interface PaginatedApiResponse<T> extends ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {}

export interface ApiRequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ApiEndpoints {
  auth: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
    verifyEmail: string;
    forgotPassword: string;
    resetPassword: string;
  };
  users: {
    profile: string;
    update: string;
    freelancers: string;
    clients: string;
  };
  projects: {
    list: string;
    create: string;
    detail: (id: string) => string;
    update: (id: string) => string;
    delete: (id: string) => string;
    my: string;
    stats: string;
  };
  // Add more endpoints as needed
}