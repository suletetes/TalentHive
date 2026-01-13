/**
 * Loading state management utilities for better user experience
 */

import { useState, useEffect, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any;
  lastUpdated: number | null;
}

export interface LoadingOptions {
  initialLoading?: boolean;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Enhanced loading state hook with error handling and retry logic
 */
export function useLoadingState<T>(
  asyncFn: () => Promise<T>,
  dependencies: any[] = [],
  options: LoadingOptions = {}
) {
  const {
    initialLoading = true,
    timeout = 30000,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    data: null,
    lastUpdated: null,
  });

  const [retryAttempt, setRetryAttempt] = useState(0);

  const execute = useCallback(async (attempt = 0) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });

      const result = await Promise.race([asyncFn(), timeoutPromise]) as T;

      setState({
        isLoading: false,
        error: null,
        data: result,
        lastUpdated: Date.now(),
      });

      setRetryAttempt(0);
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred';

      if (attempt < retryCount) {
        console.log(`[LOADING] Retrying... Attempt ${attempt + 1}/${retryCount}`);
        setRetryAttempt(attempt + 1);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        return execute(attempt + 1);
      }

      setState({
        isLoading: false,
        error: errorMessage,
        data: null,
        lastUpdated: Date.now(),
      });

      throw error;
    }
  }, [asyncFn, timeout, retryCount, retryDelay]);

  const retry = useCallback(() => {
    execute();
  }, [execute]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null,
      lastUpdated: null,
    });
    setRetryAttempt(0);
  }, []);

  useEffect(() => {
    if (initialLoading) {
      execute();
    }
  }, dependencies);

  return {
    ...state,
    execute,
    retry,
    reset,
    retryAttempt,
    canRetry: retryAttempt < retryCount,
  };
}

/**
 * Multiple loading states manager
 */
export class LoadingStateManager {
  private states: Map<string, LoadingState> = new Map();
  private listeners: Map<string, Set<(state: LoadingState) => void>> = new Map();

  /**
   * Set loading state for a key
   */
  setLoading(key: string, isLoading: boolean): void {
    const currentState = this.states.get(key) || {
      isLoading: false,
      error: null,
      data: null,
      lastUpdated: null,
    };

    const newState = { ...currentState, isLoading };
    this.states.set(key, newState);
    this.notifyListeners(key, newState);
  }

  /**
   * Set error state for a key
   */
  setError(key: string, error: string | null): void {
    const currentState = this.states.get(key) || {
      isLoading: false,
      error: null,
      data: null,
      lastUpdated: null,
    };

    const newState = { 
      ...currentState, 
      error, 
      isLoading: false,
      lastUpdated: Date.now(),
    };
    this.states.set(key, newState);
    this.notifyListeners(key, newState);
  }

  /**
   * Set data state for a key
   */
  setData(key: string, data: any): void {
    const currentState = this.states.get(key) || {
      isLoading: false,
      error: null,
      data: null,
      lastUpdated: null,
    };

    const newState = { 
      ...currentState, 
      data, 
      error: null,
      isLoading: false,
      lastUpdated: Date.now(),
    };
    this.states.set(key, newState);
    this.notifyListeners(key, newState);
  }

