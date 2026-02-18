/**
 * Enhanced authentication hook with improved state management
 */

import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect, useState } from 'react';
import { RootState } from '@/store';
import { logout, setTokens, loginSuccess, loginStart, loginFailure } from '@/store/slices/authSlice';
import { 
  secureLogout, 
  validateStoredTokens, 
  isSessionExpired,
  updateLastActivity,
  initializeAuthFromStorage,
  getStoredAuthTokens,
  storeAuthTokens,
} from '@/utils/authStorage';
import { apiCore } from '@/services/api/core';
import { authService } from '@/services/api/auth.service';
import { LoginCredentials, RegisterData } from '@/types/auth';
import { getUserFriendlyErrorMessage } from '@/utils/errorMessages';
import toast from 'react-hot-toast';

export interface UseAuthReturn {
  // State
  user: any;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<boolean>;
  validateSession: () => boolean;
  updateActivity: () => void;
  
  // Loading states
  isLoginLoading: boolean;
  isRegisterLoading: boolean;
  
  // Utilities
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: boolean;
  isFreelancer: boolean;
  isClient: boolean;
}

export function useAuth(): UseAuthReturn {
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  // Initialize auth state from storage on mount
  useEffect(() => {
    if (!authState.isAuthenticated) {
      const isValid = initializeAuthFromStorage();
      if (isValid) {
        const { token, refreshToken } = getStoredAuthTokens();
        if (token && refreshToken) {
          dispatch(setTokens({ token, refreshToken }));
        }
      }
    }
  }, [dispatch, authState.isAuthenticated]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoginLoading(true);
      dispatch(loginStart());

      console.log('[AUTH] Starting login process...');
      const response = await authService.login(credentials);
      console.log('[AUTH] Login response:', response);

      // Backend returns: { status, message, data: { user, tokens } }
      // apiCore.post returns response.data, so we get the whole response object
      let user, tokens;
      
      if (response.data && response.data.user && response.data.tokens) {
        // Standard wrapped response: { status, message, data: { user, tokens } }
        user = response.data.user;
        tokens = response.data.tokens;
      } else if (response.user && response.tokens) {
        // Direct response (shouldn't happen but handle it)
        user = response.user;
        tokens = response.tokens;
      } else {
        throw new Error('Invalid login response format');
      }

      if (!user || !tokens) {
        throw new Error('Missing user or tokens in response');
      }

      // Store tokens securely
      storeAuthTokens(tokens.accessToken, tokens.refreshToken);

      // Update Redux state
      dispatch(loginSuccess({
        user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }));

      console.log('[AUTH] Login successful');
      toast.success('Login successful!');
    } catch (error: any) {
      console.error('[AUTH] Login failed:', error);
      
      const errorMessage = getUserFriendlyErrorMessage(error);
      dispatch(loginFailure());
      toast.error(errorMessage);
      
      throw error;
    } finally {
      setIsLoginLoading(false);
    }
  }, [dispatch]);

  // Register function
  const register = useCallback(async (data: RegisterData): Promise<void> => {
    try {
      setIsRegisterLoading(true);
      dispatch(loginStart());

      console.log('[AUTH] Starting registration process...');
      const response = await authService.register(data);
      console.log('[AUTH] Registration response:', response);

      // Backend returns: { status, message, data: { user, tokens } }
      // apiCore.post returns response.data, so we get the whole response object
      let user, tokens;
      
      // Check if response has the standard format
      if (response.data && response.data.user && response.data.tokens) {
        // Standard wrapped response: { status, message, data: { user, tokens } }
        user = response.data.user;
        tokens = response.data.tokens;
      } else if (response.user && response.tokens) {
        // Direct response (shouldn't happen but handle it)
        user = response.user;
        tokens = response.tokens;
      } else {
        // Registration successful but no tokens (email verification required)
        console.log('[AUTH] Registration successful, email verification required');
        toast.success('Registration successful! Please check your email to verify your account.');
        dispatch(loginFailure());
        return;
      }

      if (user && tokens) {
        // Store tokens securely FIRST
        storeAuthTokens(tokens.accessToken, tokens.refreshToken);

        // Update Redux state
        dispatch(loginSuccess({
          user,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }));

        console.log('[AUTH] Registration and auto-login successful');
        toast.success('Registration successful! Welcome to TalentHive!');
        
        // Navigation will be handled by RegisterPage useEffect
      } else {
        console.log('[AUTH] Registration successful, please verify email');
        toast.success('Registration successful! Please check your email to verify your account.');
        dispatch(loginFailure());
      }
    } catch (error: any) {
      console.error('[AUTH] Registration failed:', error);
      
      const errorMessage = getUserFriendlyErrorMessage(error);
      dispatch(loginFailure());
      toast.error(errorMessage);
      
      throw error;
    } finally {
      setIsRegisterLoading(false);
    }
  }, [dispatch]);

  // Secure logout function
  const handleLogout = useCallback(() => {
    secureLogout();
  }, []);

  // Refresh tokens function
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      const { refreshToken } = getStoredAuthTokens();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiCore.post('/auth/refresh-token', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;

      dispatch(setTokens({
        token: accessToken,
        refreshToken: newRefreshToken,
      }));

      return true;
    } catch (error) {
      console.error('[USE AUTH] Token refresh failed:', error);
      handleLogout();
      return false;
    }
  }, [dispatch, handleLogout]);

  // Validate current session
  const validateSession = useCallback((): boolean => {
    if (!authState.isAuthenticated) {
      return false;
    }

    // Check if tokens are valid
    if (!validateStoredTokens()) {
      handleLogout();
      return false;
    }

    // Check session expiry
    if (isSessionExpired()) {
      console.log('[USE AUTH] Session expired due to inactivity');
      handleLogout();
      return false;
    }

    return true;
  }, [authState.isAuthenticated, handleLogout]);

  // Update user activity
  const updateActivity = useCallback(() => {
    if (authState.isAuthenticated) {
      updateLastActivity();
    }
  }, [authState.isAuthenticated]);

  // Role checking utilities
  const hasRole = useCallback((role: string): boolean => {
    if (!authState.user) return false;
    
    const userRoles = authState.user.roles && authState.user.roles.length > 0 
      ? authState.user.roles 
      : [authState.user.role];
    
    return userRoles.includes(role);
  }, [authState.user]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  }, [hasRole]);

  // Computed role flags
  const isAdmin = hasRole('admin');
  const isFreelancer = hasRole('freelancer');
  const isClient = hasRole('client');

  return {
    // State
    user: authState.user,
    token: authState.token,
    refreshToken: authState.refreshToken,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    
    // Actions
    login,
    register,
    logout: handleLogout,
    refreshTokens,
    validateSession,
    updateActivity,
    
    // Loading states
    isLoginLoading,
    isRegisterLoading,
    
    // Utilities
    hasRole,
    hasAnyRole,
    isAdmin,
    isFreelancer,
    isClient,
  };
}

