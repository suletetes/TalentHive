# Frontend-Backend Integration Design Document

## Overview

This design document outlines the comprehensive integration architecture between the TalentHive React frontend and Node.js/Express backend. The design focuses on creating a robust, scalable, and maintainable integration layer that ensures seamless communication, optimal performance, and excellent user experience.

### Key Design Principles

1. **Separation of Concerns**: Clear boundaries between API layer, state management, and UI components
2. **Type Safety**: End-to-end TypeScript types shared between frontend and backend
3. **Performance First**: Aggressive caching, optimistic updates, and lazy loading
4. **Error Resilience**: Comprehensive error handling with graceful degradation
5. **Real-time Capable**: Socket.io integration for instant updates
6. **Developer Experience**: Intuitive APIs, clear patterns, and excellent tooling

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   UI Layer   │  │  State Mgmt  │  │  API Layer   │     │
│  │  (Components)│◄─┤  Redux+Query │◄─┤  (Services)  │     │
│  └──────────────┘  └──────────────┘  └──────┬───────┘     │
│                                               │              │
└───────────────────────────────────────────────┼─────────────┘
                                                │
                                    ┌───────────▼───────────┐
                                    │   HTTP/WebSocket      │
                                    │   (Axios/Socket.io)   │
                                    └───────────┬───────────┘
                                                │
┌───────────────────────────────────────────────┼─────────────┐
│                                               │              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────▼───────┐     │
│  │   Database   │◄─┤  Controllers │◄─┤    Routes    │     │
│  │   (MongoDB)  │  │   (Logic)    │  │  (Express)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                     Node.js Backend                         │
└─────────────────────────────────────────────────────────────┘
```

### API Service Layer Architecture

```typescript
// Centralized API Service Structure
ApiService
├── Core (Axios instance with interceptors)
├── Auth Module (login, register, refresh)
├── Projects Module (CRUD operations)
├── Proposals Module (submission, management)
├── Contracts Module (creation, milestones)
├── Payments Module (Stripe integration)
├── Messages Module (chat operations)
├── Reviews Module (ratings, feedback)
├── Notifications Module (alerts, preferences)
├── TimeTracking Module (entries, reports)
├── Organizations Module (teams, budgets)
├── Services Module (packages, templates)
├── Search Module (discovery, filtering)
└── Upload Module (file management)
```

## Components and Interfaces

### 1. API Service Core

**Purpose**: Centralized HTTP client with authentication, error handling, and request/response transformation

**Implementation**:

```typescript
// client/src/services/api/core.ts
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
            
            store.dispatch(setTokens({ 
              token: accessToken, 
              refreshToken: newRefreshToken 
            }));
            
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
```

### 2. Feature-Specific Service Modules

**Purpose**: Encapsulate API calls for specific features with typed interfaces

**Example - Projects Service**:

```typescript
// client/src/services/api/projects.service.ts
import { apiCore } from './core';
import { 
  Project, 
  CreateProjectDto, 
  UpdateProjectDto, 
  ProjectFilters,
  PaginatedResponse 
} from '@/types/project';

export class ProjectsService {
  private basePath = '/projects';

  async getProjects(filters?: ProjectFilters): Promise<PaginatedResponse<Project>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    return apiCore.get<PaginatedResponse<Project>>(
      `${this.basePath}?${params.toString()}`
    );
  }

  async getProjectById(id: string): Promise<{ data: Project }> {
    return apiCore.get<{ data: Project }>(`${this.basePath}/${id}`);
  }

  async createProject(data: CreateProjectDto): Promise<{ data: Project }> {
    return apiCore.post<{ data: Project }>(this.basePath, data);
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<{ data: Project }> {
    return apiCore.put<{ data: Project }>(`${this.basePath}/${id}`, data);
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    return apiCore.delete<{ message: string }>(`${this.basePath}/${id}`);
  }

  async getMyProjects(): Promise<{ data: Project[] }> {
    return apiCore.get<{ data: Project[] }>(`${this.basePath}/my/projects`);
  }

  async searchProjects(query: string, filters?: ProjectFilters): Promise<PaginatedResponse<Project>> {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    return apiCore.get<PaginatedResponse<Project>>(
      `${this.basePath}/search?${params.toString()}`
    );
  }

  async toggleProjectStatus(id: string): Promise<{ data: Project }> {
    return apiCore.patch<{ data: Project }>(`${this.basePath}/${id}/status`);
  }

  async getProjectStats(): Promise<{ data: any }> {
    return apiCore.get<{ data: any }>(`${this.basePath}/my/stats`);
  }
}

export const projectsService = new ProjectsService();
```

### 3. React Query Integration

**Purpose**: Manage server state with caching, background updates, and optimistic updates

**Implementation**:

```typescript
// client/src/hooks/api/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '@/services/api/projects.service';
import { CreateProjectDto, UpdateProjectDto, ProjectFilters } from '@/types/project';
import { toast } from 'react-hot-toast';

// Query keys for cache management
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: ProjectFilters) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  my: () => [...projectKeys.all, 'my'] as const,
  stats: () => [...projectKeys.all, 'stats'] as const,
};