  /**
   * Get loading state for a key
   */
  getState(key: string): LoadingState {
    return this.states.get(key) || {
      isLoading: false,
      error: null,
      data: null,
      lastUpdated: null,
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key: string, listener: (state: LoadingState) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(listener);

    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(listener);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Clear state for a key
   */
  clear(key: string): void {
    this.states.delete(key);
    this.listeners.delete(key);
  }

  /**
   * Clear all states
   */
  clearAll(): void {
    this.states.clear();
    this.listeners.clear();
  }

  /**
   * Get all loading states
   */
  getAllStates(): Record<string, LoadingState> {
    return Object.fromEntries(this.states);
  }

  /**
   * Check if any state is loading
   */
  isAnyLoading(): boolean {
    return Array.from(this.states.values()).some(state => state.isLoading);
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners(key: string, state: LoadingState): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(listener => listener(state));
    }
  }
}

// Global loading state manager
export const globalLoadingManager = new LoadingStateManager();

/**
 * Hook to use global loading state manager
 */
export function useGlobalLoadingState(key: string) {
  const [state, setState] = useState(() => globalLoadingManager.getState(key));

  useEffect(() => {
    const unsubscribe = globalLoadingManager.subscribe(key, setState);
    return unsubscribe;
  }, [key]);

  const setLoading = useCallback((isLoading: boolean) => {
    globalLoadingManager.setLoading(key, isLoading);
  }, [key]);

  const setError = useCallback((error: string | null) => {
    globalLoadingManager.setError(key, error);
  }, [key]);

  const setData = useCallback((data: any) => {
    globalLoadingManager.setData(key, data);
  }, [key]);

  const clear = useCallback(() => {
    globalLoadingManager.clear(key);
  }, [key]);

  return {
    ...state,
    setLoading,
    setError,
    setData,
    clear,
  };
}

/**
 * Loading state keys for different parts of the application
 */
export const LoadingKeys = {
  // User-related
  USER_PROFILE: 'user_profile',
  USER_STATS: 'user_stats',
  USER_NOTIFICATIONS: 'user_notifications',
  
  // Projects
  PROJECTS_LIST: 'projects_list',
  PROJECT_DETAILS: 'project_details',
  PROJECT_PROPOSALS: 'project_proposals',
  
  // Proposals
  MY_PROPOSALS: 'my_proposals',
  PROPOSAL_DETAILS: 'proposal_details',
  PROPOSAL_SUBMIT: 'proposal_submit',
  
  // Contracts
  MY_CONTRACTS: 'my_contracts',
  CONTRACT_DETAILS: 'contract_details',
  CONTRACT_SIGN: 'contract_sign',
  
  // Messages
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  SEND_MESSAGE: 'send_message',
  
  // Payments
  PAYMENT_METHODS: 'payment_methods',
  PAYMENT_PROCESS: 'payment_process',
  PAYMENT_HISTORY: 'payment_history',
  
  // Admin
  ADMIN_USERS: 'admin_users',
  ADMIN_REPORTS: 'admin_reports',
  ADMIN_SETTINGS: 'admin_settings',
};

/**
 * Batch loading state manager for multiple operations
 */
export function useBatchLoadingState(keys: string[]) {
  const [states, setStates] = useState<Record<string, LoadingState>>(() => {
    const initialStates: Record<string, LoadingState> = {};
    keys.forEach(key => {
      initialStates[key] = globalLoadingManager.getState(key);
    });
    return initialStates;
  });

  useEffect(() => {
    const unsubscribes = keys.map(key => 
      globalLoadingManager.subscribe(key, (state) => {
        setStates(prev => ({ ...prev, [key]: state }));
      })
    );

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [keys]);

  const isAnyLoading = Object.values(states).some(state => state.isLoading);
  const hasAnyError = Object.values(states).some(state => state.error);
  const allLoaded = Object.values(states).every(state => state.data !== null);

  return {
    states,
    isAnyLoading,
    hasAnyError,
    allLoaded,
  };
}

/**
 * Optimistic update utilities
 */
export class OptimisticUpdates {
  private originalData: Map<string, any> = new Map();

  /**
   * Apply optimistic update
   */
  apply<T>(key: string, currentData: T, optimisticData: T): T {
    this.originalData.set(key, currentData);
    return optimisticData;
  }

  /**
   * Confirm optimistic update (remove from rollback data)
   */
  confirm(key: string): void {
    this.originalData.delete(key);
  }

  /**
   * Rollback optimistic update
   */
  rollback<T>(key: string): T | null {
    const original = this.originalData.get(key);
    this.originalData.delete(key);
    return original || null;
  }

  /**
   * Check if key has pending optimistic update
   */
  hasPending(key: string): boolean {
    return this.originalData.has(key);
  }

  /**
   * Clear all optimistic updates
   */
  clear(): void {
    this.originalData.clear();
  }
}

// Global optimistic updates manager
export const optimisticUpdates = new OptimisticUpdates();

/**
 * Hook for optimistic updates
 */
export function useOptimisticUpdate<T>(key: string, initialData: T) {
  const [data, setData] = useState<T>(initialData);

  const applyOptimistic = useCallback((optimisticData: T) => {
    const current = data;
    const updated = optimisticUpdates.apply(key, current, optimisticData);
    setData(updated);
  }, [key, data]);

  const confirmUpdate = useCallback((confirmedData?: T) => {
    optimisticUpdates.confirm(key);
    if (confirmedData !== undefined) {
      setData(confirmedData);
    }
  }, [key]);

  const rollbackUpdate = useCallback(() => {
    const original = optimisticUpdates.rollback<T>(key);
    if (original !== null) {
      setData(original);
    }
  }, [key]);

  return {
    data,
    setData,
    applyOptimistic,
    confirmUpdate,
    rollbackUpdate,
    hasPending: optimisticUpdates.hasPending(key),
  };
}