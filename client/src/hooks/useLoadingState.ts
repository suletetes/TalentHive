// Custom hook for managing loading states consistently
import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress?: number;
}

export interface UseLoadingStateOptions {
  initialLoading?: boolean;
  minLoadingTime?: number; // Minimum time to show loading (prevents flashing)
  timeout?: number; // Timeout for operations
}

export const useLoadingState = (options: UseLoadingStateOptions = {}) => {
  const {
    initialLoading = false,
    minLoadingTime = 300, // 300ms minimum
    timeout = 30000, // 30 seconds default timeout
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    progress: undefined,
  });

  const loadingStartTime = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Start loading
  const startLoading = useCallback((message?: string) => {
    loadingStartTime.current = Date.now();
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: undefined,
    }));

    // Set timeout if specified
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Operation timed out. Please try again.',
        }));
      }, timeout);
    }
  }, [timeout]);

  // Stop loading with minimum time enforcement
  const stopLoading = useCallback(async (error?: string | null) => {
    const elapsed = loadingStartTime.current ? Date.now() - loadingStartTime.current : 0;
    const remainingTime = Math.max(0, minLoadingTime - elapsed);

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Wait for minimum loading time if needed
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }

    setState(prev => ({
      ...prev,
      isLoading: false,
      error: error || null,
      progress: undefined,
    }));

    loadingStartTime.current = null;
  }, [minLoadingTime]);

  // Update progress
  const setProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Wrap async operation with loading state
  const withLoading = useCallback(async <T>(
    operation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      startLoading();
      const result = await operation();
      await stopLoading();
      return result;
    } catch (error) {
      const message = errorMessage || 
        (error instanceof Error ? error.message : 'An error occurred');
      await stopLoading(message);
      return null;
    }
  }, [startLoading, stopLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startLoading,
    stopLoading,
    setProgress,
    clearError,
    withLoading,
  };
};

// Hook for managing multiple loading states
export const useMultipleLoadingStates = () => {
  const [states, setStates] = useState<Record<string, LoadingState>>({});

  const setLoadingState = useCallback((key: string, state: Partial<LoadingState>) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        isLoading: false,
        error: null,
        ...prev[key],
        ...state,
      },
    }));
  }, []);

  const startLoading = useCallback((key: string) => {
    setLoadingState(key, { isLoading: true, error: null });
  }, [setLoadingState]);

  const stopLoading = useCallback((key: string, error?: string | null) => {
    setLoadingState(key, { isLoading: false, error });
  }, [setLoadingState]);

  const setProgress = useCallback((key: string, progress: number) => {
    setLoadingState(key, { progress });
  }, [setLoadingState]);

  const getState = useCallback((key: string): LoadingState => {
    return states[key] || { isLoading: false, error: null };
  }, [states]);

  const isAnyLoading = useCallback(() => {
    return Object.values(states).some(state => state.isLoading);
  }, [states]);

  const hasAnyError = useCallback(() => {
    return Object.values(states).some(state => state.error);
  }, [states]);

  return {
    states,
    setLoadingState,
    startLoading,
    stopLoading,
    setProgress,
    getState,
    isAnyLoading,
    hasAnyError,
  };
};

// Hook for debounced loading state (prevents rapid loading state changes)
export const useDebouncedLoadingState = (delay: number = 200) => {
  const [debouncedLoading, setDebouncedLoading] = useState(false);
  const [actualLoading, setActualLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    setActualLoading(loading);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (loading) {
      // Show loading immediately when starting
      setDebouncedLoading(true);
    } else {
      // Delay hiding loading to prevent flashing
      timeoutRef.current = setTimeout(() => {
        setDebouncedLoading(false);
      }, delay);
    }
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading: debouncedLoading,
    actualLoading,
    setLoading,
  };
};