// Fetch projects with filters
export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => projectsService.getProjects(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch single project
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsService.getProjectById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch my projects
export function useMyProjects() {
  return useQuery({
    queryKey: projectKeys.my(),
    queryFn: () => projectsService.getMyProjects(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Create project mutation
export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProjectDto) => projectsService.createProject(data),
    onSuccess: (response) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.my() });
      toast.success('Project created successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create project';
      toast.error(message);
    },
  });
}

// Update project mutation with optimistic update
export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectDto }) => 
      projectsService.updateProject(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });
      
      // Snapshot previous value
      const previousProject = queryClient.getQueryData(projectKeys.detail(id));
      
      // Optimistically update
      queryClient.setQueryData(projectKeys.detail(id), (old: any) => ({
        ...old,
        data: { ...old?.data, ...data },
      }));
      
      return { previousProject };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(
          projectKeys.detail(variables.id),
          context.previousProject
        );
      }
      toast.error('Failed to update project');
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.my() });
      toast.success('Project updated successfully!');
    },
  });
}

// Delete project mutation
export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => projectsService.deleteProject(id),
    onSuccess: (response, id) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.my() });
      toast.success('Project deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete project');
    },
  });
}
```

### 4. Socket.io Real-Time Integration

**Purpose**: Enable real-time bidirectional communication for instant updates

**Implementation**:

```typescript
// client/src/services/socket/socket.service.ts
import { io, Socket } from 'socket.io-client';
import { store } from '@/store';

export class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    if (this.socket?.connected) {
      return;
    }

    const state = store.getState();
    const token = state.auth.token;

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Message events
  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('message:new', callback);
  }

  sendMessage(data: any) {
    this.socket?.emit('message:send', data);
  }

  onTyping(callback: (data: any) => void) {
    this.socket?.on('message:typing', callback);
  }

  emitTyping(conversationId: string) {
    this.socket?.emit('message:typing', { conversationId });
  }

  // Notification events
  onNotification(callback: (notification: any) => void) {
    this.socket?.on('notification:new', callback);
  }

  // Proposal events
  onProposalUpdate(callback: (proposal: any) => void) {
    this.socket?.on('proposal:update', callback);
  }

  // Contract events
  onContractUpdate(callback: (contract: any) => void) {
    this.socket?.on('contract:update', callback);
  }

  onMilestoneUpdate(callback: (milestone: any) => void) {
    this.socket?.on('milestone:update', callback);
  }

  // Payment events
  onPaymentUpdate(callback: (payment: any) => void) {
    this.socket?.on('payment:update', callback);
  }

  // Generic event listener
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  // Generic event emitter
  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  // Remove event listener
  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
```

### 5. Error Handling Strategy

**Purpose**: Provide consistent, user-friendly error handling across the application

**Implementation**:

```typescript
// client/src/utils/errorHandler.ts
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  statusCode?: number;
}

export class ErrorHandler {
  static handle(error: unknown): ApiError {
    if (error instanceof AxiosError) {
      return this.handleAxiosError(error);
    }
    
    if (error instanceof Error) {
      return {
        message: error.message,
        statusCode: 500,
      };
    }
    
    return {
      message: 'An unexpected error occurred',
      statusCode: 500,
    };
  }

  private static handleAxiosError(error: AxiosError): ApiError {
    const response = error.response;
    
    if (!response) {
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }

    const data = response.data as any;
    
    switch (response.status) {
      case 400:
        return {
          message: data?.message || 'Invalid request',
          code: 'BAD_REQUEST',
          field: data?.field,
          statusCode: 400,
        };
      
      case 401:
        return {
          message: 'Please log in to continue',
          code: 'UNAUTHORIZED',
          statusCode: 401,
        };
      
      case 403:
        return {
          message: 'You don\'t have permission to perform this action',
          code: 'FORBIDDEN',
          statusCode: 403,
        };
      
      case 404:
        return {
          message: data?.message || 'Resource not found',
          code: 'NOT_FOUND',
          statusCode: 404,
        };
      
      case 409:
        return {
          message: data?.message || 'Resource already exists',
          code: 'CONFLICT',
          statusCode: 409,
        };
      
      case 422:
        return {
          message: data?.message || 'Validation failed',
          code: 'VALIDATION_ERROR',
          field: data?.field,
          statusCode: 422,
        };
      
      case 429:
        return {
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT',
          statusCode: 429,
        };
      
      case 500:
      default:
        return {
          message: 'Server error. Please try again later.',
          code: 'SERVER_ERROR',
          statusCode: response.status,
        };
    }
  }

  static showToast(error: ApiError) {
    toast.error(error.message, {
      duration: 4000,
      position: 'top-right',
    });
  }

  static handleAndShow(error: unknown) {
    const apiError = this.handle(error);
    this.showToast(apiError);
    return apiError;
  }
}

// React Error Boundary
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    // Log to error monitoring service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Data Models

### Shared TypeScript Interfaces

**Purpose**: Ensure type consistency between frontend and backend

