import { Request, Response, NextFunction } from 'express';
import { User } from '@/models/User';
import { verifyToken } from '@/utils/jwt';
import { AppError } from './errorHandler';
import { getCache, setCache } from '@/config/redis';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;
  
  try {
    // console.log('[AUTH] authenticate called for:', req.method, req.originalUrl);
    token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // console.log('[AUTH] No token provided');
      return next(new AppError('Access token is required', 401));
    }

    // Verify token
    const decoded = verifyToken(token);
    // console.log('[AUTH] Token decoded, userId:', decoded.userId);
    
    // Check if user exists in cache first
    let user = await getCache(`user:${decoded.userId}`);
    
    if (!user) {
      // If not in cache, fetch from database
      user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return next(new AppError('User not found', 401));
      }
      
      // Cache user for 15 minutes
      await setCache(`user:${decoded.userId}`, user, 900);
    }
    
    if (!user.isActive) {
      return next(new AppError('Account is deactivated', 401));
    }

    // Check account status (suspended or deactivated)
    if (user.accountStatus === 'suspended') {
      return next(new AppError('Your account has been suspended. Please contact support for assistance.', 403));
    }

    if (user.accountStatus === 'deactivated') {
      return next(new AppError('Your account has been deactivated. Please contact support to reactivate your account.', 403));
    }

    req.user = user;
    next();
  } catch (error: any) {
    // Skip logging for polling endpoints to reduce noise
    const isPollingEndpoint = req.originalUrl.includes('/unread-count') || 
                              req.originalUrl.includes('/conversations');
    
    if (!isPollingEndpoint) {
      console.log('  [AUTH] Token verification failed');
      console.log('  [AUTH] Token preview:', token?.substring(0, 20) + '...');
      console.log('  [AUTH] Error:', error.message);
      console.log('  [AUTH] URL:', req.originalUrl);
    }
    
    // Provide more specific error messages
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    } else if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    
    next(new AppError('Authentication failed', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // console.log('[AUTH] authorize called for roles:', roles);
    // console.log('[AUTH] req.user:', req.user ? { id: req.user._id, role: req.user.role, roles: req.user.roles } : 'NO USER');
    
    if (!req.user) {
      // console.log('[AUTH] REJECTED: No user on request');
      return next(new AppError('Authentication required', 401));
    }

    // Check if user has primary role or any of the additional roles
    const userRoles = req.user.roles && req.user.roles.length > 0 
      ? req.user.roles 
      : [req.user.role];
    
    // console.log('[AUTH] userRoles:', userRoles);
    
    const hasPermission = userRoles.some((userRole: string) => roles.includes(userRole));
    // console.log('[AUTH] hasPermission:', hasPermission);

    if (!hasPermission) {
      // console.log('[AUTH] REJECTED: Insufficient permissions');
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

// Lenient authentication for logout - allows expired tokens
export const authenticateForLogout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next(new AppError('Access token is required', 401));
    }

    // Try to verify token, but don't fail if expired
    try {
      const decoded = verifyToken(token);
      let user = await getCache(`user:${decoded.userId}`);
      
      if (!user) {
        user = await User.findById(decoded.userId).select('-password');
      }
      
      if (user) {
        req.user = user;
      }
    } catch (tokenError: any) {
      // If token is expired or invalid, allow logout anyway
      console.log('Token verification failed for logout, but allowing:', tokenError.message);
    }

    next();
  } catch (error) {
    next(new AppError('Invalid token', 401));
  }
};

// Aliases for compatibility
export const protect = authenticate;
export const restrictTo = authorize;