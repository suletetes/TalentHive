import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    console.log('  Role Authorization Check:');
    console.log('  User:', req.user?.email);
    console.log('  User Role:', req.user?.role);
    console.log('  User Roles Array:', req.user?.roles);
    console.log('  Required Roles:', roles);
    
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    // Check if user has any of the required roles
    const userRoles = req.user.roles || [req.user.role];
    const hasRole = userRoles.some((role: string) => roles.includes(role));

    console.log('  User Roles to Check:', userRoles);
    console.log('  Has Permission:', hasRole);

    if (!hasRole) {
      return next(
        new AppError(
          `Access denied. Required roles: ${roles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};
