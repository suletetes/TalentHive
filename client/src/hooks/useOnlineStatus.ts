import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  connectionType: string | null;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

interface NetworkErrorHandlerOptions {
  showToasts: boolean;
  retryConfig: RetryConfig;
  onOnline?: () => void;
  onOffline?: () => void;
  onConnectionChange?: (status: NetworkStatus) => void;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
};

const DEFAULT_OPTIONS: NetworkErrorHandlerOptions = {
  showToasts: true,
  retryConfig: DEFAULT_RETRY_CONFIG,
};

export function useOnlineStatus(options: Partial<NetworkErrorHandlerOptions> = {}) {
  const optsRef = useRef({ ...DEFAULT_OPTIONS, ...options });
  optsRef.current = { ...DEFAULT_OPTIONS, ...options };

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => ({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    connectionType: null,
    effectiveType: null,
    downlink: null,
    rtt: null,
  }));

  const [wasOffline, setWasOffline] = useState(false);
  const [offlineToastId, setOfflineToastId] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastOfflineTime, setLastOfflineTime] = useState<number | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const toastShownRef = useRef(false);

  // Get connection info if available - stable reference
  const getConnectionInfo = useRef((): Partial<NetworkStatus> => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      return {
        connectionType: connection.type || null,
        effectiveType: connection.effectiveType || null,
        downlink: connection.downlink || null,
        rtt: connection.rtt || null,
      };
    }

    return {
      connectionType: null,
      effectiveType: null,
      downlink: null,
      rtt: null,
    };
  }).current;

  // Update network status - stable reference
  const updateNetworkStatus = useRef((isOnline: boolean) => {
    const connectionInfo = getConnectionInfo();
    const newStatus: NetworkStatus = {
      isOnline,
      isOffline: !isOnline,
      ...connectionInfo,
    };

    setNetworkStatus(newStatus);
    optsRef.current.onConnectionChange?.(newStatus);
  }).current;

  // Handle going online - stable reference
  const handleOnline = useRef(() => {
    updateNetworkStatus(true);
    
    if (wasOffline) {
      setWasOffline(false);
      setReconnectAttempts(0);
      setLastOfflineTime(null);
      toastShownRef.current = false;
      
      // Clear offline toast
      if (offlineToastId) {
        toast.dismiss(offlineToastId);
        setOfflineToastId(null);
      }
      
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Only show success toast if we were actually offline for a meaningful time
      if (optsRef.current.showToasts && lastOfflineTime && Date.now() - lastOfflineTime > 2000) {
        toast.success('Connection restored', {
          duration: 3000,
          position: 'bottom-center',
          icon: '🌐',
        });
      }

      optsRef.current.onOnline?.();
    }
  }).current;

  // Handle going offline - stable reference
  const handleOffline = useRef(() => {
    updateNetworkStatus(false);
    
    if (!wasOffline) {
      setWasOffline(true);
      setLastOfflineTime(Date.now());
      
      // Debounce offline toast to prevent flickering
      setTimeout(() => {
        if (!navigator.onLine && !toastShownRef.current) {
          toastShownRef.current = true;
          
          if (optsRef.current.showToasts) {
            const toastId = toast.error('No internet connection', {
              duration: Infinity,
              position: 'bottom-center',
              icon: '📡',
            });
            setOfflineToastId(toastId);
          }
        }
      }, 1000); // Wait 1 second before showing offline toast
    }

    optsRef.current.onOffline?.();
  }).current;

  // Attempt to reconnect
  const attemptReconnect = useCallback(async () => {
    if (reconnectAttempts >= optsRef.current.retryConfig.maxRetries) {
      return false;
    }

    try {
      // Try to fetch a small resource to test connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        handleOnline();
        return true;
      }
    } catch (error) {
      // Connection still not available
    }

    setReconnectAttempts(prev => prev + 1);
    
    // Schedule next retry with exponential backoff
    const delay = Math.min(
      optsRef.current.retryConfig.baseDelay * Math.pow(optsRef.current.retryConfig.backoffFactor, reconnectAttempts),
      optsRef.current.retryConfig.maxDelay
    );

    reconnectTimeoutRef.current = setTimeout(attemptReconnect, delay);
    return false;
  }, [reconnectAttempts, handleOnline]);

  // Manual retry function
  const retry = useCallback(() => {
    if (!networkStatus.isOnline) {
      setReconnectAttempts(0);
      attemptReconnect();
    }
  }, [networkStatus.isOnline, attemptReconnect]);

  useEffect(() => {
    // Initial connection info
    updateNetworkStatus(navigator.onLine);

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Connection change listener (if supported)
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    let connectionChangeHandler: (() => void) | undefined;

    if (connection) {
      connectionChangeHandler = () => {
        updateNetworkStatus(navigator.onLine);
      };
      connection.addEventListener('change', connectionChangeHandler);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection && connectionChangeHandler) {
        connection.removeEventListener('change', connectionChangeHandler);
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Clean up toast on unmount
      if (offlineToastId) {
        toast.dismiss(offlineToastId);
      }
    };
  }, []); // Empty dependency array - handlers are stable refs

  // Start reconnection attempts when going offline
  useEffect(() => {
    if (!networkStatus.isOnline && wasOffline && reconnectAttempts === 0) {
      const delay = optsRef.current.retryConfig.baseDelay;
      reconnectTimeoutRef.current = setTimeout(attemptReconnect, delay);
    }
  }, [networkStatus.isOnline, wasOffline, reconnectAttempts, attemptReconnect]);

  return {
    ...networkStatus,
    wasOffline,
    reconnectAttempts,
    retry,
    isReconnecting: reconnectAttempts > 0 && !networkStatus.isOnline,
  };
}

