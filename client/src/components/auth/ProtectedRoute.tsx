import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Alert, Button, CircularProgress, Typography } from '@mui/material';
import { RootState } from '@/store';
import { UserRole } from '@/types/auth';
import { SecurityUtils } from '@/utils/envValidation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermissions?: string[];
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requiredPermissions = [],
  fallbackPath = '/dashboard'
}) => {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useSelector((state: RootState) => state.auth);
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Rate limiter for retry attempts
  const rateLimiter = SecurityUtils.createRateLimiter(3, 60000); // 3 attempts per minute

  useEffect(() => {
    // Clear error when authentication state changes
    if (isAuthenticated && user) {
      setAuthError(null);
      setRetryCount(0);
    }
  }, [isAuthenticated, user]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Verifying authentication...
        </Typography>
      </Box>
    );
  }

  // Handle authentication failure
  if (!isAuthenticated) {
    // Log security event
    console.warn('Unauthorized access attempt:', {
      path: location.pathname,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });

    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle missing user data (edge case)
  if (!user) {
    setAuthError('User data not available. Please try logging in again.');
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => window.location.href = '/login'}
            >
              Login
            </Button>
          }
        >
          Authentication error. Please log in again.
        </Alert>
      </Box>
    );
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    // Log unauthorized role access attempt
    console.warn('Insufficient role access attempt:', {
      path: location.pathname,
      userRole: user.role,
      requiredRole,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    // Show error message with retry option for potential temporary issues
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="warning"
          action={
            retryCount < 3 && (
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => {
                  if (rateLimiter()) {
                    setRetryCount(prev => prev + 1);
                    window.location.reload();
                  } else {
                    setAuthError('Too many retry attempts. Please wait before trying again.');
                  }
                }}
              >
                Retry
              </Button>
            )
          }
        >
          <Typography variant="body2">
            Access denied. You don't have permission to view this page.
            {user.role === 'user' && requiredRole === 'admin' && (
              <> Contact an administrator if you believe this is an error.</>
            )}
          </Typography>
        </Alert>
        
        {authError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {authError}
          </Alert>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => window.history.back()}
            sx={{ mr: 1 }}
          >
            Go Back
          </Button>
          <Button 
            variant="contained" 
            onClick={() => window.location.href = fallbackPath}
          >
            Go to Dashboard
          </Button>
        </Box>
      </Box>
    );
  }

  // Check permission-based access
  if (requiredPermissions.length > 0) {
    const userPermissions = user.permissions || [];
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermissions) {
      // Log permission access attempt
      console.warn('Insufficient permissions access attempt:', {
        path: location.pathname,
        userPermissions,
        requiredPermissions,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="warning">
            <Typography variant="body2">
              You don't have the required permissions to access this page.
              Required permissions: {requiredPermissions.join(', ')}
            </Typography>
          </Alert>
          
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => window.history.back()}
              sx={{ mr: 1 }}
            >
              Go Back
            </Button>
            <Button 
              variant="contained" 
              onClick={() => window.location.href = fallbackPath}
            >
              Go to Dashboard
            </Button>
          </Box>
        </Box>
      );
    }
  }

  // All checks passed, render protected content
  return <>{children}</>;
};

// Higher-order component for role-based protection
export const withRoleProtection = (
  Component: React.ComponentType<any>,
  requiredRole: UserRole,
  fallbackPath?: string
) => {
  return (props: any) => (
    <ProtectedRoute requiredRole={requiredRole} fallbackPath={fallbackPath}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Higher-order component for permission-based protection
export const withPermissionProtection = (
  Component: React.ComponentType<any>,
  requiredPermissions: string[],
  fallbackPath?: string
) => {
  return (props: any) => (
    <ProtectedRoute requiredPermissions={requiredPermissions} fallbackPath={fallbackPath}>
      <Component {...props} />
    </ProtectedRoute>
  );
};