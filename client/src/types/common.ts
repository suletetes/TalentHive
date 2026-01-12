// Common types used across the application

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface FileUpload {
  file: File;
  url?: string;
  progress?: number;
  error?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface Rating {
  average: number;
  count: number;
}

export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  order: SortOrder;
}

export interface FilterConfig {
  [key: string]: any;
}

export interface SearchParams {
  query?: string;
  filters?: FilterConfig;
  sort?: SortConfig;
  page?: number;
  limit?: number;
}