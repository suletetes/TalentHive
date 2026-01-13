/**
 * Secure authentication storage utilities
 */

import { store } from '@/store';
import { logout } from '@/store/slices/authSlice';

// Keys for localStorage
const AUTH_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
  LAST_ACTIVITY: 'auth_last_activity',
} as const;

/**
 * Securely store authentication tokens
 */
export function storeAuthTokens(token: string, refreshToken: string): void {
  try {
    localStorage.setItem(AUTH_KEYS.TOKEN, token);
    localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(AUTH_KEYS.LAST_ACTIVITY, Date.now().toString());
  } catch (error) {
    console.error('[AUTH STORAGE] Failed to store tokens:', error);
  }
}

/**
 * Retrieve stored authentication tokens
 */
export function getStoredAuthTokens(): { token: string | null; refreshToken: string | null } {
  try {
    return {
      token: localStorage.getItem(AUTH_KEYS.TOKEN),
      refreshToken: localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN),
    };
  } catch (error) {
    console.error('[AUTH STORAGE] Failed to retrieve tokens:', error);
    return { token: null, refreshToken: null };
  }
}

/**
 * Clear all authentication data from storage
 */
export function clearAuthStorage(): void {
  try {
    Object.values(AUTH_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Also clear any other auth-related data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('auth_') || key.startsWith('user_'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('[AUTH STORAGE] Cleared all authentication data');
  } catch (error) {
    console.error('[AUTH STORAGE] Failed to clear auth storage:', error);
  }
}

/**
 * Update last activity timestamp
 */
export function updateLastActivity(): void {
  try {
    localStorage.setItem(AUTH_KEYS.LAST_ACTIVITY, Date.now().toString());
  } catch (error) {
    console.error('[AUTH STORAGE] Failed to update last activity:', error);
  }
}

/**
 * Get last activity timestamp
 */
export function getLastActivity(): number | null {
  try {
    const timestamp = localStorage.getItem(AUTH_KEYS.LAST_ACTIVITY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error('[AUTH STORAGE] Failed to get last activity:', error);
    return null;
  }
}

/**
 * Check if session has expired based on inactivity
 */
export function isSessionExpired(maxInactiveMinutes: number = 60): boolean {
  const lastActivity = getLastActivity();
  if (!lastActivity) return true;
  
  const now = Date.now();
  const maxInactiveMs = maxInactiveMinutes * 60 * 1000;
  
  return (now - lastActivity) > maxInactiveMs;
}

/**
 * Validate stored tokens and clean up if invalid
 */
export function validateStoredTokens(): boolean {
  const { token, refreshToken } = getStoredAuthTokens();
  
  if (!token || !refreshToken) {
    clearAuthStorage();
    return false;
  }
  
  try {
    // Basic JWT structure validation (header.payload.signature)
    const tokenParts = token.split('.');
    const refreshTokenParts = refreshToken.split('.');
    
    if (tokenParts.length !== 3 || refreshTokenParts.length !== 3) {
      console.warn('[AUTH STORAGE] Invalid token structure detected');
      clearAuthStorage();
      return false;
    }
    
    // Check if tokens are expired (basic check without verification)
    const tokenPayload = JSON.parse(atob(tokenParts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // If access token is expired, that's okay - refresh will handle it
    // But if refresh token is expired, we need to logout
    const refreshPayload = JSON.parse(atob(refreshTokenParts[1]));
    if (refreshPayload.exp && refreshPayload.exp < now) {
      console.warn('[AUTH STORAGE] Refresh token expired');
      clearAuthStorage();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[AUTH STORAGE] Token validation failed:', error);
    clearAuthStorage();
    return false;
  }
}

/**
 * Secure logout with complete cleanup
 */
export function secureLogout(): void {
  try {
    // Clear Redux state
    store.dispatch(logout());
    
    // Clear local storage
    clearAuthStorage();
    
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('auth') || name.includes('user')) {
            caches.delete(name);
          }
        });
      });
    }
    
    console.log('[AUTH STORAGE] Secure logout completed');
  } catch (error) {
    console.error('[AUTH STORAGE] Secure logout failed:', error);
  }
}

/**
 * Initialize authentication state from storage
 */
export function initializeAuthFromStorage(): boolean {
  try {
    if (!validateStoredTokens()) {
      return false;
    }
    
    // Check session expiry
    if (isSessionExpired()) {
      console.log('[AUTH STORAGE] Session expired due to inactivity');
      secureLogout();
      return false;
    }
    
    // Update activity timestamp
    updateLastActivity();
    
    return true;
  } catch (error) {
    console.error('[AUTH STORAGE] Failed to initialize auth from storage:', error);
    secureLogout();
    return false;
  }
}

/**
 * Set up activity tracking
 */
export function setupActivityTracking(): void {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  const updateActivity = () => {
    updateLastActivity();
  };
  
  // Throttle activity updates to avoid excessive localStorage writes
  let lastUpdate = 0;
  const throttledUpdate = () => {
    const now = Date.now();
    if (now - lastUpdate > 60000) { // Update at most once per minute
      lastUpdate = now;
      updateActivity();
    }
  };
  
  events.forEach(event => {
    document.addEventListener(event, throttledUpdate, true);
  });
  
  // Check for session expiry periodically
  const checkSessionExpiry = () => {
    const state = store.getState();
    if (state.auth.isAuthenticated && isSessionExpired()) {
      console.log('[AUTH STORAGE] Session expired, logging out');
      secureLogout();
      window.location.href = '/login';
    }
  };
  
  // Check every 5 minutes
  setInterval(checkSessionExpiry, 5 * 60 * 1000);
}