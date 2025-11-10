import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { ErrorHandler } from '@/utils/errorHandler';

// Cache time configurations for different data types
export const CACHE_TIMES = {
  // Static/rarely changing data
  STATIC: {
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
  },
  // User profile, settings
  USER_DATA: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  },
  // Projects, proposals, contracts
  MAIN_CONTENT: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  },
  // Messages, notifications
  REAL_TIME: {
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  },
  // Search results
  SEARCH: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  },
  // Analytics, reports
  ANALYTICS: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  },
};

// Retry logic with exponential backoff
const retryDelay = (attemptIndex: number) => {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
};

const shouldRetry = (failureCount: number, error: any) => {
  // Don't retry on 4xx errors (except 429 - rate limit)
  if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
    return false;
  }

  // Retry up to 3 times
  return failureCount < 3;
};

// Create query client with optimized configuration
export const createQueryClient = () => {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Only show error toasts for queries that have data
        // This prevents showing errors on initial page load
        if (query.state.data !== undefined) {
          const apiError = ErrorHandler.handle(error);
          
          // Don't show toast for background refetch errors
          if (!query.state.isFetching) {
            ErrorHandler.showToast(apiError);
          }
          
          // Log error for monitoring
          ErrorHandler.logError(error, `Query: ${query.queryHash}`);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // Show error toast for mutations
        const apiError = ErrorHandler.handle(error);
        ErrorHandler.showToast(apiError);
        
        // Log error for monitoring
        ErrorHandler.logError(error, `Mutation: ${mutation.options.mutationKey}`);
      },
    }),
    defaultOptions: {
      queries: {
        // Default cache times
        staleTime: CACHE_TIMES.MAIN_CONTENT.staleTime,
        gcTime: CACHE_TIMES.MAIN_CONTENT.cacheTime, // Previously cacheTime in v4
        
        // Retry configuration
        retry: shouldRetry,
        retryDelay,
        
        // Refetch configuration
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        
        // Network mode
        networkMode: 'online',
        
        // Prevent unnecessary refetches
        refetchInterval: false,
        refetchIntervalInBackground: false,
        
        // Structural sharing for better performance
        structuralSharing: true,
      },
      mutations: {
        // Retry configuration for mutations
        retry: (failureCount, error: any) => {
          // Only retry on network errors or 5xx errors
          if (ErrorHandler.isNetworkError(ErrorHandler.handle(error)) || 
              ErrorHandler.isServerError(ErrorHandler.handle(error))) {
            return failureCount < 2;
          }
          return false;
        },
        retryDelay,
        
        // Network mode
        networkMode: 'online',
      },
    },
  });
};

// Query key factories for consistent cache management
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    profile: (userId: string) => [...queryKeys.auth.all, 'profile', userId] as const,
  },
  
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    my: () => [...queryKeys.projects.all, 'my'] as const,
  },
  
  // Proposals
  proposals: {
    all: ['proposals'] as const,
    lists: () => [...queryKeys.proposals.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.proposals.lists(), filters] as const,
    details: () => [...queryKeys.proposals.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.proposals.details(), id] as const,
    byProject: (projectId: string) => [...queryKeys.proposals.all, 'project', projectId] as const,
    my: () => [...queryKeys.proposals.all, 'my'] as const,
  },
  
  // Contracts
  contracts: {
    all: ['contracts'] as const,
    lists: () => [...queryKeys.contracts.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.contracts.lists(), filters] as const,
    details: () => [...queryKeys.contracts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.contracts.details(), id] as const,
    my: () => [...queryKeys.contracts.all, 'my'] as const,
  },
  
  // Payments
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.payments.lists(), filters] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    history: () => [...queryKeys.payments.all, 'history'] as const,
  },
  
  // Messages
  messages: {
    all: ['messages'] as const,
    conversations: () => [...queryKeys.messages.all, 'conversations'] as const,
    conversation: (id: string) => [...queryKeys.messages.all, 'conversation', id] as const,
    unread: () => [...queryKeys.messages.all, 'unread'] as const,
  },
  
  // Reviews
  reviews: {
    all: ['reviews'] as const,
    lists: () => [...queryKeys.reviews.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.reviews.lists(), filters] as const,
    byUser: (userId: string) => [...queryKeys.reviews.all, 'user', userId] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.notifications.lists(), filters] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
    preferences: () => [...queryKeys.notifications.all, 'preferences'] as const,
  },
  
  // Time Tracking
  timeTracking: {
    all: ['timeTracking'] as const,
    entries: () => [...queryKeys.timeTracking.all, 'entries'] as const,
    entry: (id: string) => [...queryKeys.timeTracking.entries(), id] as const,
    sessions: () => [...queryKeys.timeTracking.all, 'sessions'] as const,
    active: () => [...queryKeys.timeTracking.all, 'active'] as const,
    reports: () => [...queryKeys.timeTracking.all, 'reports'] as const,
  },
  
  // Organizations
  organizations: {
    all: ['organizations'] as const,
    lists: () => [...queryKeys.organizations.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.organizations.lists(), filters] as const,
    details: () => [...queryKeys.organizations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.organizations.details(), id] as const,
    members: (orgId: string) => [...queryKeys.organizations.all, 'members', orgId] as const,
  },
  
  // Service Packages
  services: {
    all: ['services'] as const,
    packages: () => [...queryKeys.services.all, 'packages'] as const,
    package: (id: string) => [...queryKeys.services.packages(), id] as const,
    templates: () => [...queryKeys.services.all, 'templates'] as const,
    vendors: () => [...queryKeys.services.all, 'vendors'] as const,
  },
  
  // Search
  search: {
    all: ['search'] as const,
    results: (query: string, filters: Record<string, any>) => 
      [...queryKeys.search.all, query, filters] as const,
  },
  
  // Admin
  admin: {
    all: ['admin'] as const,
    analytics: () => [...queryKeys.admin.all, 'analytics'] as const,
    users: () => [...queryKeys.admin.all, 'users'] as const,
    reports: () => [...queryKeys.admin.all, 'reports'] as const,
  },
};

// Helper to invalidate related queries
export const invalidateQueries = {
  project: (queryClient: QueryClient, projectId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.byProject(projectId) });
    }
  },
  
  proposal: (queryClient: QueryClient, proposalId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
  },
  
  contract: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
  },
  
  message: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread() });
  },
  
  notification: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  },
};