```typescript
// Shared types structure
client/src/types/
├── auth.ts          // Authentication types
├── user.ts          // User and profile types
├── project.ts       // Project types
├── proposal.ts      // Proposal types
├── contract.ts      // Contract and milestone types
├── payment.ts       // Payment types
├── message.ts       // Message types
├── review.ts        // Review types
├── notification.ts  // Notification types
├── timeTracking.ts  // Time tracking types
├── organization.ts  // Organization types
├── service.ts       // Service package types
└── common.ts        // Common/shared types
```

**Example - Project Types**:

```typescript
// client/src/types/project.ts
export interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget: {
    type: 'fixed' | 'hourly';
    min: number;
    max: number;
    currency: string;
  };
  timeline: {
    duration: number;
    unit: 'days' | 'weeks' | 'months';
    startDate?: Date;
    endDate?: Date;
  };
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  client: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  requirements: string[];
  attachments: string[];
  proposalCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDto {
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget: {
    type: 'fixed' | 'hourly';
    min: number;
    max: number;
  };
  timeline: {
    duration: number;
    unit: 'days' | 'weeks' | 'months';
  };
  requirements: string[];
  attachments?: string[];
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {
  status?: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
}

export interface ProjectFilters {
  category?: string;
  skills?: string[];
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: 'fixed' | 'hourly';
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
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
```

## Testing Strategy

### Unit Testing

**API Services**:
- Mock Axios responses
- Test error handling
- Verify request parameters
- Test retry logic

**React Hooks**:
- Mock TanStack Query
- Test loading states
- Test error states
- Test success callbacks

### Integration Testing

**API Integration**:
- Test complete request/response cycles
- Verify authentication flow
- Test token refresh mechanism
- Verify error handling

**Component Integration**:
- Test components with real API calls (using MSW)
- Verify optimistic updates
- Test real-time updates
- Verify cache invalidation

### E2E Testing

**User Flows**:
- Complete authentication flow
- Project creation and management
- Proposal submission
- Contract execution
- Payment processing

## Performance Optimization

### Caching Strategy

1. **TanStack Query Cache**:
   - Stale time: 5 minutes for static data
   - GC time: 10 minutes
   - Background refetch on window focus
   - Retry failed requests with exponential backoff

2. **Redux Persist**:
   - Persist auth state
   - Persist user preferences
   - Blacklist sensitive data

3. **Service Worker Cache**:
   - Cache static assets
   - Cache API responses for offline access
   - Implement cache-first strategy for images

### Code Splitting

```typescript
// Lazy load routes
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ProposalsPage = lazy(() => import('@/pages/ProposalsPage'));

// Lazy load heavy components
const RichTextEditor = lazy(() => import('@/components/RichTextEditor'));
const FileUploader = lazy(() => import('@/components/FileUploader'));
```

### Request Optimization

1. **Debouncing**: Search inputs, auto-save
2. **Throttling**: Scroll events, resize events
3. **Request Cancellation**: Cancel pending requests on unmount
4. **Batch Requests**: Combine multiple requests when possible
5. **Prefetching**: Prefetch likely next pages

## Security Considerations

### Authentication Security

1. **Token Storage**: Store tokens in Redux with Redux Persist (encrypted)
2. **Token Refresh**: Automatic refresh before expiration
3. **CSRF Protection**: Include CSRF tokens in state-changing requests
4. **XSS Prevention**: Sanitize user inputs, use Content Security Policy

### API Security

1. **HTTPS Only**: Enforce HTTPS in production
2. **Rate Limiting**: Respect backend rate limits
3. **Input Validation**: Validate all inputs before sending
4. **Sensitive Data**: Never log sensitive data

## Deployment Considerations

### Environment Configuration

```typescript
// .env.development
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_STRIPE_PUBLIC_KEY=pk_test_...

// .env.production
VITE_API_BASE_URL=https://api.talenthive.com/api
VITE_SOCKET_URL=https://api.talenthive.com
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### Build Optimization

1. **Tree Shaking**: Remove unused code
2. **Minification**: Minify JavaScript and CSS
3. **Compression**: Enable Gzip/Brotli compression
4. **Asset Optimization**: Optimize images, fonts
5. **CDN**: Serve static assets from CDN

## Monitoring and Logging

### Frontend Monitoring

1. **Error Tracking**: Sentry for error monitoring
2. **Performance Monitoring**: Web Vitals tracking
3. **User Analytics**: Track user interactions
4. **API Monitoring**: Track API response times and errors

### Logging Strategy

```typescript
// client/src/utils/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[INFO] ${message}`, data);
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
    // Send to error monitoring service
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },
};
```

## Migration Strategy

### Phase 1: Core Integration (Week 1-2)
- Set up API service core
- Implement authentication flow
- Create base service modules
- Set up TanStack Query

### Phase 2: Feature Integration (Week 3-4)
- Integrate projects module
- Integrate proposals module
- Integrate contracts module
- Add real-time messaging

### Phase 3: Advanced Features (Week 5-6)
- Integrate payments
- Add notifications
- Implement time tracking
- Add organizations

### Phase 4: Optimization (Week 7-8)
- Performance optimization
- Error handling improvements
- Testing and bug fixes
- Documentation
