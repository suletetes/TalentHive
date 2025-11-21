import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    // Check if user has any of the required roles
    const userRoles = req.user.roles || [req.user.role];
    const hasRole = userRoles.some((role: string) => roles.includes(role));

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
