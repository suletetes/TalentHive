import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { permissionService } from '@/services/permissionService';
import mongoose from 'mongoose';

export interface AuthRequest extends Request {
  user?: any;
}

/**
 * Middleware to require a specific permission
 */
export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      // Check if user has the required permission
      const hasPermission = await permissionService.hasPermission(
        req.user._id,
        permission
      );

      if (!hasPermission) {
        // Log unauthorized access attempt
        console.warn(`Unauthorized access attempt: User ${req.user._id} tried to access ${req.originalUrl} without permission ${permission}`);
        
        return next(new AppError(`Permission denied: ${permission}`, 403));
      }

      next();
    } catch (error) {
      console.error('Error checking permission:', error);
      next(new AppError('Permission check failed', 500));
    }
  };
};

/**
 * Middleware to require any of the specified permissions
 */
export const requireAnyPermission = (...permissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      const hasAnyPermission = await permissionService.hasAnyPermission(
        req.user._id,
        permissions
      );

      if (!hasAnyPermission) {
        console.warn(`Unauthorized access attempt: User ${req.user._id} tried to access ${req.originalUrl} without any of permissions: ${permissions.join(', ')}`);
        
        return next(new AppError(`Permission denied: requires one of [${permissions.join(', ')}]`, 403));
      }

      next();
    } catch (error) {
      console.error('Error checking permissions:', error);
      next(new AppError('Permission check failed', 500));
    }
  };
};

/**
 * Middleware to require all specified permissions
 */
export const requireAllPermissions = (...permissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      const hasAllPermissions = await permissionService.hasAllPermissions(
        req.user._id,
        permissions
      );

      if (!hasAllPermissions) {
        console.warn(`Unauthorized access attempt: User ${req.user._id} tried to access ${req.originalUrl} without all permissions: ${permissions.join(', ')}`);
        
        return next(new AppError(`Permission denied: requires all of [${permissions.join(', ')}]`, 403));
      }

      next();
    } catch (error) {
      console.error('Error checking permissions:', error);
      next(new AppError('Permission check failed', 500));
    }
  };
};

/**
 * Middleware to require admin permissions
 * Checks for admin role or specific admin permissions
 */
export const requireAdminPermission = (permission?: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      // Check if user has admin role
      const userRoles = req.user.roles && req.user.roles.length > 0 
        ? req.user.roles 
        : [req.user.role];

      const isAdmin = userRoles.includes('admin');

      // If specific permission is required, check for it
      if (permission) {
        const hasPermission = await permissionService.hasPermission(
          req.user._id,
          permission
        );

        if (!isAdmin && !hasPermission) {
          console.warn(`Unauthorized admin access attempt: User ${req.user._id} tried to access ${req.originalUrl}`);
          return next(new AppError('Admin permission required', 403));
        }
      } else {
        // Just check for admin role
        if (!isAdmin) {
          console.warn(`Unauthorized admin access attempt: User ${req.user._id} tried to access ${req.originalUrl}`);
          return next(new AppError('Admin role required', 403));
        }
      }

      next();
    } catch (error) {
      console.error('Error checking admin permission:', error);
      next(new AppError('Permission check failed', 500));
    }
  };
};

/**
 * Middleware to check resource ownership
 * Allows access if user owns the resource or has the specified permission
 */
export const requireOwnershipOrPermission = (
  resourceIdParam: string,
  ownerField: string,
  permission: string
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      const resourceId = req.params[resourceIdParam];
      
      // Check if user has the permission
      const hasPermission = await permissionService.hasPermission(
        req.user._id,
        permission
      );

      if (hasPermission) {
        return next();
      }

      // Check if user owns the resource
      // This would need to be implemented based on the specific resource
      // For now, we'll just check if the resource ID matches the user ID
      if (resourceId === req.user._id.toString()) {
        return next();
      }

      console.warn(`Unauthorized access attempt: User ${req.user._id} tried to access resource ${resourceId}`);
      return next(new AppError('Permission denied: not owner and no permission', 403));
    } catch (error) {
      console.error('Error checking ownership or permission:', error);
      next(new AppError('Permission check failed', 500));
    }
  };
};
