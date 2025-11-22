import { Request, Response, NextFunction } from 'express';
import { User } from '@/models/User';
import { verifyToken } from '@/utils/jwt';
import { AppError } from './errorHandler';
import { getCache, setCache } from '@/config/redis';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next(new AppError('Access token is required', 401));
    }

    // Verify token
    const decoded = verifyToken(token);
    
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

    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Invalid token', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Check if user has primary role or any of the additional roles
    const userRoles = req.user.roles && req.user.roles.length > 0 
      ? req.user.roles 
      : [req.user.role];
    
    const hasPermission = userRoles.some((userRole: string) => roles.includes(userRole));

    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

// Aliases for compatibility
export const protect = authenticate;
export const restrictTo = authorize;