// Hook for checking if user has specific permissions
export function usePermissions() {
  const { user, hasRole, hasAnyRole } = useAuth();

  const canAccessAdmin = hasRole('admin');
  const canManageUsers = hasAnyRole(['admin', 'moderator']);
  const canCreateProjects = hasAnyRole(['client', 'admin']);
  const canSubmitProposals = hasAnyRole(['freelancer', 'admin']);
  const canManageContracts = hasAnyRole(['client', 'freelancer', 'admin']);
  const canAccessReports = hasAnyRole(['admin', 'moderator']);

  return {
    canAccessAdmin,
    canManageUsers,
    canCreateProjects,
    canSubmitProposals,
    canManageContracts,
    canAccessReports,
    user,
  };
}

// Hook for authentication guards
export function useAuthGuard() {
  const { isAuthenticated, validateSession, logout } = useAuth();

  const requireAuth = useCallback(() => {
    if (!isAuthenticated || !validateSession()) {
      logout();
      window.location.href = '/login';
      return false;
    }
    return true;
  }, [isAuthenticated, validateSession, logout]);

  const requireRole = useCallback((role: string) => {
    if (!requireAuth()) return false;
    
    const { hasRole } = useAuth();
    if (!hasRole(role)) {
      console.warn(`[AUTH GUARD] Access denied: required role '${role}'`);
      return false;
    }
    
    return true;
  }, [requireAuth]);

  const requireAnyRole = useCallback((roles: string[]) => {
    if (!requireAuth()) return false;
    
    const { hasAnyRole } = useAuth();
    if (!hasAnyRole(roles)) {
      console.warn(`[AUTH GUARD] Access denied: required roles ${roles.join(', ')}`);
      return false;
    }
    
    return true;
  }, [requireAuth]);

  return {
    requireAuth,
    requireRole,
    requireAnyRole,
  };
}