// Hook for handling network errors with retry logic
export function useNetworkErrorHandler() {
  const { isOnline, retry } = useOnlineStatus();

  const handleNetworkError = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      retries?: number;
      onRetry?: (attempt: number) => void;
      onError?: (error: any, attempt: number) => void;
      showErrorToast?: boolean;
      context?: string;
    } = {}
  ): Promise<T> => {
    const {
      retries = 3,
      onRetry,
      onError,
      showErrorToast = true,
      context = 'Network request',
    } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if it's a network error
        const isNetworkError = 
          error instanceof TypeError && error.message.includes('fetch') ||
          error instanceof Error && (
            error.message.includes('Network') ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('ERR_NETWORK') ||
            error.message.includes('ERR_INTERNET_DISCONNECTED') ||
            error.message.includes('NetworkError')
          );

        if (isNetworkError && !isOnline) {
          // Wait for connection to be restored with timeout
          await new Promise((resolve) => {
            let timeoutId: NodeJS.Timeout;
            const maxWaitTime = 30000; // 30 seconds max wait
            
            const checkConnection = () => {
              if (navigator.onLine) {
                if (timeoutId) clearTimeout(timeoutId);
                resolve(void 0);
              } else {
                timeoutId = setTimeout(checkConnection, 1000);
              }
            };
            
            // Set overall timeout
            setTimeout(() => {
              if (timeoutId) clearTimeout(timeoutId);
              resolve(void 0);
            }, maxWaitTime);
            
            checkConnection();
          });
        }

        if (attempt <= retries) {
          onRetry?.(attempt);
          
          // Exponential backoff with jitter
          const baseDelay = 1000 * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 0.1 * baseDelay;
          const delay = Math.min(baseDelay + jitter, 10000);
          
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          onError?.(error, attempt);
          
          if (showErrorToast && isNetworkError) {
            toast.error(`${context} failed. ${isOnline ? 'Please try again.' : 'Check your connection.'}`, {
              duration: 5000,
              action: {
                label: 'Retry',
                onClick: retry,
              },
            });
          }
        }
      }
    }

    throw lastError;
  }, [isOnline, retry]);

  return { handleNetworkError, isOnline, retry };
}

// Hook for offline-first data management
export function useOfflineData<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline } = useOnlineStatus();
  const { handleNetworkError } = useNetworkErrorHandler();

  // Load data from localStorage
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(`offline_${key}`);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        // Check if cache is not too old (24 hours)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setData(cachedData);
          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to load cached data:', error);
    }
    return false;
  }, [key]);

  // Save data to localStorage
  const saveToCache = useCallback((data: T) => {
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }, [key]);

  // Fetch data with network error handling
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await handleNetworkError(fetcher, {
        retries: 3,
        showErrorToast: false, // Handle toast manually
        context: `Loading ${key}`,
      });
      
      setData(result);
      saveToCache(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      
      // Try to load from cache if online fetch fails
      const hasCache = loadFromCache();
      
      if (!hasCache) {
        toast.error(`Failed to load ${key}. ${isOnline ? 'Please try again.' : 'Using offline mode.'}`, {
          duration: 4000,
        });
      } else {
        toast('Using cached data', {
          duration: 2000,
          icon: '📱',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [fetcher, handleNetworkError, loadFromCache, saveToCache, key, isOnline]);

  // Initial load
  useEffect(() => {
    if (isOnline) {
      fetchData();
    } else {
      const hasCache = loadFromCache();
      if (!hasCache) {
        setError(new Error('No cached data available offline'));
      }
    }
  }, [isOnline, fetchData, loadFromCache]);

  // Refetch when coming back online (but only if we have stale data)
  useEffect(() => {
    if (isOnline && data && wasOffline) {
      fetchData();
    }
  }, [isOnline, fetchData, data]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isStale: !isOnline && data !== null,
  };
}
